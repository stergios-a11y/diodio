#!/usr/bin/env node
/**
 * tools/fix-bypasses.js — Phase B
 *
 * Reads tools/bypass-audit.json (produced by audit-bypasses.js) and applies
 * the verified + auto matches to data/tolls.js. Adds a `confidence` field to
 * every direction so the runtime can warn users about approximate data.
 *
 * Strategy: surgical text replacement, NOT structural rewrite. We find each
 * `exit: { lat: X, lng: Y }` and `entry: { lat: X, lng: Y }` literal in the
 * source and replace just those four numbers. Other lines stay byte-identical
 * so `git diff` shows only what actually changed.
 *
 * Run from the repo root:
 *
 *     node tools/fix-bypasses.js          # writes data/tolls.new.js for review
 *     node tools/fix-bypasses.js --apply  # writes data/tolls.js directly (after backup)
 *
 * Always review the diff before committing.
 */

const fs   = require('fs');
const path = require('path');

const APPLY = process.argv.includes('--apply');

// ── Load inputs ──────────────────────────────────────────────────────────
const auditPath = path.join(__dirname, 'bypass-audit.json');
const tollsPath = path.join(__dirname, '..', 'data', 'tolls.js');

if (!fs.existsSync(auditPath)) {
  console.error(`Missing ${auditPath}`);
  console.error(`Run \`node tools/audit-bypasses.js\` first.`);
  process.exit(1);
}

const audit  = JSON.parse(fs.readFileSync(auditPath, 'utf8'));
const source = fs.readFileSync(tollsPath, 'utf8');
console.log(`Loaded audit (${audit.tolls.length} tolls) + tolls.js (${source.length} bytes)`);

// ── Plan changes ─────────────────────────────────────────────────────────
//
// Walk the audit. For each toll/direction/role (exit|entry):
//   - confidence ∈ {verified, auto}: record a coordinate change to the matched
//     OSM coordinates.
//   - all directions: record the confidence field to be inserted.
//
// We accumulate changes in `plan` and apply them all at the end.
const plan = []; // { tollId, dirKey, role, oldCoord, newCoord, source, confidence }
const dirConfidence = []; // { tollId, dirKey, confidence }

let counts = { coordsChanged: 0, dirsAnnotated: 0, skippedApprox: 0 };

for (const t of audit.tolls) {
  if (t.skipped || !t.directions) continue;

  for (const d of t.directions) {
    // Decide direction-level confidence: take the worst (lowest) of exit/entry
    const cExit  = d.exit?.confidence  || 'approximate';
    const cEntry = d.entry?.confidence || 'approximate';
    const order = { verified: 3, auto: 2, approximate: 1 };
    const dirConf = order[cExit] <= order[cEntry] ? cExit : cEntry;
    dirConfidence.push({ tollId: t.id, dirKey: d.direction, confidence: dirConf });
    counts.dirsAnnotated++;

    for (const role of ['exit', 'entry']) {
      const r = d[role];
      if (!r) continue;
      if (r.confidence === 'verified' || r.confidence === 'auto') {
        if (r.match?.cand) {
          plan.push({
            tollId:  t.id,
            dirKey:  d.direction,
            role,
            oldCoord: r.current,
            newCoord: { lat: r.match.cand.lat, lng: r.match.cand.lng },
            source:   `OSM "${r.match.cand.name}" ${r.match.distFromCurrent.toFixed(2)}km`,
            confidence: r.confidence,
          });
          counts.coordsChanged++;
        }
      } else {
        counts.skippedApprox++;
      }
    }
  }
}

console.log(`Plan: ${counts.coordsChanged} coords to change, ${counts.dirsAnnotated} directions to annotate, ${counts.skippedApprox} approximate endpoints left alone.`);

// ── Apply changes via surgical text replacement ──────────────────────────
//
// For each toll in the audit, we find its block in tolls.js by anchoring on
// `id: "tollId"`. Within that block we then locate each direction's exit/entry
// coord literals and replace them.
//
// The data file uses this shape per direction:
//   north: {
//     label: "...",
//     exit_name: "...",
//     entry_name: "...",
//     exit:  { lat: 38.1234, lng: 23.5678 },
//     entry: { lat: 38.5678, lng: 23.9012 },
//     minutes: 12,
//     via: ["..."]
//   }
//
// We replace `exit: { lat: NUMBER, lng: NUMBER }` and `entry: { lat: ..., lng: ... }`
// literals using a regex anchored to the role name.

let out = source;

// Group changes by toll for efficiency
const changesByToll = new Map();
for (const change of plan) {
  if (!changesByToll.has(change.tollId)) changesByToll.set(change.tollId, []);
  changesByToll.get(change.tollId).push(change);
}
const annotsByToll = new Map();
for (const a of dirConfidence) {
  if (!annotsByToll.has(a.tollId)) annotsByToll.set(a.tollId, []);
  annotsByToll.get(a.tollId).push(a);
}

// Find the byte range in `out` that belongs to a given toll's object literal,
// from the `id: "tollId"` line through the closing `}` of that toll.
function findTollBlockRange(text, tollId) {
  const idMarker = `id: "${tollId}"`;
  const idIdx = text.indexOf(idMarker);
  if (idIdx === -1) return null;

  // Walk backwards to find the opening `{` of this toll object
  let openIdx = idIdx;
  while (openIdx > 0 && text[openIdx] !== '{') openIdx--;

  // Walk forward from openIdx tracking brace depth to find the matching `}`
  let depth = 0;
  let i = openIdx;
  for (; i < text.length; i++) {
    const ch = text[i];
    // Skip strings (avoid braces inside strings)
    if (ch === '"' || ch === "'") {
      const quote = ch;
      i++;
      while (i < text.length && text[i] !== quote) {
        if (text[i] === '\\') i++; // skip escape
        i++;
      }
      continue;
    }
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) break;
    }
  }
  return { start: openIdx, end: i + 1 };
}

// Find the byte range of a specific direction key inside a toll block.
function findDirectionBlockRange(text, tollStart, tollEnd, dirKey) {
  // Look for `dirKey: {` within the toll's range
  const re = new RegExp(`\\b${dirKey}\\s*:\\s*\\{`, 'g');
  re.lastIndex = tollStart;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index >= tollEnd) return null;
    const openIdx = m.index + m[0].length - 1; // position of `{`
    let depth = 1;
    let i = openIdx + 1;
    for (; i < tollEnd; i++) {
      const ch = text[i];
      if (ch === '"' || ch === "'") {
        const quote = ch;
        i++;
        while (i < tollEnd && text[i] !== quote) {
          if (text[i] === '\\') i++;
          i++;
        }
        continue;
      }
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) break;
      }
    }
    return { start: m.index, end: i + 1, openBraceIdx: openIdx };
  }
  return null;
}

// Replace `role: { lat: NUM, lng: NUM }` inside a direction block.
function replaceCoord(text, dirStart, dirEnd, role, newLat, newLng) {
  // Match `role: { lat: <num>, lng: <num> }`. Allow optional decimals/signs.
  const re = new RegExp(
    `(\\b${role}\\s*:\\s*\\{\\s*lat\\s*:\\s*)([\\-0-9.]+)(\\s*,\\s*lng\\s*:\\s*)([\\-0-9.]+)(\\s*\\})`,
    'g'
  );
  re.lastIndex = dirStart;
  const m = re.exec(text);
  if (!m || m.index >= dirEnd) return null;
  const replacement = `${m[1]}${newLat.toFixed(6)}${m[3]}${newLng.toFixed(6)}${m[5]}`;
  return {
    start: m.index,
    end: m.index + m[0].length,
    replacement,
  };
}

// Insert or update a `confidence: "..."` field inside a direction block.
function setConfidence(text, dirStart, dirEnd, openBraceIdx, confidence) {
  // Check if confidence already exists in this direction block
  const existingRe = /\bconfidence\s*:\s*["'][^"']*["']/g;
  existingRe.lastIndex = dirStart;
  const existing = existingRe.exec(text);
  if (existing && existing.index < dirEnd) {
    return {
      start: existing.index,
      end: existing.index + existing[0].length,
      replacement: `confidence: "${confidence}"`,
    };
  }

  // Otherwise insert. We want to put the field at the same indent level as
  // existing fields inside this direction. Find the indent by looking at the
  // first field after the opening brace.
  const afterOpen = text.slice(openBraceIdx + 1);
  const indentMatch = afterOpen.match(/^\s*\n(\s+)/);
  // If single-line block (rare in this dataset), bail out — too risky to mutate
  if (!indentMatch) return null;
  const fieldIndent = indentMatch[1];

  // Insertion point: just before the closing `}`. We need to find the position
  // of the last non-whitespace character before `}` (the previous field's end)
  // and insert after it. We add a comma if one isn't already present.
  const closeIdx = dirEnd - 1; // position of `}`
  let lastChar = closeIdx - 1;
  while (lastChar > openBraceIdx && /\s/.test(text[lastChar])) lastChar--;
  const needsComma = text[lastChar] !== ',';

  // The closing `}` has its own indent (less than fieldIndent). Find that.
  const beforeClose = text.slice(0, closeIdx);
  const closeIndent = beforeClose.match(/\n(\s*)$/)?.[1] ?? '';

  return {
    start: lastChar + 1,
    end: closeIdx, // we replace from after-last-field to just-before-`}`
    replacement: `${needsComma ? ',' : ''}\n${fieldIndent}confidence: "${confidence}"\n${closeIndent}`,
  };
}

// ── Build the list of all edits, then apply them in reverse order ────────
//
// Applying in reverse order keeps earlier offsets valid as we mutate the string.
const edits = [];

for (const tollId of new Set([...changesByToll.keys(), ...annotsByToll.keys()])) {
  const tollRange = findTollBlockRange(out, tollId);
  if (!tollRange) {
    console.warn(`  ! Could not locate toll "${tollId}" in tolls.js — skipping`);
    continue;
  }

  const dirsForThisToll = annotsByToll.get(tollId) || [];
  const coordsForThisToll = changesByToll.get(tollId) || [];

  // Group coord changes by direction key
  const coordsByDir = new Map();
  for (const c of coordsForThisToll) {
    if (!coordsByDir.has(c.dirKey)) coordsByDir.set(c.dirKey, []);
    coordsByDir.get(c.dirKey).push(c);
  }

  // Process each direction inside this toll
  const allDirKeys = new Set([
    ...dirsForThisToll.map(d => d.dirKey),
    ...coordsByDir.keys(),
  ]);

  for (const dirKey of allDirKeys) {
    const dirRange = findDirectionBlockRange(out, tollRange.start, tollRange.end, dirKey);
    if (!dirRange) {
      console.warn(`  ! Could not locate direction "${dirKey}" inside toll "${tollId}"`);
      continue;
    }

    // Coord replacements
    for (const c of (coordsByDir.get(dirKey) || [])) {
      const edit = replaceCoord(out, dirRange.start, dirRange.end, c.role, c.newCoord.lat, c.newCoord.lng);
      if (edit) {
        edits.push({ ...edit, tag: `${tollId}.${dirKey}.${c.role} <- ${c.source}` });
      } else {
        console.warn(`  ! Could not match coord pattern for ${tollId}.${dirKey}.${c.role}`);
      }
    }

    // Confidence annotation
    const annot = dirsForThisToll.find(a => a.dirKey === dirKey);
    if (annot) {
      const edit = setConfidence(out, dirRange.start, dirRange.end, dirRange.openBraceIdx, annot.confidence);
      if (edit) {
        edits.push({ ...edit, tag: `${tollId}.${dirKey} confidence=${annot.confidence}` });
      }
    }
  }
}

// Sort edits by start position descending and apply
edits.sort((a, b) => b.start - a.start);
console.log(`Applying ${edits.length} edits…`);
for (const edit of edits) {
  out = out.slice(0, edit.start) + edit.replacement + out.slice(edit.end);
}

// ── Write output ─────────────────────────────────────────────────────────
const outPath = APPLY ? tollsPath : tollsPath.replace(/\.js$/, '.new.js');

if (APPLY) {
  // Backup first
  const backupPath = tollsPath + '.bak';
  fs.copyFileSync(tollsPath, backupPath);
  console.log(`Backup → ${backupPath}`);
}

fs.writeFileSync(outPath, out);
console.log(`Wrote ${outPath} (${out.length} bytes; was ${source.length})`);

// ── Summary ──────────────────────────────────────────────────────────────
console.log(`\n${counts.coordsChanged} coordinates changed across ${edits.length} edits.`);
console.log(`${counts.dirsAnnotated} directions tagged with confidence field.`);
console.log(`${counts.skippedApprox} approximate endpoints left untouched (their direction will be tagged as confidence: 'approximate').`);

if (!APPLY) {
  console.log(`\nReview the diff:`);
  console.log(`    diff data/tolls.js data/tolls.new.js | less`);
  console.log(`Or open both in your editor side-by-side. When happy:`);
  console.log(`    mv data/tolls.new.js data/tolls.js`);
  console.log(`Or re-run with --apply to overwrite directly (auto-backs-up to data/tolls.js.bak).`);
}
