#!/usr/bin/env python3
"""
tools/fix-thiva-north.py

One-shot manual correction. Replaces the OSM motorway-junction coordinates
for a1_thiva north's off_ramp and on_ramp with hand-curated values that
sit on the actual ramp surfaces (slightly inset from the junction split).

The OSM coordinates were snap-ambiguous: routing engines could interpret
them as either on-motorway or on-ramp. The hand-curated values are
unambiguously on the ramp surface, so Mapbox's exclude=motorway behaves
correctly during the bypass leg.

This is a proof-of-concept fix for one direction. If it works visibly on
the live site, the same pattern can be extended to other tolls.
"""

import sys
from pathlib import Path

p = Path(__file__).parent.parent / 'data' / 'tolls.js'
src = p.read_text()

# Replacement 1: Thiva north off_ramp
# Was at the OSM junction node for Ριτσώνα. New value is ~50m onto the
# off-ramp surface itself.
old_off = 'off_ramp:   { lat: 38.380147, lng: 23.491339 }'
new_off = 'off_ramp:   { lat: 38.380390, lng: 23.490380 }'

# Replacement 2: Thiva north on_ramp
# Was at the OSM junction node for Θήβα. New value is ~50m onto the
# on-ramp surface.
old_on  = 'on_ramp:    { lat: 38.365434, lng: 23.325831 }'
new_on  = 'on_ramp:    { lat: 38.365760, lng: 23.324490 }'

# Sanity: each pattern should appear exactly once (Thiva north uses these
# coords; Thiva south reverses them but the lat/lng pairs are unique to
# this toll).
for old in (old_off, old_on):
    n = src.count(old)
    if n != 1:
        print(f"FAIL: pattern {old!r} matched {n} times (expected 1).")
        sys.exit(1)

src = src.replace(old_off, new_off)
src = src.replace(old_on,  new_on)
p.write_text(src)
print(f"Patched {p}.")
print(f"  off_ramp: was 38.380147,23.491339 → now 38.380390,23.490380")
print(f"  on_ramp:  was 38.365434,23.325831 → now 38.365760,23.324490")
