#!/usr/bin/env node
/**
 * tools/compute-ramp-anchors.js
 *
 * For each toll's bypass_directions, computes pre_exit and post_merge —
 * the four-coord schema's outer anchors — by projecting the off_ramp and
 * on_ramp onto the appropriate reference route from
 * tools/reference-routes.json, then walking 1km backward (for pre_exit)
 * and 1km forward (for post_merge) along that route's actual polyline.
 *
 * The reference route is real Mapbox geometry along the through-motorway
 * in the named direction of travel. So pre_exit and post_merge are
 * guaranteed to be on the motorway, in the correct direction, and clearly
 * separated from the ramps — exactly what's needed for clean Mapbox
 * routing.
 *
 * Validation:
 *   - If the projected ramp is more than ~2km from the reference route,
 *     the toll's data is flagged. Either the ramp coordinate is wrong, or
 *     the toll isn't on the city-to-city route the reference uses, or
 *     OSM coverage is genuinely sparse in that area.
 *   - The walk along the polyline must produce a valid coordinate; if the
 *     polyline is too short to walk 1km, we flag.
 *
 * Run from the repo root:
 *
 *     node tools/compute-ramp-anchors.js          # dry-run, writes data/tolls.new.js
 *     node tools/compute-ramp-anchors.js --apply  # writes data/tolls.js + .bak
 */

const fs   = require('fs');
const path = require('path');

const APPLY = process.argv.includes('--apply');
const STEP_KM = 1.0;
const MAX_PROJECTION_DISTANCE_KM = 2.0;

const tollsPath = path.join(__dirname, '..', 'data', 'tolls.js');
const refsPath  = path.join(__dirname, 'reference-routes.json');

if (!fs.existsSync(refsPath)) {
  console.error(`Missing ${refsPath}. Run \`node tools/build-reference-routes.js\` first.`);
  process.exit(1);
}

const refs   = JSON.parse(fs.readFileSync(refsPath, 'utf8'));
const source = fs.readFileSync(tollsPath, 'utf8');
const { TOLL_DATA } = require(tollsPath);

console.log(`Loaded tolls.js (${source.length} bytes, ${TOLL_DATA.length} tolls) + ${Object.keys(refs.routes).length} reference routes`);

// ── Geometric helpers ───────────────────────────────────────────────────
const R_EARTH_KM = 6371;

function toRad(d) { return d * Math.PI / 180; }
function toDeg(r) { return r * 180 / Math.PI; }

function haversineKm(a, b) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const φ1 = toRad(a.lat), φ2 = toRad(b.lat);
  const x = Math.sin(dLat/2)**2 + Math.sin(dLng/2)**2 * Math.cos(φ1) * Math.cos(φ2);
  return 2 * R_EARTH_KM * Math.asin(Math.sqrt(x));
}

// Project point P onto segment AB. Returns { point: {lat, lng}, distanceKm,
// segmentT: 0-1 representing position along AB, segmentIndex }.
//
// Uses local equirectangular projection (good enough at 1km scale; segment
// lengths in this dataset are typically 50-200m).
function projectOntoSegment(p, a, b) {
  // Convert to local Cartesian (km from a)
  const latKm = (deg) => deg * 111;
  const lngKm = (deg, refLat) => deg * 111 * Math.cos(toRad(refLat));
  const refLat = (a.lat + b.lat) / 2;
  const ax = 0, ay = 0;
  const bx = lngKm(b.lng - a.lng, refLat);
  const by = latKm(b.lat - a.lat);
  const px = lngKm(p.lng - a.lng, refLat);
  const py = latKm(p.lat - a.lat);
  const segLen2 = bx*bx + by*by;
  let t = segLen2 > 0 ? (px*bx + py*by) / segLen2 : 0;
  t = Math.max(0, Math.min(1, t));
  // Projected point on segment
  const projX = t * bx;
  const projY = t * by;
  const dx = px - projX, dy = py - projY;
  const distKm = Math.sqrt(dx*dx + dy*dy);
  // Convert back to lat/lng
  const projLat = a.lat + projY / 111;
  const projLng = a.lng + projX / (111 * Math.cos(toRad(refLat)));
  return {
    point: { lat: +projLat.toFixed(6), lng: +projLng.toFixed(6) },
    distanceKm: distKm,
    segmentT: t,
  };
}

// Find the nearest point on a polyline to a given target. Returns the
// projection plus the segment index — needed for walking forward/back later.
function nearestOnPolyline(target, polyline) {
  let best = null;
  for (let i = 0; i < polyline.length - 1; i++) {
    const a = { lat: polyline[i][0],     lng: polyline[i][1]     };
    const b = { lat: polyline[i+1][0],   lng: polyline[i+1][1]   };
    const proj = projectOntoSegment(target, a, b);
    if (!best || proj.distanceKm < best.distanceKm) {
      best = { ...proj, segmentIndex: i };
    }
  }
  return best;
}

// Walk N km along the polyline from a starting projection. Direction = +1
// for forward (toward end of polyline), -1 for backward (toward start).
// Returns the {lat, lng} of the resulting point. If the polyline is shorter
// than the requested walk, returns the polyline endpoint.
function walkAlongPolyline(polyline, startProj, direction, km) {
  const segIdx = startProj.segmentIndex;
  const t = startProj.segmentT;
  const { point: startPoint } = startProj;

  let remainingKm = km;
  if (direction > 0) {
    // Forward: from startPoint, finish current segment, then continue to next ones
    let prev = startPoint;
    let i = segIdx;
    // Distance from startPoint to end of current segment
    const segEnd = { lat: polyline[i+1][0], lng: polyline[i+1][1] };
    const distToSegEnd = haversineKm(prev, segEnd);
    if (distToSegEnd >= remainingKm) {
      // Stay within current segment — interpolate
      return interpolateOnSegment(prev, segEnd, remainingKm / distToSegEnd);
    }
    remainingKm -= distToSegEnd;
    prev = segEnd;
    i++;
    while (i < polyline.length - 1 && remainingKm > 0) {
      const next = { lat: polyline[i+1][0], lng: polyline[i+1][1] };
      const segLen = haversineKm(prev, next);
      if (segLen >= remainingKm) {
        return interpolateOnSegment(prev, next, remainingKm / segLen);
      }
      remainingKm -= segLen;
      prev = next;
      i++;
    }
    return prev; // ran off the end
  } else {
    // Backward: from startPoint, finish current segment going back, then continue
    let next = startPoint;
    let i = segIdx;
    const segStart = { lat: polyline[i][0], lng: polyline[i][1] };
    const distToSegStart = haversineKm(next, segStart);
    if (distToSegStart >= remainingKm) {
      return interpolateOnSegment(next, segStart, remainingKm / distToSegStart);
    }
    remainingKm -= distToSegStart;
    next = segStart;
    i--;
    while (i >= 0 && remainingKm > 0) {
      const prev = { lat: polyline[i][0], lng: polyline[i][1] };
      const segLen = haversineKm(next, prev);
      if (segLen >= remainingKm) {
        return interpolateOnSegment(next, prev, remainingKm / segLen);
      }
      remainingKm -= segLen;
      next = prev;
      i--;
    }
    return next;
  }
}

function interpolateOnSegment(a, b, t) {
  return {
    lat: +(a.lat + (b.lat - a.lat) * t).toFixed(6),
    lng: +(a.lng + (b.lng - a.lng) * t).toFixed(6),
  };
}

// ── Map motorway+direction → reference route ID ────────────────────────
function refRouteIdFor(toll, dirKey) {
  const m = toll.highway.toLowerCase(); // a1, a2, a8, e65, etc.
  return `${m}-${dirKey}`;
}

// ── Plan computations ──────────────────────────────────────────────────
const computations = [];
const flagged = [];
let skipped = 0;

for (const toll of TOLL_DATA) {
  if (!toll.bypass_directions) continue;
  for (const [dirKey, dir] of Object.entries(toll.bypass_directions)) {
    if (!dir.exit || !dir.entry) {
      skipped++;
      continue;
    }
    const refId = refRouteIdFor(toll, dirKey);
    const ref = refs.routes[refId];
    if (!ref) {
      flagged.push({
        tollId: toll.id, dirKey,
        problem: `No reference route for ${refId}`,
      });
      continue;
    }
    const off_ramp = { lat: dir.exit.lat,  lng: dir.exit.lng };
    const on_ramp  = { lat: dir.entry.lat, lng: dir.entry.lng };

    const offProj = nearestOnPolyline(off_ramp, ref.coords);
    const onProj  = nearestOnPolyline(on_ramp,  ref.coords);

    if (offProj.distanceKm > MAX_PROJECTION_DISTANCE_KM) {
      flagged.push({
        tollId: toll.id, dirKey,
        problem: `off_ramp (${dir.exit_name}) is ${offProj.distanceKm.toFixed(2)}km from ${refId} — likely not on this route`,
      });
      continue;
    }
    if (onProj.distanceKm > MAX_PROJECTION_DISTANCE_KM) {
      flagged.push({
        tollId: toll.id, dirKey,
        problem: `on_ramp (${dir.entry_name}) is ${onProj.distanceKm.toFixed(2)}km from ${refId} — likely not on this route`,
      });
      continue;
    }

    // pre_exit: walk backward 1km from off-ramp projection
    const pre_exit = walkAlongPolyline(ref.coords, offProj, -1, STEP_KM);
    // post_merge: walk forward 1km from on-ramp projection
    const post_merge = walkAlongPolyline(ref.coords, onProj, +1, STEP_KM);

    computations.push({
      tollId: toll.id, dirKey,
      off_ramp,
      on_ramp,
      pre_exit,
      post_merge,
      refId,
      offProjDistKm: +offProj.distanceKm.toFixed(2),
      onProjDistKm:  +onProj.distanceKm.toFixed(2),
    });
  }
}

console.log(`Plan: ${computations.length} directions computed, ${flagged.length} flagged, ${skipped} skipped (no exit/entry).`);
if (flagged.length > 0) {
  console.log(`\nFLAGGED — won't be migrated, need manual handling:`);
  for (const f of flagged) {
    console.log(`  ${f.tollId} · ${f.dirKey}: ${f.problem}`);
  }
}

// ── Apply via surgical text replacement ────────────────────────────────
let out = source;

function findTollBlockRange(text, tollId) {
  const idMarker = `id: "${tollId}"`;
  const idIdx = text.indexOf(idMarker);
  if (idIdx === -1) return null;
  let openIdx = idIdx;
  while (openIdx > 0 && text[openIdx] !== '{') openIdx--;
  let depth = 0;
  let i = openIdx;
  for (; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"' || ch === "'") {
      const quote = ch;
      i++;
      while (i < text.length && text[i] !== quote) {
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
  return { start: openIdx, end: i + 1 };
}

function findDirectionBlockRange(text, tollStart, tollEnd, dirKey) {
  const re = new RegExp(`\\b${dirKey}\\s*:\\s*\\{`, 'g');
  re.lastIndex = tollStart;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index >= tollEnd) return null;
    const openIdx = m.index + m[0].length - 1;
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

function fmtPair(p) {
  return `{ lat: ${p.lat.toFixed(6)}, lng: ${p.lng.toFixed(6)} }`;
}

const edits = [];

for (const c of computations) {
  const tollRange = findTollBlockRange(out, c.tollId);
  if (!tollRange) {
    console.warn(`  ! Could not locate toll "${c.tollId}"`);
    continue;
  }
  const dirRange = findDirectionBlockRange(out, tollRange.start, tollRange.end, c.dirKey);
  if (!dirRange) {
    console.warn(`  ! Could not locate direction "${c.dirKey}" in "${c.tollId}"`);
    continue;
  }

  // Find `exit:  { lat: ..., lng: ... }` and replace with the four-coord block.
  // Then find `entry: { lat: ..., lng: ... }` and remove it (folded above).
  const exitRe = /\bexit\s*:\s*\{[^}]*\}/g;
  exitRe.lastIndex = dirRange.start;
  const exitMatch = exitRe.exec(out);
  if (!exitMatch || exitMatch.index >= dirRange.end) {
    console.warn(`  ! No 'exit:' line in ${c.tollId}.${c.dirKey}`);
    continue;
  }

  const entryRe = /\bentry\s*:\s*\{[^}]*\}/g;
  entryRe.lastIndex = dirRange.start;
  const entryMatch = entryRe.exec(out);
  if (!entryMatch || entryMatch.index >= dirRange.end) {
    console.warn(`  ! No 'entry:' line in ${c.tollId}.${c.dirKey}`);
    continue;
  }

  const lineStart = out.lastIndexOf('\n', exitMatch.index) + 1;
  const indent = out.slice(lineStart, exitMatch.index);

  const newBlock =
    `pre_exit:   ${fmtPair(c.pre_exit)},\n` +
    `${indent}off_ramp:   ${fmtPair(c.off_ramp)},\n` +
    `${indent}on_ramp:    ${fmtPair(c.on_ramp)},\n` +
    `${indent}post_merge: ${fmtPair(c.post_merge)}`;

  edits.push({
    start: exitMatch.index,
    end:   exitMatch.index + exitMatch[0].length,
    replacement: newBlock,
    tag: `${c.tollId}.${c.dirKey} exit→pre_exit/off_ramp/on_ramp/post_merge`,
  });

  // Remove old `entry:` line (now redundant, info is in the new block above)
  const lineStartEntry = out.lastIndexOf('\n', entryMatch.index) + 1;
  let entryEnd = entryMatch.index + entryMatch[0].length;
  if (out[entryEnd] === ',') entryEnd++;
  if (out[entryEnd] === '\n') entryEnd++;
  edits.push({
    start: lineStartEntry,
    end:   entryEnd,
    replacement: '',
    tag: `${c.tollId}.${c.dirKey} drop entry: line`,
  });
}

// Apply in reverse order to keep offsets valid
edits.sort((a, b) => b.start - a.start);
console.log(`\nApplying ${edits.length} edits...`);
for (const e of edits) {
  out = out.slice(0, e.start) + e.replacement + out.slice(e.end);
}

const outPath = APPLY ? tollsPath : tollsPath.replace(/\.js$/, '.new.js');

if (APPLY) {
  const backupPath = tollsPath + '.bak';
  fs.copyFileSync(tollsPath, backupPath);
  console.log(`Backup → ${backupPath}`);
}

fs.writeFileSync(outPath, out);
console.log(`Wrote ${outPath} (${out.length} bytes; was ${source.length})`);

if (!APPLY) {
  console.log(`\nReview:`);
  console.log(`    diff data/tolls.js data/tolls.new.js | less`);
  console.log(`If happy:`);
  console.log(`    mv data/tolls.new.js data/tolls.js`);
}
