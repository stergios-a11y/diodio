#!/usr/bin/env python3
"""
fetch-osm-bearings.py
─────────────────────
Query OpenStreetMap (via Overpass API) for the actual road bearing at each
frontal toll and bridge in tolls.js. Outputs `bearings.json` with one entry
per toll, where the bearing is the compass direction (mod 180) of the road
*at the toll's location*, computed from two OSM nodes ~150m apart on either
side of the toll's projected position on the highway way.

This is much more accurate than the in-browser auto-computed bearing, which
averages across a 5-13km bypass corridor and gets the road direction wrong
on curving sections.

USAGE:
    cd ~/diodio
    python3 tools/fetch-osm-bearings.py

Output:
    tools/bearings.json   ← fresh bearings keyed by toll id
    Then run apply-bearings.py to patch tolls.js in place.

NOTES:
- Takes ~1-2 minutes (rate-limited 1 req/sec to be polite to Overpass).
- No API key required. Falls back gracefully if a toll has no nearby
  highway ways (rare; toll keeps its existing bearing).
- Prefers ways whose `ref` tag matches the toll's highway (A1, E75, etc.),
  so it doesn't confuse the motorway with a parallel old national road.
"""

import json
import math
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parent.parent
TOLLS_JS = REPO_ROOT / 'data' / 'tolls.js'
OUT = Path(__file__).resolve().parent / 'bearings.json'

OVERPASS_URL = 'https://overpass-api.de/api/interpreter'
SEARCH_RADIUS_M = 150  # tight: motorway only, not parallel roads
SEGMENT_OFFSET_M = 150  # how far from the toll we sample for the bearing
RATE_LIMIT_SECONDS = 1.0  # polite delay between Overpass requests


def haversine(p1, p2):
    """Great-circle distance in meters between two (lat, lng) points."""
    R = 6_371_000
    lat1, lon1 = math.radians(p1[0]), math.radians(p1[1])
    lat2, lon2 = math.radians(p2[0]), math.radians(p2[1])
    dlat, dlon = lat2 - lat1, lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1)*math.cos(lat2)*math.sin(dlon/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def bearing_deg(p1, p2):
    """Compass bearing (0–360) from p1 to p2."""
    lat1, lon1 = math.radians(p1[0]), math.radians(p1[1])
    lat2, lon2 = math.radians(p2[0]), math.radians(p2[1])
    dlon = lon2 - lon1
    x = math.sin(dlon) * math.cos(lat2)
    y = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(dlon)
    return (math.degrees(math.atan2(x, y)) + 360) % 360


def parse_tolls():
    """Pull out (id, name, type, highway, lat, lng) for every toll in tolls.js.
    Quick-and-dirty regex parse; tolls.js is JSON-shaped enough that this works."""
    src = TOLLS_JS.read_text()
    # Match each toll block by its `id:` line and the fields up to the next id
    # or end of array.
    pattern = re.compile(
        r'id:\s*"([^"]+)",[\s\S]*?'
        r'name_en:\s*"([^"]+)",[\s\S]*?'
        r'highway:\s*"([^"]+)"[\s\S]*?'
        r'type:\s*"(\w+)"[\s\S]*?'
        r'lat:\s*([-\d.]+),\s*lng:\s*([-\d.]+)'
    )
    out = []
    for m in pattern.finditer(src):
        tid, name, hwy, ttype, lat, lng = m.groups()
        if ttype in ('frontal', 'bridge'):
            out.append({
                'id': tid, 'name': name, 'highway': hwy,
                'type': ttype, 'lat': float(lat), 'lng': float(lng),
            })
    return out


def overpass_query(lat, lng, radius_m):
    """Fetch all motorway/trunk/primary ways within radius of the point."""
    q = f"""
    [out:json][timeout:25];
    (
      way["highway"~"^(motorway|trunk|primary|secondary)$"](around:{radius_m},{lat},{lng});
    );
    (._;>;);
    out body;
    """
    data = urllib.parse.urlencode({'data': q}).encode()
    req = urllib.request.Request(
        OVERPASS_URL, data=data,
        headers={'User-Agent': 'mydiodia-bearing-fetch/1.0'},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


def project_onto_way(point, way_node_coords):
    """Find the index of the way node closest to `point`. Returns (idx, dist_m)."""
    best_i, best_d = -1, float('inf')
    for i, n in enumerate(way_node_coords):
        d = haversine(point, n)
        if d < best_d:
            best_d, best_i = d, i
    return best_i, best_d


def find_offset_node(way_node_coords, start_idx, direction, target_m):
    """Walk along the way from start_idx (+1 or -1) until cumulative distance
    >= target_m, return that node's index. Returns the endpoint if not reached.
    Returns None if start_idx is invalid or direction is blocked."""
    if start_idx < 0 or start_idx >= len(way_node_coords):
        return None
    cum = 0.0
    prev = way_node_coords[start_idx]
    i = start_idx + direction
    while 0 <= i < len(way_node_coords):
        cur = way_node_coords[i]
        cum += haversine(prev, cur)
        if cum >= target_m:
            return i
        prev = cur
        i += direction
    last = i - direction
    if 0 <= last < len(way_node_coords) and last != start_idx:
        return last
    return None


def best_way_for_toll(toll, ways, nodes):
    """Pick the OSM way most likely to be the highway the toll is on.
    Prefers ways whose `ref` tag contains the toll's highway code (A5, A1, E94),
    falling back to whichever way has a node closest to the toll."""
    point = (toll['lat'], toll['lng'])
    candidates = []
    for w in ways:
        node_coords = []
        for nid in w['nodes']:
            n = nodes.get(nid)
            if n:
                node_coords.append(n)
        if len(node_coords) < 2:
            continue
        # Closest node distance
        _, dist = project_onto_way(point, node_coords)
        # Score: lower is better. Boost ways whose ref matches.
        ref = (w.get('tags', {}).get('ref') or '').upper()
        # Toll highway codes use forms like "A5", "A8", "BRIDGE". OSM `ref`
        # is typically "A5" or "A5;E55". Match if any token equals.
        match_bonus = 0
        if toll['highway'] in ref.split(';') or toll['highway'] in ref.split(','):
            match_bonus = -1000  # strong preference for matching ref
        candidates.append((dist + match_bonus, w, node_coords))
    if not candidates:
        return None, None
    candidates.sort(key=lambda c: c[0])
    _, best_w, best_coords = candidates[0]
    return best_w, best_coords


def compute_bearing_for_toll(toll):
    """Returns the road bearing at the toll, mod 180. None on failure."""
    point = (toll['lat'], toll['lng'])
    try:
        data = overpass_query(toll['lat'], toll['lng'], SEARCH_RADIUS_M)
    except Exception as e:
        print(f'    overpass error: {e}', file=sys.stderr)
        return None

    nodes = {n['id']: (n['lat'], n['lon'])
             for n in data['elements'] if n['type'] == 'node'}
    ways = [w for w in data['elements'] if w['type'] == 'way']

    if not ways:
        # Widen the search — bridges in particular may be tagged differently
        try:
            data = overpass_query(toll['lat'], toll['lng'], SEARCH_RADIUS_M * 3)
        except Exception:
            return None
        nodes = {n['id']: (n['lat'], n['lon'])
                 for n in data['elements'] if n['type'] == 'node'}
        ways = [w for w in data['elements'] if w['type'] == 'way']
        if not ways:
            return None

    best_w, way_coords = best_way_for_toll(toll, ways, nodes)
    if best_w is None or way_coords is None:
        return None

    # Project toll onto way; find two nodes flanking it ~150m apart.
    nearest_idx, nearest_dist = project_onto_way(point, way_coords)
    if nearest_dist > 200:
        # Toll is more than 200m from any node on the closest way — likely
        # the wrong way was picked, or the toll's lat/lng is approximate.
        print(f'    nearest node {nearest_dist:.0f}m away, suspect; skipping',
              file=sys.stderr)
        return None

    p1_idx = find_offset_node(way_coords, nearest_idx, -1, SEGMENT_OFFSET_M)
    p2_idx = find_offset_node(way_coords, nearest_idx, +1, SEGMENT_OFFSET_M)
    if p1_idx is None or p2_idx is None or p1_idx == p2_idx:
        return None

    p1 = way_coords[p1_idx]
    p2 = way_coords[p2_idx]
    return round(bearing_deg(p1, p2) % 180)


def main():
    if not TOLLS_JS.exists():
        sys.exit(f'tolls.js not found at {TOLLS_JS}')

    tolls = parse_tolls()
    print(f'Found {len(tolls)} frontals + bridges to process.\n', file=sys.stderr)

    results = {}
    for i, toll in enumerate(tolls, 1):
        print(f'[{i:2d}/{len(tolls)}] {toll["id"]:<40} ({toll["name"]})',
              file=sys.stderr)
        b = compute_bearing_for_toll(toll)
        if b is not None:
            results[toll['id']] = b
            print(f'    → {b}°', file=sys.stderr)
        else:
            print('    → FAILED (toll keeps its existing bearing)', file=sys.stderr)
        time.sleep(RATE_LIMIT_SECONDS)

    OUT.write_text(json.dumps(results, indent=2, ensure_ascii=False))
    print(f'\nWrote {len(results)} bearings to {OUT}', file=sys.stderr)
    print(f'Failed: {len(tolls) - len(results)}/{len(tolls)}', file=sys.stderr)
    print(f'\nNext step: python3 tools/apply-bearings.py', file=sys.stderr)


if __name__ == '__main__':
    main()
