#!/usr/bin/env node
/**
 * curate-ramps.js — bulk hand-curation of the 4-coord ramp schema.
 *
 * Walks the A1 Athens→Thessaloniki corridor toll-by-toll, direction-by-direction.
 * For each direction, opens a Google Maps URL, prompts you for 4 coords
 * (pre_exit, off_ramp, on_ramp, post_merge), and surgically rewrites
 * data/tolls.js using the Thiva methodology.
 *
 * Resume support: progress saved to tools/.curation-progress.json after every
 * direction. Quit anytime with `q`, restart, pick up where you left off.
 *
 * Usage:
 *   node tools/curate-ramps.js
 *
 * Per-direction prompts:
 *   - Paste any of: "lat, lng" | "lat,lng" | "lat lng"
 *   - Decimal degrees, 4-7 digit precision (Google Maps gives 7)
 *   - After 4 captures: y = save & next, n = redo this direction,
 *     s = skip (won't be re-prompted), q = quit (resumable)
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ─── Configuration ─────────────────────────────────────────────────────────

// A1 Athens→Thessaloniki corridor, in geographic order from south to north.
// thiva is already hand-curated. analipsi, moustheni are flagged as actually
// on A2/Egnatia. evzoni is the border crossing (no Athens↔Thessaloniki bypass).
const CORRIDOR_IDS = [
  'a1_afidnes',
  'a1_traganas',
  'a1_agios_konstantinos',
  'a1_mavromantila',
  'a1_pelasgia',
  'a1_moschochori',
  'a1_makrychori',
  'a1_leptokarya',
  'a1_kleidi',
  'a1_malgara',
];

const REPO_ROOT = path.resolve(__dirname, '..');
const TOLLS_PATH = path.join(REPO_ROOT, 'data', 'tolls.js');
const PROGRESS_PATH = path.join(__dirname, '.curation-progress.json');
const BACKUP_PATH = path.join(REPO_ROOT, 'data', 'tolls.js.bak');

const COORD_FIELDS = ['pre_exit', 'off_ramp', 'on_ramp', 'post_merge'];

// ─── Tiny utilities ────────────────────────────────────────────────────────

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((res) => rl.question(q, (a) => res(a)));

function loadProgress() {
  if (!fs.existsSync(PROGRESS_PATH)) return { done: {}, skipped: {} };
  try {
    return JSON.parse(fs.readFileSync(PROGRESS_PATH, 'utf8'));
  } catch (e) {
    console.warn('  warning: progress file unreadable, starting fresh');
    return { done: {}, skipped: {} };
  }
}

function saveProgress(p) {
  fs.writeFileSync(PROGRESS_PATH, JSON.stringify(p, null, 2));
}

function statusKey(tollId, dirKey) {
  return `${tollId}:${dirKey}`;
}

// ─── Coord parsing ─────────────────────────────────────────────────────────

// Accepts "38.366465, 23.324610" | "38.366465,23.324610" | "38.366465 23.324610"
// Strict: must be two finite floats in valid lat/lng ranges.
function parseCoord(input) {
  const cleaned = input.trim().replace(/[,\s]+/g, ' ');
  const parts = cleaned.split(' ').filter(Boolean);
  if (parts.length !== 2) return null;
  const lat = parseFloat(parts[0]);
  const lng = parseFloat(parts[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  // Sanity check: A1 corridor is roughly lat 38-41, lng 22-24.
  // Warn (don't reject) if way outside — could be a paste error.
  return { lat, lng, suspicious: lat < 37 || lat > 42 || lng < 21 || lng > 25 };
}

// ─── Toll data extraction ─────────────────────────────────────────────────

// We don't parse data/tolls.js as JS (it's not pure JSON). Instead we use
// regex to find each toll block and then a per-direction sub-block. This is
// the same surgical approach Thiva used, just generalized.

function extractTollBlock(source, tollId) {
  // Match `id: "tollid",` then capture the enclosing object literal.
  // Each toll is `  { ... },` at top-level — we find the opening `  {` before
  // the id and walk braces to find the matching close.
  const idRegex = new RegExp(`id:\\s*"${tollId}"`, 'm');
  const m = source.match(idRegex);
  if (!m) return null;

  // Walk backwards from the id match to find the opening `{` of the toll obj.
  let openIdx = source.lastIndexOf('{', m.index);
  if (openIdx === -1) return null;

  // Walk forward, tracking brace depth (string-aware would be safer, but our
  // data file has no `{` or `}` inside string values).
  let depth = 0;
  let closeIdx = -1;
  for (let i = openIdx; i < source.length; i++) {
    const c = source[i];
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) { closeIdx = i; break; }
    }
  }
  if (closeIdx === -1) return null;

  return {
    start: openIdx,
    end: closeIdx + 1,
    text: source.slice(openIdx, closeIdx + 1),
  };
}

function parseTollMeta(blockText) {
  // Pull name_en, lat, lng for display.
  // The toll-level lat/lng appear on a single line: `    lat: 38.17, lng: 23.85,`
  // — not the same as ramp coords which are inside `{ ... }`.
  const name = (blockText.match(/name_en:\s*"([^"]+)"/) || [])[1] || 'Unknown';
  const llMatch = blockText.match(/^\s*lat:\s*([-\d.]+),\s*lng:\s*([-\d.]+)\s*,/m);
  const lat = llMatch ? parseFloat(llMatch[1]) : NaN;
  const lng = llMatch ? parseFloat(llMatch[2]) : NaN;
  return { name, lat, lng };
}

function extractDirectionBlock(tollText, dirKey) {
  // Find e.g. `north: {` or `south: {` then walk braces.
  const re = new RegExp(`(^|[\\s,])${dirKey}:\\s*\\{`, 'm');
  const m = tollText.match(re);
  if (!m) return null;
  const openIdx = tollText.indexOf('{', m.index);
  let depth = 0, closeIdx = -1;
  for (let i = openIdx; i < tollText.length; i++) {
    const c = tollText[i];
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) { closeIdx = i; break; } }
  }
  if (closeIdx === -1) return null;
  return {
    start: openIdx,
    end: closeIdx + 1,
    text: tollText.slice(openIdx, closeIdx + 1),
  };
}

function parseDirectionMeta(dirText) {
  const label = (dirText.match(/label:\s*"([^"]+)"/) || [])[1] || '(no label)';
  const exit = (dirText.match(/exit_name:\s*"([^"]+)"/) || [])[1] || '?';
  const entry = (dirText.match(/entry_name:\s*"([^"]+)"/) || [])[1] || '?';
  const conf = (dirText.match(/confidence:\s*"([^"]+)"/) || [])[1] || '(none)';
  const coords = {};
  for (const f of COORD_FIELDS) {
    const m = dirText.match(new RegExp(`${f}:\\s*\\{\\s*lat:\\s*([-\\d.]+),\\s*lng:\\s*([-\\d.]+)\\s*\\}`));
    if (m) coords[f] = { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
  }
  // Old-schema fallback: if pre_exit/post_merge missing, surface the legacy
  // exit:/entry: coords as "was" hints. Only off_ramp and on_ramp get hints
  // (they correspond to exit and entry); pre_exit and post_merge stay (none).
  if (!coords.off_ramp || !coords.on_ramp) {
    const legacyExit = dirText.match(/\bexit:\s*\{\s*lat:\s*([-\d.]+),\s*lng:\s*([-\d.]+)\s*\}/);
    const legacyEntry = dirText.match(/\bentry:\s*\{\s*lat:\s*([-\d.]+),\s*lng:\s*([-\d.]+)\s*\}/);
    if (legacyExit && !coords.off_ramp) {
      coords.off_ramp = { lat: parseFloat(legacyExit[1]), lng: parseFloat(legacyExit[2]) };
    }
    if (legacyEntry && !coords.on_ramp) {
      coords.on_ramp = { lat: parseFloat(legacyEntry[1]), lng: parseFloat(legacyEntry[2]) };
    }
  }
  return { label, exit, entry, conf, coords };
}

// ─── Surgical write ────────────────────────────────────────────────────────

function rewriteDirection(source, tollId, dirKey, newCoords) {
  // Find the toll block, then the direction sub-block, then replace each
  // of the 4 coord fields. We do this on a substring and splice back in,
  // so we don't accidentally hit another toll's block.
  //
  // Two schema cases handled:
  //   (a) Already-migrated direction has all 4 fields (pre_exit, off_ramp,
  //       on_ramp, post_merge) — we replace each in place.
  //   (b) Old-schema direction has only `exit:` and `entry:` (the 17 tolls
  //       compute-ramp-anchors.js flagged as off-route). We replace the
  //       `exit:`/`entry:` pair with all 4 new fields, preserving everything
  //       else (label, exit_name, entry_name, minutes, via, confidence).
  const toll = extractTollBlock(source, tollId);
  if (!toll) throw new Error(`toll ${tollId} not found`);
  const dir = extractDirectionBlock(toll.text, dirKey);
  if (!dir) throw new Error(`direction ${tollId}:${dirKey} not found`);

  let dirText = dir.text;

  // Detect schema: does this direction have pre_exit?
  const hasNewSchema = /\bpre_exit:/.test(dirText);

  if (hasNewSchema) {
    // Case (a): in-place field-by-field replacement.
    for (const f of COORD_FIELDS) {
      const c = newCoords[f];
      // Capture the whitespace after the colon so we preserve original alignment.
      const re = new RegExp(`(${f}:)(\\s*)\\{\\s*lat:\\s*[-\\d.]+,\\s*lng:\\s*[-\\d.]+\\s*\\}`);
      const m = dirText.match(re);
      if (!m) {
        throw new Error(`field ${f} not found in ${tollId}:${dirKey}`);
      }
      const ws = m[2] || ' ';
      dirText = dirText.replace(re, `$1${ws}{ lat: ${c.lat}, lng: ${c.lng} }`);
    }
  } else {
    // Case (b): old schema. Replace `exit: { ... }, ... entry: { ... },`
    // with all 4 new fields. We match from the `exit:` line through the
    // `entry:` line inclusive (and any trailing comma/newline). Both lines
    // appear together in the data file (Thiva format), so this is safe.
    const oldRe = /(\s*)exit:\s*\{\s*lat:\s*[-\d.]+,\s*lng:\s*[-\d.]+\s*\}\s*,\s*\n\s*entry:\s*\{\s*lat:\s*[-\d.]+,\s*lng:\s*[-\d.]+\s*\}\s*,/;
    const m = dirText.match(oldRe);
    if (!m) {
      throw new Error(`couldn't find old-schema exit:/entry: pair in ${tollId}:${dirKey}`);
    }
    const indent = m[1].replace(/^\n*/, ''); // preserve leading indent of `exit:`
    const c = newCoords;
    const replacement =
      `\n${indent}pre_exit:   { lat: ${c.pre_exit.lat}, lng: ${c.pre_exit.lng} },\n` +
      `${indent}off_ramp:   { lat: ${c.off_ramp.lat}, lng: ${c.off_ramp.lng} },\n` +
      `${indent}on_ramp:    { lat: ${c.on_ramp.lat}, lng: ${c.on_ramp.lng} },\n` +
      `${indent}post_merge: { lat: ${c.post_merge.lat}, lng: ${c.post_merge.lng} },`;
    dirText = dirText.replace(oldRe, replacement);
  }

  // Bump confidence to "verified" since this is now hand-curated.
  if (/confidence:\s*"[^"]+"/.test(dirText)) {
    dirText = dirText.replace(/confidence:\s*"[^"]+"/, 'confidence: "verified"');
  }

  // Splice direction back into toll, then toll back into source.
  const newToll = toll.text.slice(0, dir.start) + dirText + toll.text.slice(dir.end);
  return source.slice(0, toll.start) + newToll + source.slice(toll.end);
}

// ─── UI helpers ────────────────────────────────────────────────────────────

const c = {
  reset: '\x1b[0m', dim: '\x1b[2m', bold: '\x1b[1m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
  blue: '\x1b[34m', cyan: '\x1b[36m', gray: '\x1b[90m',
};

function fmtCoord(co) {
  if (!co) return c.dim + '(none)' + c.reset;
  return `${co.lat.toFixed(6)}, ${co.lng.toFixed(6)}`;
}

function mapsUrl(lat, lng, zoom = 15) {
  // Google Maps URL that opens at the given coords. The `?q=` style drops
  // a pin so it's easy to see the toll location.
  return `https://www.google.com/maps/@${lat},${lng},${zoom}z`;
}

// ─── Main loop ─────────────────────────────────────────────────────────────

async function captureCoord(field, current) {
  while (true) {
    const prompt = `    ${c.bold}${field.padEnd(10)}${c.reset} ${c.gray}(was ${fmtCoord(current)})${c.reset}\n    > `;
    const raw = await ask(prompt);
    const trimmed = raw.trim();
    if (trimmed === '') {
      console.log(`    ${c.yellow}empty input — try again, or 'q'=quit, 's'=skip direction${c.reset}`);
      continue;
    }
    if (trimmed.toLowerCase() === 'q') return { quit: true };
    if (trimmed.toLowerCase() === 's') return { skip: true };
    const parsed = parseCoord(trimmed);
    if (!parsed) {
      console.log(`    ${c.red}couldn't parse — expected "lat, lng" (e.g. 38.366465, 23.324610)${c.reset}`);
      continue;
    }
    if (parsed.suspicious) {
      const ok = await ask(`    ${c.yellow}coords look outside Greece — keep anyway? [y/N] ${c.reset}`);
      if (ok.trim().toLowerCase() !== 'y') continue;
    }
    return { coord: { lat: parsed.lat, lng: parsed.lng } };
  }
}

async function curateDirection(tollMeta, tollId, dirKey, dirMeta) {
  console.log('');
  console.log(`  ${c.cyan}━━ ${dirKey.toUpperCase()}: ${dirMeta.label} ━━${c.reset}`);
  console.log(`  exit: ${dirMeta.exit}  →  entry: ${dirMeta.entry}`);
  console.log(`  current confidence: ${dirMeta.conf}`);
  console.log(`  ${c.blue}${mapsUrl(tollMeta.lat, tollMeta.lng, 15)}${c.reset}`);
  console.log('');
  console.log(`  ${c.dim}Right-click on each ramp surface in Maps, copy coords, paste below.${c.reset}`);
  console.log(`  ${c.dim}Order: pre_exit → off_ramp → on_ramp → post_merge${c.reset}`);
  console.log(`  ${c.dim}At any prompt: 's'=skip this direction, 'q'=quit & save progress.${c.reset}`);
  console.log('');

  while (true) {
    const captured = {};
    let quitting = false, skipped = false;
    for (const f of COORD_FIELDS) {
      const r = await captureCoord(f, dirMeta.coords[f]);
      if (r.quit) { quitting = true; break; }
      if (r.skip) { skipped = true; break; }
      captured[f] = r.coord;
    }
    if (quitting) return { quit: true };
    if (skipped) return { skipped: true };
    console.log('');
    console.log(`  ${c.bold}Review:${c.reset}`);
    for (const f of COORD_FIELDS) {
      console.log(`    ${f.padEnd(10)} ${fmtCoord(captured[f])}`);
    }
    console.log('');
    const choice = (await ask(`  Save? [${c.green}y${c.reset}=save / ${c.yellow}n${c.reset}=redo / ${c.gray}s${c.reset}=skip / ${c.red}q${c.reset}=quit] `)).trim().toLowerCase();
    if (choice === 'y') return { coords: captured };
    if (choice === 's') return { skipped: true };
    if (choice === 'q') return { quit: true };
    // Anything else (incl. 'n') = redo
    console.log(`  ${c.yellow}redoing this direction…${c.reset}`);
  }
}

async function main() {
  console.log(`${c.bold}DIODIO ramp-coord curation tool${c.reset}`);
  console.log(`Corridor: A1 Athens→Thessaloniki (${CORRIDOR_IDS.length} tolls)`);
  console.log('');

  if (!fs.existsSync(TOLLS_PATH)) {
    console.error(`error: ${TOLLS_PATH} not found`);
    process.exit(1);
  }

  // One-shot backup (only if it doesn't exist — preserves the very first state).
  if (!fs.existsSync(BACKUP_PATH)) {
    fs.copyFileSync(TOLLS_PATH, BACKUP_PATH);
    console.log(`${c.dim}backup created: ${BACKUP_PATH}${c.reset}`);
  } else {
    console.log(`${c.dim}backup exists: ${BACKUP_PATH} (not overwriting)${c.reset}`);
  }

  const progress = loadProgress();
  const doneCount = Object.keys(progress.done).length;
  const skippedCount = Object.keys(progress.skipped).length;
  if (doneCount + skippedCount > 0) {
    console.log(`${c.dim}resuming: ${doneCount} done, ${skippedCount} skipped${c.reset}`);
  }
  console.log('');

  outer:
  for (const tollId of CORRIDOR_IDS) {
    // Re-read source on every toll so we always work against the latest state.
    let source = fs.readFileSync(TOLLS_PATH, 'utf8');
    const toll = extractTollBlock(source, tollId);
    if (!toll) {
      console.log(`${c.yellow}skipping ${tollId} — not found in tolls.js${c.reset}`);
      continue;
    }
    const meta = parseTollMeta(toll.text);

    // Find which direction keys exist (north/south, east/west, etc.)
    const dirKeys = [];
    for (const k of ['north', 'south', 'east', 'west']) {
      if (extractDirectionBlock(toll.text, k)) dirKeys.push(k);
    }

    // Skip toll entirely if all directions already done/skipped.
    const allHandled = dirKeys.every((k) => {
      const sk = statusKey(tollId, k);
      return progress.done[sk] || progress.skipped[sk];
    });
    if (allHandled) {
      console.log(`${c.green}✓${c.reset} ${tollId} (${meta.name}) — all directions handled`);
      continue;
    }

    console.log('');
    console.log(`${c.bold}${c.blue}══ ${tollId} — ${meta.name} ══${c.reset}`);

    for (const dirKey of dirKeys) {
      const sk = statusKey(tollId, dirKey);
      if (progress.done[sk]) {
        console.log(`  ${c.green}✓${c.reset} ${dirKey} — already done`);
        continue;
      }
      if (progress.skipped[sk]) {
        console.log(`  ${c.gray}↷${c.reset} ${dirKey} — previously skipped`);
        continue;
      }

      // Re-read the direction's metadata fresh in case earlier passes changed it.
      source = fs.readFileSync(TOLLS_PATH, 'utf8');
      const t2 = extractTollBlock(source, tollId);
      const d2 = extractDirectionBlock(t2.text, dirKey);
      const dirMeta = parseDirectionMeta(d2.text);

      const result = await curateDirection(meta, tollId, dirKey, dirMeta);
      if (result.quit) {
        console.log('');
        console.log(`${c.cyan}quit — progress saved. resume by re-running this script.${c.reset}`);
        rl.close();
        return;
      }
      if (result.skipped) {
        progress.skipped[sk] = new Date().toISOString();
        saveProgress(progress);
        console.log(`  ${c.gray}skipped (won't re-prompt)${c.reset}`);
        continue;
      }

      // Save coords to file.
      try {
        const fresh = fs.readFileSync(TOLLS_PATH, 'utf8');
        const updated = rewriteDirection(fresh, tollId, dirKey, result.coords);
        fs.writeFileSync(TOLLS_PATH, updated);
        progress.done[sk] = new Date().toISOString();
        saveProgress(progress);
        console.log(`  ${c.green}✓ saved${c.reset}`);
      } catch (e) {
        console.error(`  ${c.red}write failed: ${e.message}${c.reset}`);
        const cont = await ask('  continue with next direction? [Y/n] ');
        if (cont.trim().toLowerCase() === 'n') {
          rl.close();
          return;
        }
      }
    }
  }

  console.log('');
  console.log(`${c.bold}${c.green}corridor complete!${c.reset}`);
  const finalProgress = loadProgress();
  console.log(`  done: ${Object.keys(finalProgress.done).length}`);
  console.log(`  skipped: ${Object.keys(finalProgress.skipped).length}`);
  rl.close();
}

main().catch((e) => {
  console.error(`fatal: ${e.message}`);
  rl.close();
  process.exit(1);
});
