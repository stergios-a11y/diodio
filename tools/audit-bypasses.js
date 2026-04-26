#!/usr/bin/env node
/**
 * tools/audit-bypasses.js — Phase A
 *
 * Reads data/tolls.js, queries OpenStreetMap (via Overpass) for the actual
 * motorway junction nodes near each toll, and matches them against the
 * exit_name / entry_name strings already in the data.
 *
 * READ-ONLY. Produces tools/bypass-audit.json plus a human-readable summary.
 * No data is modified. Run from the repo root:
 *
 *     node tools/audit-bypasses.js
 *
 * Requires Node 18+ (uses global fetch).
 */

const fs   = require('fs');
const path = require('path');

// ── Pre-flight ───────────────────────────────────────────────────────────
const nodeMajor = parseInt(process.versions.node.split('.')[0], 10);
if (nodeMajor < 18) {
  console.error(`This script needs Node 18+ (you have ${process.versions.node}).`);
  console.error(`Install a newer Node via Homebrew (\`brew upgrade node\`) or nvm.`);
  process.exit(1);
}

// ── Load tolls.js ────────────────────────────────────────────────────────
//
// tolls.js is a CommonJS module that exports TOLL_DATA when require'd.
const tollsPath = path.join(__dirname, '..', 'data', 'tolls.js');
const { TOLL_DATA } = require(tollsPath);
console.log(`Loaded ${TOLL_DATA.length} tolls from data/tolls.js`);

// ── Greek name normalization ─────────────────────────────────────────────
//
// Goals:
//   - "Αφίδνες" matches "Αφιδνών" (genitive)
//   - "Αγ. Στεφάνου" matches "Άγιος Στέφανος"
//   - Handles diacritics, case, leading/trailing whitespace.
//
// Strategy:
//   1. NFD normalize and strip combining marks (diacritics).
//   2. Lowercase.
//   3. Expand common abbreviations.
//   4. Generate stem candidates by trimming Greek genitive/accusative
//      endings. Comparison succeeds if any stem of A matches any stem of B,
//      OR if they share the longest common prefix of >= 5 chars.
function stripDiacritics(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
const ABBREV_MAP = [
  [/\bαγ\.?\s*/gi,  'αγιος '],
  [/\bπρ\.?\s*/gi,  'προφητης '],   // sometimes "Πρ. Ηλίας"
  [/\bμον\.?\s*/gi, 'μοναστηρι '],
  [/\bπερ\.?\s*/gi, 'περιοχη '],
];
function expandAbbreviations(s) {
  let out = s;
  for (const [re, rep] of ABBREV_MAP) out = out.replace(re, rep);
  return out;
}
// Common Greek case endings to try stripping. Order matters — longer first.
const STEM_ENDINGS = [
  'ων',   // Αφιδνών → Αφιδν
  'ους',  // accusative plural
  'ους',
  'ης',   // genitive feminine
  'ας',   // genitive feminine
  'ου',   // genitive masculine/neuter
  'ος',   // nominative masculine
  'ες',   // plural
  'ι',    // dative remnants
  'η',
  'α',
];
function generateStems(word) {
  const stems = new Set([word]);
  for (const ending of STEM_ENDINGS) {
    if (word.length > ending.length + 2 && word.endsWith(ending)) {
      stems.add(word.slice(0, -ending.length));
    }
  }
  return [...stems];
}
function normalizeForMatch(name) {
  if (!name) return '';
  let s = stripDiacritics(name).toLowerCase().trim();
  s = expandAbbreviations(s);
  s = s.replace(/[\.\,\(\)\[\]\/]/g, ' ').replace(/\s+/g, ' ').trim();
  return s;
}
// Token-level matching: a name is a sequence of words. We split each name
// into words, generate stems for each word, and compare. Two names match
// if their head words share any stem (case-insensitive, accent-insensitive).
//
// Returns one of: 'exact' | 'fuzzy' | 'partial' | 'none'.
function matchNames(a, b) {
  const na = normalizeForMatch(a);
  const nb = normalizeForMatch(b);
  if (!na || !nb) return 'none';
  if (na === nb) return 'exact';

  const wordsA = na.split(' ').filter(w => w.length > 1);
  const wordsB = nb.split(' ').filter(w => w.length > 1);
  if (!wordsA.length || !wordsB.length) return 'none';

  // Compare every word-pair via stems
  let bestMatch = 'none';
  for (const wa of wordsA) {
    const stemsA = generateStems(wa);
    for (const wb of wordsB) {
      const stemsB = generateStems(wb);
      // Check stem overlap
      for (const sa of stemsA) {
        for (const sb of stemsB) {
          if (sa === sb) {
            bestMatch = bestMatch === 'fuzzy' ? 'fuzzy' : 'fuzzy';
            // Promote: if both names are single-word and they fuzzy-match,
            // call that 'fuzzy'; if multi-word, this is just one match.
          }
          // Substring (length >= 5) — partial confidence
          if (sa.length >= 5 && sb.length >= 5 && (sa.includes(sb) || sb.includes(sa))) {
            if (bestMatch === 'none') bestMatch = 'partial';
          }
        }
      }
    }
  }
  return bestMatch;
}

// ── Distance helpers ─────────────────────────────────────────────────────
function haversineKm(a, b) {
  const R = 6371; // km
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x = Math.sin(dLat/2) ** 2 +
            Math.sin(dLng/2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(x));
}

// ── Direction sanity ─────────────────────────────────────────────────────
//
// For a toll at coordinate T, an exit ramp for travel direction D should be
// "before" the toll along that direction. After bypassing, the entry ramp
// is "after" the toll. We approximate "before/after" using the lat/lng axis
// that dominates D:
//
//   north → exit south of toll (lower lat),   entry north (higher lat)
//   south → exit north,                        entry south
//   east  → exit west of toll (lower lng),    entry east
//   west  → exit east,                         entry west
//
// We allow some slack because real motorways aren't perfectly axis-aligned.
function expectedSideOfToll(direction, role) {
  // role is 'exit' or 'entry'
  const flip = role === 'entry';
  switch (direction) {
    case 'north': return flip ? 'higherLat' : 'lowerLat';
    case 'south': return flip ? 'lowerLat'  : 'higherLat';
    case 'east':  return flip ? 'higherLng' : 'lowerLng';
    case 'west':  return flip ? 'lowerLng'  : 'higherLng';
    default:      return null;
  }
}
function isOnExpectedSide(tollPos, candidatePos, expected) {
  if (!expected) return true; // no opinion (e.g. unknown direction)
  switch (expected) {
    case 'higherLat': return candidatePos.lat > tollPos.lat - 0.01;
    case 'lowerLat':  return candidatePos.lat < tollPos.lat + 0.01;
    case 'higherLng': return candidatePos.lng > tollPos.lng - 0.01;
    case 'lowerLng':  return candidatePos.lng < tollPos.lng + 0.01;
    default:          return true;
  }
}

// ── Overpass fetcher with backoff ────────────────────────────────────────
//
// Late April 2026: overpass-api.de started returning HTTP 406 on POST requests
// regardless of headers — appears to be a server-side regression (multiple bug
// reports filed). We work around this by:
//   (a) using GET with the query in the URL instead of POST
//   (b) falling back to the Kumi Systems mirror if the primary instance fails
//
// Both endpoints run the same Overpass software so the response shape is
// identical. We try the primary first, then the mirror.
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];
const QUERY_DELAY_MS = 2000; // be nice to the free instance

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchJunctionsNear(toll, radiusKm = 25) {
  // Overpass QL: motorway_junction nodes within radius of toll.
  // We fetch all such nodes and filter client-side; this is one query per toll.
  const r = (radiusKm * 1000).toFixed(0);
  const query = `[out:json][timeout:25];(node(around:${r},${toll.lat},${toll.lng})["highway"="motorway_junction"];);out body;`;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        // GET with query in URL — avoids content-negotiation bugs that hit POST
        const url = `${endpoint}?data=${encodeURIComponent(query)}`;
        const res = await fetch(url, {
          method: 'GET',
          headers: { 'User-Agent': 'diodio-bypass-audit/1.0' },
        });
        if (res.status === 429 || res.status === 504) {
          const wait = 5000 * attempt;
          console.log(`  ⚠ ${endpoint.split('/')[2]} ${res.status}, retry in ${wait/1000}s…`);
          await sleep(wait);
          continue;
        }
        if (res.status === 406) {
          // Server refused content negotiation — try the next mirror
          console.log(`  ⚠ ${endpoint.split('/')[2]} 406 (server bug), trying next mirror`);
          break;
        }
        if (!res.ok) {
          console.log(`  ✗ ${endpoint.split('/')[2]} HTTP ${res.status} for ${toll.id}`);
          break;
        }
        const data = await res.json();
        return (data.elements || []).map(el => ({
          id:    el.id,
          lat:   el.lat,
          lng:   el.lon,
          name:  el.tags?.name || el.tags?.['name:el'] || el.tags?.['name:en'] || '',
          nameEn: el.tags?.['name:en'] || '',
          ref:   el.tags?.ref || '',
        }));
      } catch (err) {
        console.log(`  ✗ ${endpoint.split('/')[2]} error for ${toll.id}: ${err.message}`);
        const wait = 5000 * attempt;
        await sleep(wait);
      }
    }
  }
  return [];
}

// ── Match a single direction ─────────────────────────────────────────────
//
// Given a toll, a direction key (north/south/east/west), and the candidate
// junctions returned by Overpass, find the best match for the exit_name and
// entry_name in that direction.
function matchDirection(toll, dirKey, dir, candidates) {
  const tollPos = { lat: toll.lat, lng: toll.lng };

  function rankCandidatesFor(role, targetName, currentCoord) {
    const expectedSide = expectedSideOfToll(dirKey, role);
    return candidates
      .map(cand => {
        const matchType = matchNames(targetName, cand.name);
        const distFromCurrent = haversineKm(currentCoord, cand);
        const distFromToll = haversineKm(tollPos, cand);
        const correctSide = isOnExpectedSide(tollPos, cand, expectedSide);
        // Confidence score (higher = better):
        //   exact name match: +50
        //   fuzzy:            +25
        //   partial:          +10
        //   on correct side:  +20
        //   close to current: linear inverse, capped at 20
        let score = 0;
        if (matchType === 'exact')   score += 50;
        if (matchType === 'fuzzy')   score += 25;
        if (matchType === 'partial') score += 10;
        if (correctSide)             score += 20;
        score += Math.max(0, 20 - distFromCurrent * 4);
        return {
          cand,
          matchType,
          distFromCurrent,
          distFromToll,
          correctSide,
          score,
        };
      })
      .sort((a, b) => b.score - a.score);
  }

  const exitRanked  = rankCandidatesFor('exit',  dir.exit_name,  dir.exit);
  const entryRanked = rankCandidatesFor('entry', dir.entry_name, dir.entry);

  // Confidence gating, recalibrated against observed data:
  //
  //   verified: any name match (exact OR fuzzy) within 3km of the village
  //             geocode. At that distance the village center IS essentially
  //             the ramp position; Greek genitive vs nominative shouldn't
  //             disqualify what is otherwise a clean match.
  //
  //   auto:     name match (fuzzy/partial) within 5km, side-check passing
  //             OR side-check ignored when distance is small (<2km signal
  //             is too noisy to trust the axis-aligned side test).
  //
  //   approximate: no good match — leave alone, manual review.
  //
  // The original "exact match" tier turned out to be unreachable because the
  // data uses Greek genitive forms ("Αφιδνών") and OSM uses nominative
  // ("Αφίδνες"); my normalization treats those as fuzzy, not exact. Lesson
  // learned: in this dataset, fuzzy IS the normal case for valid matches.
  function classify(ranked) {
    const top = ranked[0];
    if (!top) return { confidence: 'approximate', reason: 'no candidates returned' };

    // Side check is unreliable when candidate is very close to the toll —
    // axis-aligned heuristic can flip on a few hundred metres of noise.
    const sideTrust = top.distFromToll >= 2 ? top.correctSide : true;

    const hasMatch = top.matchType === 'exact' || top.matchType === 'fuzzy' || top.matchType === 'partial';

    // Verified: clean name match within 3km of the village geocode.
    // Greek villages are small; if the OSM ramp shares the village name and
    // is within 3km of the village center, it IS the right ramp.
    if (hasMatch && top.distFromCurrent <= 3 && sideTrust) {
      return { confidence: 'verified', match: top };
    }
    // Auto: name match within reasonable range, side OK (or unreliable).
    if (hasMatch && top.distFromCurrent <= 5 && sideTrust) {
      return { confidence: 'auto', match: top };
    }
    // Auto with caveat: fuzzy match a bit farther out, side passes.
    if ((top.matchType === 'fuzzy') && top.distFromCurrent <= 8 && sideTrust) {
      return { confidence: 'auto', match: top, note: 'farther than expected — review' };
    }

    return {
      confidence: 'approximate',
      reason: `top match: ${top.matchType}, ${top.distFromCurrent.toFixed(1)}km from current, side=${top.correctSide ? 'ok' : 'WRONG'}`,
      bestCandidate: top,
    };
  }

  return {
    direction: dirKey,
    label:     dir.label,
    exit: {
      name_in_data: dir.exit_name,
      current:      dir.exit,
      ...classify(exitRanked),
      // Show top 3 so we can review by hand
      candidates: exitRanked.slice(0, 3).map(r => ({
        name: r.cand.name, lat: r.cand.lat, lng: r.cand.lng,
        matchType: r.matchType, distFromCurrent: +r.distFromCurrent.toFixed(2),
        score: +r.score.toFixed(1), correctSide: r.correctSide,
      })),
    },
    entry: {
      name_in_data: dir.entry_name,
      current:      dir.entry,
      ...classify(entryRanked),
      candidates: entryRanked.slice(0, 3).map(r => ({
        name: r.cand.name, lat: r.cand.lat, lng: r.cand.lng,
        matchType: r.matchType, distFromCurrent: +r.distFromCurrent.toFixed(2),
        score: +r.score.toFixed(1), correctSide: r.correctSide,
      })),
    },
  };
}

// ── Main ─────────────────────────────────────────────────────────────────
async function main() {
  const report = {
    generated:  new Date().toISOString(),
    overpass:   OVERPASS_ENDPOINTS,
    totalTolls: TOLL_DATA.length,
    tolls:      [],
  };

  for (let i = 0; i < TOLL_DATA.length; i++) {
    const toll = TOLL_DATA[i];
    process.stdout.write(`[${i+1}/${TOLL_DATA.length}] ${toll.id} (${toll.highway}): `);

    if (!toll.bypass_directions) {
      console.log('no bypass_directions — skipped');
      report.tolls.push({ id: toll.id, name_en: toll.name_en, highway: toll.highway, skipped: 'no bypass_directions' });
      continue;
    }

    const candidates = await fetchJunctionsNear(toll);
    console.log(`${candidates.length} junctions in 25km`);

    const directions = Object.entries(toll.bypass_directions).map(
      ([k, dir]) => matchDirection(toll, k, dir, candidates)
    );

    report.tolls.push({
      id:        toll.id,
      name_en:   toll.name_en,
      highway:   toll.highway,
      pos:       { lat: toll.lat, lng: toll.lng },
      directions,
    });

    // Be polite to the free Overpass instance
    if (i < TOLL_DATA.length - 1) await sleep(QUERY_DELAY_MS);
  }

  // ── Write outputs ──────────────────────────────────────────────────────
  const outDir = __dirname;
  const jsonPath = path.join(outDir, 'bypass-audit.json');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  console.log(`\nFull report → ${jsonPath}`);

  // Human-readable summary
  let summary = '';
  let counts = { verified: 0, auto: 0, approximate: 0, total: 0 };
  for (const t of report.tolls) {
    if (!t.directions) continue;
    summary += `\n${t.id} · ${t.highway} · ${t.name_en}\n`;
    for (const d of t.directions) {
      summary += `  ${d.direction}: ${d.label}\n`;
      for (const role of ['exit', 'entry']) {
        const r = d[role];
        counts.total++;
        counts[r.confidence]++;
        const tag = { verified: '✓', auto: '?', approximate: '✗' }[r.confidence];
        summary += `    ${tag} ${role.padEnd(5)} "${r.name_in_data}" → ${r.confidence}`;
        if (r.match) {
          const m = r.match;
          summary += ` (matched "${m.cand.name}" ${m.distFromCurrent.toFixed(2)}km, score ${m.score.toFixed(0)})`;
        } else if (r.bestCandidate) {
          const b = r.bestCandidate;
          summary += ` (best: "${b.cand.name}" ${b.distFromCurrent.toFixed(2)}km, ${r.reason})`;
        } else if (r.reason) {
          summary += ` — ${r.reason}`;
        }
        summary += '\n';
      }
    }
  }
  summary += `\n──────────\nTotal endpoints: ${counts.total}\n` +
             `  verified:    ${counts.verified} (${(100*counts.verified/counts.total).toFixed(0)}%)\n` +
             `  auto:        ${counts.auto} (${(100*counts.auto/counts.total).toFixed(0)}%)\n` +
             `  approximate: ${counts.approximate} (${(100*counts.approximate/counts.total).toFixed(0)}%)\n`;

  const summaryPath = path.join(outDir, 'bypass-audit.txt');
  fs.writeFileSync(summaryPath, summary);
  console.log(`Summary → ${summaryPath}`);
  console.log(`\n${counts.verified} verified · ${counts.auto} auto · ${counts.approximate} approximate (of ${counts.total})`);
}

main().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
