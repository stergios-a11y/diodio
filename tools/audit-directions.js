#!/usr/bin/env node
/**
 * tools/audit-directions.js
 *
 * Read-only sanity check on bypass directions in data/tolls.js.
 *
 * For each direction (north / south / east / west) of each toll, verifies:
 *
 *   1. The EXIT ramp is on the correct side of the toll relative to the
 *      direction of travel. For "east" direction (driving eastward), the
 *      exit must be WEST of the toll booth (you encounter it first before
 *      the toll). For "north" direction, exit must be SOUTH of toll. Etc.
 *
 *   2. The ENTRY ramp is on the OPPOSITE side from the exit (you re-join
 *      the motorway AFTER passing the spot where the toll would have been).
 *
 *   3. The bearing from exit → entry roughly aligns with the named
 *      direction (e.g. "east" → bearing somewhere between 45° and 135°).
 *
 * Run from the repo root:
 *
 *     node tools/audit-directions.js
 *
 * Outputs tools/direction-audit.txt and prints a summary.
 *
 * No data is modified. Designed to surface conceptual errors that the
 * earlier OSM-coordinate audit could not detect — e.g. when a bypass's
 * names happen to match OSM places but the bypass goes the wrong way for
 * the direction it claims.
 */

const fs   = require('fs');
const path = require('path');

const tollsPath = path.join(__dirname, '..', 'data', 'tolls.js');
const { TOLL_DATA } = require(tollsPath);

// ── Geometric helpers ───────────────────────────────────────────────────
function haversineKm(a, b) {
  const R = 6371;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x = Math.sin(dLat/2)**2 + Math.sin(dLng/2)**2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(x));
}

function bearingDeg(a, b) {
  const toRad = d => d * Math.PI / 180;
  const toDeg = r => r * 180 / Math.PI;
  const φ1 = toRad(a.lat), φ2 = toRad(b.lat);
  const Δλ = toRad(b.lng - a.lng);
  const y  = Math.sin(Δλ) * Math.cos(φ2);
  const x  = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

// Smallest angular difference between two bearings, in [0, 180].
function bearingDiff(a, b) {
  let d = Math.abs(a - b) % 360;
  if (d > 180) d = 360 - d;
  return d;
}

// Expected bearing for each direction key: direction of travel as a compass
// bearing (0 = north, 90 = east, 180 = south, 270 = west).
const EXPECTED_BEARING = {
  north: 0,
  east:  90,
  south: 180,
  west:  270,
};

// For a given direction key, where should the EXIT ramp be relative to the
// toll? Returns 'south'|'north'|'west'|'east' meaning "exit's lat or lng
// should differ from the toll's in this direction."
//
//   north (going north)  → exit south of toll, entry north of toll
//   south                → exit north,         entry south
//   east  (going east)   → exit west,          entry east
//   west                 → exit east,          entry west
const EXPECTED_EXIT_SIDE = {
  north: 'south',
  south: 'north',
  east:  'west',
  west:  'east',
};
const EXPECTED_ENTRY_SIDE = {
  north: 'north',
  south: 'south',
  east:  'east',
  west:  'west',
};

// Returns the signed difference for the relevant axis (positive = wrong side
// of the expected side, negative = correct side), in km along that axis.
//
// Example: for "east" direction, EXIT should be WEST of toll. We compute
// (cand.lng - toll.lng) converted to km. If positive, candidate is east of
// toll = WRONG SIDE for an east-bound exit. If negative, it's west = CORRECT.
function sideOffsetKm(toll, cand, expectedSide) {
  // 1° of latitude ≈ 111 km. 1° of longitude varies with latitude;
  // at latitude φ, ≈ 111 * cos(φ) km.
  const latKmPerDeg = 111;
  const lngKmPerDeg = 111 * Math.cos(toll.lat * Math.PI / 180);

  switch (expectedSide) {
    case 'north': // candidate should be at HIGHER lat than toll
      return (toll.lat - cand.lat) * latKmPerDeg; // positive = candidate is south = wrong
    case 'south':
      return (cand.lat - toll.lat) * latKmPerDeg;
    case 'east':  // candidate should be at HIGHER lng
      return (toll.lng - cand.lng) * lngKmPerDeg;
    case 'west':
      return (cand.lng - toll.lng) * lngKmPerDeg;
    default:
      return 0;
  }
}

// ── Run audit ───────────────────────────────────────────────────────────

// Tolerance: ignore wrong-side violations smaller than this many km. Real OSM
// coordinates can sit slightly on the "wrong" side of a toll for legitimate
// reasons (motorway curves, ramp geometry). We only flag bypasses where the
// wrong-side offset is meaningful — >1km is unambiguously a data error.
const WRONG_SIDE_TOLERANCE_KM = 1.0;

// Bearing tolerance: we expect exit→entry bearing to match the direction of
// travel within this many degrees. Real motorways curve, so we allow up to
// 60° drift before flagging.
const BEARING_TOLERANCE_DEG = 60;

const issues = []; // { severity, tollId, name, dirKey, axis, problem, ... }
let counts = { ok: 0, warning: 0, critical: 0, total: 0 };

for (const toll of TOLL_DATA) {
  if (!toll.bypass_directions) continue;

  for (const [dirKey, dir] of Object.entries(toll.bypass_directions)) {
    counts.total++;
    if (!EXPECTED_BEARING.hasOwnProperty(dirKey)) {
      issues.push({
        severity: 'warning',
        tollId: toll.id, name: toll.name_en, dirKey,
        problem: `Unknown direction key "${dirKey}" — expected one of north/south/east/west.`,
      });
      counts.warning++;
      continue;
    }

    const tollPos = { lat: toll.lat, lng: toll.lng };
    const exit  = dir.exit;
    const entry = dir.entry;
    if (!exit || !entry) {
      issues.push({
        severity: 'warning',
        tollId: toll.id, name: toll.name_en, dirKey,
        problem: 'Missing exit or entry coordinates.',
      });
      counts.warning++;
      continue;
    }

    // Test 1: exit on the right side of the toll
    const exitWrongOffset = sideOffsetKm(tollPos, exit, EXPECTED_EXIT_SIDE[dirKey]);
    // Test 2: entry on the right side of the toll
    const entryWrongOffset = sideOffsetKm(tollPos, entry, EXPECTED_ENTRY_SIDE[dirKey]);
    // Test 3: bearing alignment
    const actualBearing = bearingDeg(exit, entry);
    const expectedB = EXPECTED_BEARING[dirKey];
    const bearingDelta = bearingDiff(actualBearing, expectedB);

    const dirLabel = dir.label || dirKey;
    let severity = 'ok';
    const problems = [];

    if (exitWrongOffset > WRONG_SIDE_TOLERANCE_KM) {
      severity = 'critical';
      problems.push(`exit "${dir.exit_name}" is ${exitWrongOffset.toFixed(1)}km on the WRONG side of the toll (expected ${EXPECTED_EXIT_SIDE[dirKey]} of toll for ${dirKey}-bound traffic)`);
    }
    if (entryWrongOffset > WRONG_SIDE_TOLERANCE_KM) {
      severity = 'critical';
      problems.push(`entry "${dir.entry_name}" is ${entryWrongOffset.toFixed(1)}km on the WRONG side of the toll (expected ${EXPECTED_ENTRY_SIDE[dirKey]} of toll for ${dirKey}-bound traffic)`);
    }

    // Bearing only counts as a warning if the side tests didn't already
    // flag this as critical (avoid noise — if exit and entry are on the
    // wrong sides, we don't also need to point out the bearing is wrong).
    if (severity === 'ok' && bearingDelta > BEARING_TOLERANCE_DEG) {
      severity = 'warning';
      problems.push(`exit→entry bearing is ${actualBearing.toFixed(0)}°, expected ~${expectedB}° for ${dirKey}-bound (off by ${bearingDelta.toFixed(0)}°)`);
    }

    if (severity === 'ok') {
      counts.ok++;
    } else if (severity === 'warning') {
      counts.warning++;
      issues.push({
        severity, tollId: toll.id, name: toll.name_en, dirKey, dirLabel,
        problems,
        details: {
          tollPos, exit, entry,
          exitName: dir.exit_name, entryName: dir.entry_name,
          actualBearing: actualBearing.toFixed(0),
          expectedBearing: expectedB,
        },
      });
    } else {
      counts.critical++;
      issues.push({
        severity, tollId: toll.id, name: toll.name_en, dirKey, dirLabel,
        problems,
        details: {
          tollPos, exit, entry,
          exitName: dir.exit_name, entryName: dir.entry_name,
          exitWrongOffsetKm: +exitWrongOffset.toFixed(1),
          entryWrongOffsetKm: +entryWrongOffset.toFixed(1),
          actualBearing: actualBearing.toFixed(0),
          expectedBearing: expectedB,
        },
      });
    }
  }
}

// ── Write report ────────────────────────────────────────────────────────
let txt = '';
txt += `Directional sanity audit — ${new Date().toISOString()}\n`;
txt += `${'─'.repeat(72)}\n`;
txt += `Total directions checked: ${counts.total}\n`;
txt += `  OK:        ${counts.ok}  (${(100*counts.ok/counts.total).toFixed(0)}%)\n`;
txt += `  WARNING:   ${counts.warning}  (${(100*counts.warning/counts.total).toFixed(0)}%)\n`;
txt += `  CRITICAL:  ${counts.critical}  (${(100*counts.critical/counts.total).toFixed(0)}%)\n`;
txt += '\n';

if (counts.critical > 0) {
  txt += `═══ CRITICAL ISSUES (bypass goes the wrong way) ═══\n\n`;
  for (const i of issues.filter(x => x.severity === 'critical')) {
    txt += `${i.tollId} · ${i.name}\n`;
    txt += `  ${i.dirLabel} (${i.dirKey}-bound):\n`;
    for (const p of i.problems) txt += `    ✗ ${p}\n`;
    if (i.details) {
      const d = i.details;
      txt += `    toll @ (${d.tollPos.lat.toFixed(5)}, ${d.tollPos.lng.toFixed(5)})\n`;
      txt += `    exit  "${d.exitName}"  @ (${d.exit.lat.toFixed(5)}, ${d.exit.lng.toFixed(5)})\n`;
      txt += `    entry "${d.entryName}" @ (${d.entry.lat.toFixed(5)}, ${d.entry.lng.toFixed(5)})\n`;
    }
    txt += '\n';
  }
}

if (counts.warning > 0) {
  txt += `═══ WARNINGS (bearing off but sides plausible) ═══\n\n`;
  for (const i of issues.filter(x => x.severity === 'warning')) {
    txt += `${i.tollId} · ${i.name}\n`;
    txt += `  ${i.dirLabel} (${i.dirKey}-bound):\n`;
    for (const p of i.problems) txt += `    ⚠ ${p}\n`;
    txt += '\n';
  }
}

if (counts.critical === 0 && counts.warning === 0) {
  txt += `All directions pass directional sanity checks.\n`;
}

const outPath = path.join(__dirname, 'direction-audit.txt');
fs.writeFileSync(outPath, txt);
console.log(`Report → ${outPath}`);

// Also write a structured JSON sibling so review tools can iterate the issues.
const jsonPath = path.join(__dirname, 'direction-audit.json');
fs.writeFileSync(jsonPath, JSON.stringify({
  generated: new Date().toISOString(),
  counts,
  issues,
}, null, 2));
console.log(`JSON   → ${jsonPath}`);
console.log();
console.log(`${counts.ok} OK · ${counts.warning} warnings · ${counts.critical} CRITICAL (of ${counts.total} directions)`);
if (counts.critical > 0) {
  console.log();
  console.log(`⚠ ${counts.critical} directions have bypass coordinates on the wrong side of the toll for the named direction of travel.`);
  console.log(`  These are likely conceptual errors (e.g. eastbound bypass using west-of-toll exits).`);
  console.log(`  See ${outPath} for the list.`);
}
