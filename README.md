# DIODIO — Greek Toll Road Advisor

Διαδραστικός χάρτης για όλα τα διόδια στους ελληνικούς αυτοκινητοδρόμους.
Δες τιμές 2026, υπολόγισε το κόστος της διαδρομής σου, και βρες ποια διόδια
αξίζει να παρακάμψεις.

**Live site:** https://stergios-a11y.github.io/diodio/

---

## Τι είναι το DIODIO; / What is DIODIO?

DIODIO is an interactive map and bypass advisor for tolls on Greek motorways.
It shows 2026 prices for all four vehicle classes (motorcycle, car, van, truck),
calculates the total cost for any city-to-city route, and recommends which
tolls are worth paying versus bypassing — based on a time-vs-money preference
the user controls.

Key features:

- 49 toll booths across A1, A2, A5, A6, A7, A8, E65, plus the Rio–Antirrio
  bridge and the Aktio–Preveza tunnel
- 16 cities, 100+ city-to-city routes via hub composition
- Bypass routes for ~70% of tolls, with curated exit / re-entry ramp
  coordinates verified against OpenStreetMap motorway-junction data
- Greek-first UI with full English translation
- Side-panel comparisons of bypass vs. motorway distance and time, fetched
  live from Mapbox Directions
- Per-direction confidence indicator: `verified`, `auto`, or `approximate`
  so you know how much to trust each bypass before relying on it
- No registration, no tracking, no ads

## Architecture

Static site, no build step. Three pages via hash router (`#map`, `#routes`,
`#tolls`).

```
index.html              # entry point (single page)
css/style.css           # all styles in one file
data/
├── tolls.js            # 49 toll booths with prices + bypass routes
└── routes.js           # 16 cities, hub-composed city-to-city routes
js/
├── map.js              # Leaflet map + Mapbox routing
├── calculator.js       # analyze flow, verdicts (PAY / AVOID / MARGINAL_*)
├── pages.js            # hash router, routes matrix, tolls table
└── i18n.js             # full el / en translation tables
tools/
├── audit-bypasses.js   # one-shot OSM lookup against Overpass (read-only)
├── fix-bypasses.js     # apply OSM corrections to data/tolls.js
└── bypass-audit.json   # latest audit report
```

A Cloudflare Worker proxy at
`https://diodio-proxy.stergiosgousios.workers.dev` handles AI summaries
without exposing any API keys to the client.

## Running locally

No build step. Any static file server works:

```bash
cd diodio
python3 -m http.server 8000
# or
npx serve .
```

Open http://localhost:8000.

## Updating toll data

Toll prices change annually (typically January). To update:

1. Edit `data/tolls.js` — change `cat1`, `cat2`, `cat3`, `cat4` for affected
   booths.
2. Bump cache-buster: `sed -i '' "s/v=[0-9-]*\(['\"]\)/v=$(date +%Y%m%d-%H%M)\1/g" index.html`
3. Commit and push. GitHub Pages deploys in ~30 seconds.

To audit bypass coordinates against OpenStreetMap (run once after major
data changes):

```bash
node tools/audit-bypasses.js   # produces tools/bypass-audit.json + .txt
node tools/fix-bypasses.js     # dry-run; writes data/tolls.new.js
diff data/tolls.js data/tolls.new.js
mv data/tolls.new.js data/tolls.js
```

## Licensing

DIODIO uses a split license that protects the curated dataset while keeping
the codebase open:

- **Source code** (everything in `js/`, `css/`, `tools/`, `index.html`):
  MIT — see [LICENSE](LICENSE). Free for any use including commercial,
  with attribution.
- **Data** (everything in `data/`, plus `tools/bypass-audit.json`):
  Creative Commons BY-NC 4.0 — see [LICENSE-DATA](LICENSE-DATA). Free for
  non-commercial use with attribution. Commercial use requires permission.

If you'd like to use DIODIO data in a commercial product, please reach out
to stergiosgousios@gmail.com — we're open to reasonable terms.

## Data sources & attribution

- Toll prices: official operator publications (Nea Odos, Olympia Odos,
  Egnatia, Moreas, Kentriki Odos), verified annually
- Motorway junction coordinates: OpenStreetMap (© OpenStreetMap
  contributors, ODbL — https://www.openstreetmap.org/copyright)
- Routing: Mapbox Directions API
- Map tiles: CartoDB Positron (under CARTO's free tier)

## Contact

Feedback, corrections, commercial inquiries: stergiosgousios@gmail.com

A sister project: https://aegeanblueprint.com
