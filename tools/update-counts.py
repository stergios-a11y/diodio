#!/usr/bin/env python3
"""
Update count claims in index.html and README.md from data/tolls.js + data/routes.js.

Run before each deploy. Idempotent — running it twice produces the same output.

For README.md: the script edits only the regions between marker comments.
  <!-- counts:start --> ... <!-- counts:end -->

For index.html: HTML comments inside `<script type="application/ld+json">` are
  invalid JSON, so the script can't use marker comments there. Instead it
  replaces specific lines in the JSON-LD `featureList` by matching their stable
  text prefixes. The two replaced lines are:
    "Interactive map of … main toll booths…"
    "City-to-city route cost calculator …"
  Everything else in `featureList` is left alone.

Usage:
  python3 tools/update-counts.py            # rewrite files in place
  python3 tools/update-counts.py --check    # exit 1 if files would change
                                              (use this in CI / pre-push)
"""
from __future__ import annotations
import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# ── Stats extraction ─────────────────────────────────────────────────────

def extract_stats() -> dict:
    """Read data/tolls.js + data/routes.js and return canonical counts."""
    tolls_src  = (ROOT / "data" / "tolls.js").read_text(encoding="utf-8")
    routes_src = (ROOT / "data" / "routes.js").read_text(encoding="utf-8")

    # Toll types: count occurrences of `type: "X"` inside the TOLL_DATA array.
    # The tolls.js header comments don't contain this exact form, so a global
    # regex is safe.
    type_counts = {"frontal": 0, "side": 0, "bridge": 0, "tunnel": 0}
    for m in re.finditer(r'type:\s*"(\w+)"', tolls_src):
        t = m.group(1)
        type_counts[t] = type_counts.get(t, 0) + 1
    total = sum(type_counts.values())

    # Bypass-confidence: scan each frontal block and classify by confidence values.
    bypass = {"verified": 0, "approximate": 0, "mixed": 0, "null": 0}
    # Find each top-level toll record by its `id:` line, slice up to the next.
    id_positions = [(m.start(), m.group(1))
                    for m in re.finditer(r'^\s*id:\s*"([^"]+)"', tolls_src, re.M)]
    id_positions.append((len(tolls_src), None))  # sentinel
    for i, (start, _id) in enumerate(id_positions[:-1]):
        end = id_positions[i+1][0]
        block = tolls_src[start:end]
        # Only frontals have bypass directions to evaluate.
        if 'type: "frontal"' not in block:
            continue
        confs = re.findall(r'confidence:\s*"(\w+)"', block)
        if not confs or 'bypass_directions: null' in block:
            bypass["null"] += 1
        elif all(c == "verified" for c in confs):
            bypass["verified"] += 1
        elif all(c == "approximate" for c in confs):
            bypass["approximate"] += 1
        else:
            bypass["mixed"] += 1

    # Cities: count entries inside the CITIES = [ ... ] array.
    # Pattern is `{ id: "...", name_gr: ... }` — count those objects.
    cities_match = re.search(r'CITIES\s*=\s*\[(.*?)\];', routes_src, re.S)
    cities = 0
    if cities_match:
        cities = len(re.findall(r'\bid:\s*"', cities_match.group(1)))

    # Direct route pairs: keys of ROUTE_PAIRS = { ... }.
    # Match anything of the form  "city-city": { ... },
    pairs_match = re.search(r'ROUTE_PAIRS\s*=\s*\{(.*?)\n\};', routes_src, re.S)
    pairs = 0
    if pairs_match:
        pairs = len(re.findall(r'^\s*"[a-z_-]+":\s*\{',
                               pairs_match.group(1), re.M))

    return {
        "total":   total,
        "frontal": type_counts["frontal"],
        "side":    type_counts["side"],
        "bridge":  type_counts["bridge"] + type_counts["tunnel"],
        "main":    type_counts["frontal"] + type_counts["bridge"] + type_counts["tunnel"],
        "cities":  cities,
        "pairs":   pairs,
        "bypass":  bypass,
        "bypass_with_data":
                   bypass["verified"] + bypass["approximate"] + bypass["mixed"],
    }


# ── Templates ─────────────────────────────────────────────────────────────

# index.html JSON-LD — two specific lines, matched by stable prefix.
# Each entry: (line_prefix_to_match, full_replacement_line_template).
# Indented to 10 spaces to match the surrounding featureList context.

INDEX_JSONLD_LINES: list[tuple[str, str]] = [
    (
        '          "Interactive map of ',
        '          "Interactive map of {frontal} main toll booths, '
        '{bridge} bridges/tunnels, plus {side} side toll booths",',
    ),
    (
        '          "City-to-city route cost calculator ',
        '          "City-to-city route cost calculator across '
        '{cities} cities and {pairs} explicit pairs",',
    ),
]

def readme_block(s: dict) -> str:
    """The text that goes inside the README.md marker block."""
    coverage_pct = round(100 * s["bypass_with_data"] / s["frontal"]) if s["frontal"] else 0
    return (
        f'- {s["main"]} main toll booths ({s["frontal"]} frontal + {s["bridge"]} '
        f'bridges/tunnels) plus {s["side"]} side-toll booths across A1, A2, A5, '
        f'A6, A7, A8, E65, plus the Rio–Antirrio bridge and the Aktio–Preveza tunnel\n'
        f'- {s["cities"]} cities, {s["pairs"]} explicit city-to-city routes plus '
        f'shortest-hub composition for the rest\n'
        f'- Bypass routes for ~{coverage_pct}% of frontal tolls '
        f'({s["bypass"]["verified"]} verified, {s["bypass"]["approximate"]} approximate, '
        f'{s["bypass"]["mixed"]} mixed, {s["bypass"]["null"]} pending), with curated '
        f'exit / re-entry ramp coordinates verified against OpenStreetMap '
        f'motorway-junction data'
    )


# ── Substitution helpers ─────────────────────────────────────────────────

def replace_marker_block(text: str, marker: str, body: str) -> tuple[str, bool]:
    """Replace the contents between <!-- {marker}:start --> and <!-- {marker}:end -->.

    Returns (new_text, changed). Markers must already exist in `text`. Raises
    ValueError if the markers are missing or malformed — that's a clearer
    failure mode than silently doing nothing.
    """
    start = f"<!-- {marker}:start -->"
    end   = f"<!-- {marker}:end -->"
    pat = re.compile(
        re.escape(start) + r'(.*?)' + re.escape(end),
        re.S,
    )
    if not pat.search(text):
        raise ValueError(
            f"Marker block '{marker}' not found. "
            f"Expected '{start}' ... '{end}' in the file."
        )
    new_text, n = pat.subn(f"{start}\n{body}\n{end}", text, count=1)
    return new_text, (n > 0 and new_text != text)


def replace_prefixed_line(text: str, prefix: str, replacement_line: str) -> tuple[str, bool]:
    """Find a single line that starts with `prefix` and replace the entire line.

    Returns (new_text, changed). Raises ValueError if zero or more than one line
    matches — both situations indicate the file shape has drifted in a way that
    needs human review.
    """
    lines = text.splitlines(keepends=True)
    matches = [i for i, ln in enumerate(lines) if ln.startswith(prefix)]
    if len(matches) == 0:
        raise ValueError(f"No line starting with {prefix!r} found.")
    if len(matches) > 1:
        raise ValueError(
            f"Expected exactly one line starting with {prefix!r}, found {len(matches)}."
        )
    idx = matches[0]
    # Preserve trailing newline of the original line.
    trailing = "\n" if lines[idx].endswith("\n") else ""
    if lines[idx] == replacement_line + trailing:
        return text, False
    lines[idx] = replacement_line + trailing
    return "".join(lines), True


# ── Driver ────────────────────────────────────────────────────────────────

def update_index_html(text: str, stats: dict) -> tuple[str, bool]:
    """Apply all JSON-LD line replacements; return (new_text, any_changed)."""
    any_changed = False
    for prefix, template in INDEX_JSONLD_LINES:
        replacement = template.format(**stats)
        text, changed = replace_prefixed_line(text, prefix, replacement)
        any_changed = any_changed or changed
    return text, any_changed


def update_readme(text: str, stats: dict) -> tuple[str, bool]:
    """Apply marker-block replacement; return (new_text, any_changed)."""
    return replace_marker_block(text, "counts", readme_block(stats))


TARGETS = [
    # (relative path, updater function)
    ("index.html", update_index_html),
    ("README.md",  update_readme),
]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true",
                        help="exit 1 if any file would change (CI mode)")
    args = parser.parse_args()

    stats = extract_stats()
    print(f"Stats: {json.dumps(stats, indent=2)}")

    any_changes = False
    for rel, updater in TARGETS:
        path = ROOT / rel
        original = path.read_text(encoding="utf-8")
        try:
            updated, changed = updater(original, stats)
        except ValueError as e:
            print(f"  {rel}: {e}", file=sys.stderr)
            return 2
        if not changed:
            print(f"  {rel}: unchanged")
            continue
        any_changes = True
        if args.check:
            print(f"  {rel}: WOULD CHANGE", file=sys.stderr)
        else:
            path.write_text(updated, encoding="utf-8")
            print(f"  {rel}: updated")

    if args.check and any_changes:
        print("\nFiles are out of date. Run `python3 tools/update-counts.py` "
              "and commit the result.", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
