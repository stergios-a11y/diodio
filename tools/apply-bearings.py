#!/usr/bin/env python3
"""
apply-bearings.py
─────────────────
Read bearings.json (output by fetch-osm-bearings.py) and patch tolls.js
in place by adding a `bearing_manual: NN` field to each toll on the line
right after `bearing: NN`.

If a toll already has a `bearing_manual` field, this script REPLACES it
so you can re-run the OSM fetch + apply cycle without manual cleanup.

Why bearing_manual instead of overwriting bearing?
- map.js reads bearing_manual first, falling back to bearing. So manual
  values take precedence — they survive any future automated bearing
  recompute.
- Keeps an audit trail: you can compare auto vs OSM bearings later.

USAGE:
    cd ~/diodio
    python3 tools/fetch-osm-bearings.py    # creates bearings.json
    python3 tools/apply-bearings.py        # patches tolls.js

Bumps tolls.js cache-bust string in index.html automatically (asks first).
"""

import json
import re
import sys
from datetime import datetime
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
TOLLS_JS = REPO_ROOT / 'data' / 'tolls.js'
INDEX_HTML = REPO_ROOT / 'index.html'
BEARINGS_JSON = Path(__file__).resolve().parent / 'bearings.json'


def patch_tolls(src, bearings):
    """For each toll id in bearings, ensure its block has
    `bearing_manual: <value>,` immediately after the existing `bearing: NN,`
    line. If bearing_manual already present, replace its value."""
    patched = 0
    skipped = []

    for tid, value in bearings.items():
        # Find the toll block
        block_re = re.compile(
            r'(id:\s*"' + re.escape(tid) + r'",[\s\S]*?)'
            r'(?=\n  \{|\n\];)',  # next toll or end of array
            re.MULTILINE,
        )
        m = block_re.search(src)
        if not m:
            skipped.append(tid)
            continue
        block_text = m.group(1)
        # Does this block have bearing_manual already?
        if re.search(r'bearing_manual:\s*\d+', block_text):
            # Replace existing value
            new_block = re.sub(
                r'(bearing_manual:\s*)\d+',
                rf'\g<1>{value}',
                block_text,
            )
        elif re.search(r'bearing:\s*\d+,', block_text):
            # Insert after the bearing line. Match the bearing line including
            # any surrounding whitespace, and append bearing_manual on the
            # same line so it stays paired visually.
            new_block = re.sub(
                r'(bearing:\s*\d+,)',
                rf'\g<1> bearing_manual: {value},',
                block_text,
                count=1,
            )
        else:
            # No existing bearing — bridges with axis but no bearing field.
            # Insert bearing_manual right after the axis line.
            new_block = re.sub(
                r'(axis:\s*"(?:NS|EW)",)',
                rf'\g<1> bearing_manual: {value},',
                block_text,
                count=1,
            )
            if new_block == block_text:
                skipped.append(tid)
                continue

        if new_block != block_text:
            src = src[:m.start(1)] + new_block + src[m.end(1):]
            patched += 1

    return src, patched, skipped


def bump_cache_bust(html, asset, today_yymmdd):
    """Bump the ?v= string for asset in index.html. Increments the suffix
    by 100 if today's date is already there, else uses today-0001."""
    pattern = re.compile(rf'({re.escape(asset)}\?v=)(\d{{8}})-(\d{{4}})')
    m = pattern.search(html)
    if not m:
        return html, None
    old = m.group(0)
    if m.group(2) == today_yymmdd:
        # Same day: bump suffix by 100 (matches the existing convention)
        new_suffix = f'{int(m.group(3)) + 100:04d}'
    else:
        new_suffix = '0100'
    new = f'{m.group(1)}{today_yymmdd}-{new_suffix}'
    return html.replace(old, new), new


def main():
    if not BEARINGS_JSON.exists():
        sys.exit(f'No bearings.json found at {BEARINGS_JSON}\n'
                 f'Run: python3 tools/fetch-osm-bearings.py first.')
    if not TOLLS_JS.exists():
        sys.exit(f'tolls.js not found at {TOLLS_JS}')

    bearings = json.loads(BEARINGS_JSON.read_text())
    src = TOLLS_JS.read_text()
    new_src, patched, skipped = patch_tolls(src, bearings)

    if patched == 0:
        print('No changes made. Already in sync?')
        return

    print(f'About to patch {patched} tolls in {TOLLS_JS}.')
    if skipped:
        print(f'  Skipped (no matching block found): {skipped}')

    confirm = input('Proceed? [y/N] ').strip().lower()
    if confirm != 'y':
        print('Aborted.')
        return

    TOLLS_JS.write_text(new_src)
    print(f'  ✓ wrote {TOLLS_JS}')

    # Bump cache-bust for tolls.js in index.html
    if INDEX_HTML.exists():
        html = INDEX_HTML.read_text()
        today = datetime.now().strftime('%Y%m%d')
        new_html, new_v = bump_cache_bust(html, 'data/tolls.js', today)
        if new_v:
            INDEX_HTML.write_text(new_html)
            print(f'  ✓ bumped tolls.js cache-bust to {new_v}')

    print('\nNext: review the diff, then commit:')
    print('  git diff data/tolls.js index.html')
    print('  git add data/tolls.js index.html')
    print('  git commit -m "Fetch road bearings from OSM"')
    print('  git push')


if __name__ == '__main__':
    main()
