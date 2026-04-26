#!/usr/bin/env node
/**
 * tools/build-reference-routes.js
 *
 * One-shot tool. Calls Mapbox Directions for each motorway × direction in
 * Greece, saves the resulting polylines to tools/reference-routes.json.
 * That file is the foundation for compute-ramp-anchors.js — it lets us
 * find points on the actual through-motorway in the actual direction of
 * travel, rather than synthesizing them from local geometry.
 *
 * Run from the repo root:
 *
 *     node tools/build-reference-routes.js
 *
 * Reads MAPBOX_TOKEN from js/map.js. Writes tools/reference-routes.json
 * (small file, ~50KB, commit it to the repo).
 *
 * Re-runnable. If the file already exists, prompts before overwriting.
 */

const fs   = require('fs');
const path = require('path');

const nodeMajor = parseInt(process.versions.node.split('.')[0], 10);
if (nodeMajor < 18) {
  console.error(`Needs Node 18+ for fetch (you have ${process.versions.node}).`);
  process.exit(1);
}

// Extract the Mapbox token from js/map.js so we don't duplicate it.
const mapJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'map.js'), 'utf8');
const tokMatch = mapJs.match(/MAPBOX_TOKEN\s*=\s*['"]([^'"]+)['"]/);
if (!tokMatch) {
  console.error('Could not find MAPBOX_TOKEN in js/map.js. Aborting.');
  process.exit(1);
}
const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN || tokMatch[1];

// ── Reference-route definitions ────────────────────────────────────────
//
// One pair per (motorway, direction). The route between start and end
// must trace the full extent of the motorway in the named direction.
// City coordinates match data/routes.js where applicable.
const REFERENCE_ROUTES = [
  { id: 'a1-north', motorway: 'A1', direction: 'north',
    fromName: 'Athens',         from: { lat: 37.9838, lng: 23.7275 },
    toName:   'Thessaloniki',   to:   { lat: 40.6401, lng: 22.9444 } },
  { id: 'a1-south', motorway: 'A1', direction: 'south',
    fromName: 'Thessaloniki',   from: { lat: 40.6401, lng: 22.9444 },
    toName:   'Athens',         to:   { lat: 37.9838, lng: 23.7275 } },

  { id: 'a2-east',  motorway: 'A2', direction: 'east',
    fromName: 'Igoumenitsa',    from: { lat: 39.5046, lng: 20.2628 },
    toName:   'Alexandroupoli', to:   { lat: 40.8463, lng: 25.8743 } },
  { id: 'a2-west',  motorway: 'A2', direction: 'west',
    fromName: 'Alexandroupoli', from: { lat: 40.8463, lng: 25.8743 },
    toName:   'Igoumenitsa',    to:   { lat: 39.5046, lng: 20.2628 } },

  { id: 'a5-north', motorway: 'A5', direction: 'north',
    fromName: 'Patras',         from: { lat: 38.2466, lng: 21.7346 },
    toName:   'Ioannina',       to:   { lat: 39.6650, lng: 20.8537 } },
  { id: 'a5-south', motorway: 'A5', direction: 'south',
    fromName: 'Ioannina',       from: { lat: 39.6650, lng: 20.8537 },
    toName:   'Patras',         to:   { lat: 38.2466, lng: 21.7346 } },

  { id: 'a8-west',  motorway: 'A8', direction: 'west',
    fromName: 'Athens',         from: { lat: 37.9838, lng: 23.7275 },
    toName:   'Patras',         to:   { lat: 38.2466, lng: 21.7346 } },
  { id: 'a8-east',  motorway: 'A8', direction: 'east',
    fromName: 'Patras',         from: { lat: 38.2466, lng: 21.7346 },
    toName:   'Athens',         to:   { lat: 37.9838, lng: 23.7275 } },

  // E65 south endpoint is custom (not Lamia city center, which routes
  // imperfectly onto the motorway). Per direction from user.
  { id: 'e65-north', motorway: 'E65', direction: 'north',
    fromName: 'E65 south anchor', from: { lat: 38.82046, lng: 22.48972 },
    toName:   'Trikala',          to:   { lat: 39.5556,  lng: 21.7679  } },
  { id: 'e65-south', motorway: 'E65', direction: 'south',
    fromName: 'Trikala',          from: { lat: 39.5556,  lng: 21.7679  },
    toName:   'E65 south anchor', to:   { lat: 38.82046, lng: 22.48972 } },
];

// ── Mapbox helper ──────────────────────────────────────────────────────
async function fetchRoute(from, to) {
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/` +
              `${from.lng},${from.lat};${to.lng},${to.lat}` +
              `?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Mapbox HTTP ${res.status}`);
  const data = await res.json();
  if (data.code !== 'Ok' || !data.routes?.length) {
    throw new Error(`Mapbox returned ${data.code} with no routes`);
  }
  const r = data.routes[0];
  return {
    coords:      r.geometry.coordinates.map(c => [c[1], c[0]]), // → [lat, lng]
    distanceKm:  +(r.distance / 1000).toFixed(2),
    durationMin: +(r.duration / 60).toFixed(1),
  };
}

// ── Run ────────────────────────────────────────────────────────────────
async function main() {
  const outPath = path.join(__dirname, 'reference-routes.json');
  if (fs.existsSync(outPath)) {
    console.log(`${outPath} already exists. Continue and overwrite? (y/N)`);
    const ans = await new Promise(res => {
      process.stdin.once('data', d => res(d.toString().trim().toLowerCase()));
    });
    if (ans !== 'y' && ans !== 'yes') {
      console.log('Aborted.');
      process.exit(0);
    }
  }

  const out = {
    generated: new Date().toISOString(),
    routes: {},
  };

  for (const ref of REFERENCE_ROUTES) {
    process.stdout.write(`[${ref.id}] ${ref.fromName} → ${ref.toName}: `);
    try {
      const r = await fetchRoute(ref.from, ref.to);
      out.routes[ref.id] = {
        motorway:    ref.motorway,
        direction:   ref.direction,
        from:        ref.from,
        to:          ref.to,
        fromName:    ref.fromName,
        toName:      ref.toName,
        distanceKm:  r.distanceKm,
        durationMin: r.durationMin,
        coords:      r.coords,
      };
      console.log(`✓ ${r.coords.length} points, ${r.distanceKm}km, ${r.durationMin.toFixed(0)}min`);
    } catch (err) {
      console.log(`✗ ${err.message}`);
    }
    // Be polite to the API
    await new Promise(r => setTimeout(r, 500));
  }

  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  const sizeKb = (fs.statSync(outPath).size / 1024).toFixed(1);
  console.log(`\nWrote ${outPath} (${sizeKb} KB).`);
  console.log(`${Object.keys(out.routes).length} of ${REFERENCE_ROUTES.length} routes captured.`);
}

main().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
