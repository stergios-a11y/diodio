#!/usr/bin/env python3
"""
tools/fix-thiva.py

Hand-curated correction for a1_thiva. All four ramp coordinates for both
north and south directions are replaced with values verified against the
actual ramp geometry (Google Maps), insetting the off_ramp/on_ramp coords
onto the ramp surfaces themselves so Mapbox routing disambiguates.

This is the second toll fixed by hand. If the Thiva visualisation looks
right after this lands, the same pattern is applied to other tolls.
"""

import sys
from pathlib import Path

p = Path(__file__).parent.parent / 'data' / 'tolls.js'
src = p.read_text()

def fmt(lat, lng):
    return f'{{ lat: {lat}, lng: {lng} }}'

# ── North direction (after migration: current values) ────────────────────
old_north = (
    'pre_exit:   { lat: 38.378648, lng: 23.502208 },\n'
    '        off_ramp:   { lat: 38.380390, lng: 23.490380 },\n'
    '        on_ramp:    { lat: 38.365760, lng: 23.324490 },\n'
    '        post_merge: { lat: 38.364594, lng: 23.314427 }'
)
new_north = (
    f'pre_exit:   {fmt(38.365991, 23.331733)},\n'
    f'        off_ramp:   {fmt(38.366465, 23.324610)},\n'
    f'        on_ramp:    {fmt(38.403263, 23.221864)},\n'
    f'        post_merge: {fmt(38.405774, 23.219103)}'
)

# ── South direction (after migration: current values) ────────────────────
old_south = (
    'pre_exit:   { lat: 38.364456, lng: 23.314447 },\n'
    '        off_ramp:   { lat: 38.365434, lng: 23.325831 },\n'
    '        on_ramp:    { lat: 38.380147, lng: 23.491339 },\n'
    '        post_merge: { lat: 38.378474, lng: 23.502207 }'
)
new_south = (
    f'pre_exit:   {fmt(38.405441, 23.219123)},\n'
    f'        off_ramp:   {fmt(38.402589, 23.221060)},\n'
    f'        on_ramp:    {fmt(38.364631, 23.321978)},\n'
    f'        post_merge: {fmt(38.365166, 23.324049)}'
)

# Sanity: each pattern should match exactly once. If not, the migration
# produced different formatting than expected — bail out so we don't make
# silent mistakes.
def check(label, pattern):
    n = src.count(pattern)
    if n != 1:
        print(f"FAIL: {label} pattern matched {n} times (expected 1).")
        print(f"Pattern was:\n---\n{pattern}\n---")
        sys.exit(1)

check('north', old_north)
check('south', old_south)

src = src.replace(old_north, new_north)
src = src.replace(old_south, new_south)

p.write_text(src)
print(f"Patched {p}.")
print("North: pre_exit/off_ramp/on_ramp/post_merge updated.")
print("South: pre_exit/off_ramp/on_ramp/post_merge updated.")
