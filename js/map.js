/**
 * mydiodia — map.js
 * Features:
 *  - Toll markers + zoom-aware name labels
 *  - Help modal
 *  - Legend with solo-filter
 *  - Ramp layer: EXIT/ENTER signs + dashed connection lines toll→exit→entry
 *  - Side panel: toll details, prices, bypass-vs-highway comparison
 *  - Toll click: dims everything except that toll's exit/entry/bypass
 */

const map = L.map('map', {
  center: [38.9, 22.5],
  zoom: 7,
  minZoom: 6,
  maxZoom: 16,
  zoomControl: true,
});
window._dmap = map;

window.openSidePanelById = function(id) {
  const toll = TOLL_DATA.find(t => t.id === id);
  if (toll && typeof openSidePanel === 'function') openSidePanel(toll);
};

// ── Global vehicle selection ───────────────────────────────────────────
//
// The vehicle the user has chosen is a global UI mode (like language) —
// it filters every price display on the site to just that vehicle's row.
// State lives in localStorage under "diodio.vehicle"; default is car.
// Renderers read via window.getVehicleCat(). When the user clicks a
// different pill, we save + dispatch a "vehiclechange" event; modules
// re-render whatever they have currently displayed (open panel, hover
// tooltip, analyze results).
const VEHICLE_META = {
  cat1: { emoji: '🏍', labelKey: 'sp.motorcycle', fullKey: 'veh.full.cat1' },
  cat2: { emoji: '🚗', labelKey: 'sp.car',        fullKey: 'veh.full.cat2' },
  cat3: { emoji: '🚐', labelKey: 'sp.van',        fullKey: 'veh.full.cat3' },
  cat4: { emoji: '🚛', labelKey: 'sp.truck',      fullKey: 'veh.full.cat4' },
};
let _currentVehicleCat = (() => {
  try {
    const stored = localStorage.getItem('diodio.vehicle');
    if (stored && VEHICLE_META[stored]) return stored;
  } catch (e) {}
  return 'cat2';
})();
window.getVehicleCat = () => _currentVehicleCat;
window.getVehicleMeta = () => VEHICLE_META[_currentVehicleCat] || VEHICLE_META.cat2;

// ─── Toll price accessor ─────────────────────────────────────────
// Centralised lookup for "what does this toll charge for this vehicle in this
// direction?" — read by map markers, the side panel, route analysis, and the
// routes matrix. The schema (since R26) is:
//
//   toll.cat1..4                      flat fallback (kept for backward compat)
//   toll.prices_by_direction = {      optional override block, populated for
//     northbound: { cat1..4 },        all 48 frontals as of R26 (currently
//     southbound: { cat1..4 },        with values identical to the flat
//     ...                             fields, so behaviour is unchanged).
//   }                                 The structure is in place so future
//                                     per-direction divergence is a one-line
//                                     data edit, no code change.
//
// Direction param is normalised: 'northbound'|'southbound'|'eastbound'|'westbound',
// or undefined (returns flat fallback). Side tolls and bridges always have a
// single price set since they're already direction-specific by construction
// (a side toll IS a direction).
window.getTollPrice = function(toll, catKey, direction) {
  if (!toll || !catKey) return 0;
  if (direction && toll.prices_by_direction && toll.prices_by_direction[direction]) {
    const p = toll.prices_by_direction[direction][catKey];
    if (typeof p === 'number') return p;
  }
  return typeof toll[catKey] === 'number' ? toll[catKey] : 0;
};

// Given a toll and a from→to city pair, infer which direction the driver
// passes through this toll. Used by route analysis and the routes matrix
// to look up direction-specific prices via getTollPrice. Returns one of
// 'northbound'|'southbound'|'eastbound'|'westbound', or undefined if it
// can't be determined (in which case getTollPrice falls back to flat).
//
// The logic uses the toll's `axis` field (set during data entry as 'NS'
// or 'EW') and the city coordinates. For tolls without an axis (rare),
// we infer from the toll's own bearing.
window.directionFromCityPair = function(toll, fromCity, toCity) {
  if (!toll || !fromCity || !toCity) return undefined;
  const axis = toll.axis;
  if (axis === 'NS') {
    return toCity.lat > fromCity.lat ? 'northbound' : 'southbound';
  }
  if (axis === 'EW') {
    return toCity.lng > fromCity.lng ? 'eastbound' : 'westbound';
  }
  return undefined;
};

window.setVehicleCat = function(cat) {
  if (!VEHICLE_META[cat] || cat === _currentVehicleCat) return;
  _currentVehicleCat = cat;
  try { localStorage.setItem('diodio.vehicle', cat); } catch (e) {}
  // Sync EVERY .veh-toggle on the page (topbar + page-header inline pills).
  // Each one shows the current vehicle on its trigger button face and an
  // .active class on the chosen option in its menu.
  _syncAllVehicleTriggers();
  document.querySelectorAll('.veh-toggle .veh-option').forEach(el => {
    el.classList.toggle('active', el.dataset.cat === cat);
  });
  // Notify renderers
  window.dispatchEvent(new Event('vehiclechange'));
};

// Update every .veh-toggle's trigger face (emoji + label) to match
// _currentVehicleCat, honouring the current language. Called on init,
// on vehicle change, and on language change (the label is i18n'd).
function _syncAllVehicleTriggers() {
  const meta = VEHICLE_META[_currentVehicleCat];
  if (!meta) return;
  document.querySelectorAll('.veh-toggle .veh-current').forEach(btn => {
    const emojiEl = btn.querySelector('.veh-emoji');
    const labelEl = btn.querySelector('.veh-label');
    if (emojiEl) emojiEl.textContent = meta.emoji;
    if (labelEl) {
      labelEl.setAttribute('data-i18n', meta.fullKey);
      labelEl.textContent = (typeof t === 'function') ? t(meta.fullKey) : labelEl.textContent;
    }
  });
}

// Open / close menus per-instance. The trigger button passed in identifies
// which .veh-toggle group's menu to act on.
function _openVehMenu(toggleEl) {
  if (!toggleEl) return;
  // Close any other open menus first — only one at a time.
  document.querySelectorAll('.veh-toggle').forEach(other => {
    if (other !== toggleEl) _closeVehMenu(other);
  });
  const menu = toggleEl.querySelector('.veh-menu');
  const btn  = toggleEl.querySelector('.veh-current');
  if (!menu || !btn) return;
  menu.hidden = false;
  btn.setAttribute('aria-expanded', 'true');
}
function _closeVehMenu(toggleEl) {
  if (!toggleEl) return;
  const menu = toggleEl.querySelector('.veh-menu');
  const btn  = toggleEl.querySelector('.veh-current');
  if (!menu || !btn) return;
  menu.hidden = true;
  btn.setAttribute('aria-expanded', 'false');
}
function _closeAllVehMenus() {
  document.querySelectorAll('.veh-toggle').forEach(t => _closeVehMenu(t));
}
// Persistent global listener — fires on every mousedown but only acts when
// at least one menu is open AND the click is outside any toggle group.
//
// CRITICAL: registered in CAPTURE phase (third arg `true`). Leaflet's map
// container intercepts mousedown events and calls stopPropagation on them
// to manage drag/pan state, which prevents bubble-phase listeners on
// `document` from ever firing for clicks on the map. Capture phase runs
// before the target's handlers, so we see the event regardless.
document.addEventListener('mousedown', (e) => {
  // If click is inside any .veh-toggle, let that toggle handle it.
  if (e.target.closest('.veh-toggle')) return;
  _closeAllVehMenus();
}, true);
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  _closeAllVehMenus();
}, true);

// Wire up every .veh-toggle on the page. Scripts load at end of <body>, so
// DOM is usually already parsed by the time we get here; readyState check
// handles the rare race where DOMContentLoaded has not yet fired.
function _initVehicleToggles() {
  const toggles = document.querySelectorAll('.veh-toggle');
  if (!toggles.length) return;
  _syncAllVehicleTriggers();
  toggles.forEach(toggleEl => {
    const trigger = toggleEl.querySelector('.veh-current');
    if (trigger) {
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const menu = toggleEl.querySelector('.veh-menu');
        if (menu && menu.hidden) _openVehMenu(toggleEl);
        else _closeVehMenu(toggleEl);
      });
    }
    toggleEl.querySelectorAll('.veh-option').forEach(el => {
      el.classList.toggle('active', el.dataset.cat === _currentVehicleCat);
      el.addEventListener('click', () => {
        window.setVehicleCat(el.dataset.cat);
        _closeVehMenu(toggleEl);
      });
    });
  });
  // The trigger button label is i18n'd — re-sync on language toggle.
  window.addEventListener('langchange', _syncAllVehicleTriggers);
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _initVehicleToggles);
} else {
  _initVehicleToggles();
}

// ── Bypass schema normalizer ───────────────────────────────────────────
//
// Each direction object should have four ramp-related coords:
//   - pre_exit   : on the through-motorway, ~1km before the off-ramp split
//   - off_ramp   : the off-ramp itself (where you leave the motorway)
//   - on_ramp    : the on-ramp itself (where you rejoin the motorway)
//   - post_merge : on the through-motorway, ~1km past the on-ramp join
//
// Older data files used `exit` (= off_ramp) and `entry` (= on_ramp) only,
// without pre_exit/post_merge. To keep the runtime simple, we normalize
// at load time: any missing fields fall back to their semantic neighbors.
//
// For data that hasn't been migrated (e.g. tolls flagged as off-route by
// compute-ramp-anchors.js), pre_exit ends up equal to off_ramp and
// post_merge equal to on_ramp. Routing then degrades to the previous
// "start at the ramp" behavior — visually less rich but correct.
(function normalizeBypassDirections() {
  if (typeof TOLL_DATA === 'undefined') return;
  for (const t of TOLL_DATA) {
    if (!t.bypass_directions) continue;
    for (const dir of Object.values(t.bypass_directions)) {
      if (!dir.off_ramp   && dir.exit)  dir.off_ramp   = dir.exit;
      if (!dir.on_ramp    && dir.entry) dir.on_ramp    = dir.entry;
      if (!dir.pre_exit)                dir.pre_exit   = dir.off_ramp;
      if (!dir.post_merge)              dir.post_merge = dir.on_ramp;
      // Keep the old field names too so any legacy code paths still work
      if (!dir.exit  && dir.off_ramp) dir.exit  = dir.off_ramp;
      if (!dir.entry && dir.on_ramp)  dir.entry = dir.on_ramp;
    }
  }
})();

// Base map layers — three styles cycled by the topbar toggle:
//   STREETS   → CartoDB Light (default, free, no token)
//   SATELLITE → Esri World Imagery (pure aerial, no labels)
//   HYBRID    → Esri World Imagery + Esri Reference labels overlay
//
// Esri legacy URL works without a token and is widely used for non-commercial
// Leaflet maps. If it ever starts returning 403 (Esri has been gradually
// retiring the legacy services since 2022, but World_Imagery itself still
// serves), the migration is to update the Mapbox token's URL allowlist to
// include the tiles API and switch to mapbox://styles/mapbox/satellite-streets-v12.
const STREET_LAYER = L.tileLayer(
  'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19,
  }
);

const SATELLITE_LAYER = L.tileLayer(
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
    maxZoom: 19,
  }
);

// Reference labels for the hybrid mode. This is a transparent overlay laid on
// top of SATELLITE_LAYER — it draws place names, road labels, and admin lines.
// Custom pane so labels render above satellite imagery but below polylines,
// toll markers, tooltips, and popups.
map.createPane('basemapLabels');
map.getPane('basemapLabels').style.zIndex = 350;
map.getPane('basemapLabels').style.pointerEvents = 'none';

const SATELLITE_LABELS = L.tileLayer(
  'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
  {
    attribution: '',  // attribution already shown by SATELLITE_LAYER
    maxZoom: 19,
    pane: 'basemapLabels',
  }
);

// Active basemap state: 'streets' | 'satellite' | 'hybrid'.
// Session-only — resets to 'streets' on every page load by design.
window.basemapMode = 'streets';
STREET_LAYER.addTo(map);

// Cycle: streets → satellite → hybrid → streets ...
// Used by the mobile drawer's basemap button. Desktop now uses the
// top-right popover which calls setBasemap() directly.
window.cycleBaseLayer = function() {
  const next = window.basemapMode === 'streets'   ? 'satellite'
             : window.basemapMode === 'satellite' ? 'hybrid'
             : 'streets';
  window.setBasemap(next);
};

// Direct selection — used by the basemap popover in the top-right map
// controls stack. Idempotent: calling with the current mode is a no-op.
window.setBasemap = function(mode) {
  if (mode === window.basemapMode) return;
  // Tear down current layer(s) first.
  if (window.basemapMode === 'streets') {
    map.removeLayer(STREET_LAYER);
  } else if (window.basemapMode === 'hybrid') {
    map.removeLayer(SATELLITE_LABELS);
    map.removeLayer(SATELLITE_LAYER);
  } else {
    // satellite
    map.removeLayer(SATELLITE_LAYER);
  }
  // Add the target layer(s).
  if (mode === 'streets') {
    STREET_LAYER.addTo(map);
  } else if (mode === 'satellite') {
    SATELLITE_LAYER.addTo(map);
  } else {
    // hybrid
    SATELLITE_LAYER.addTo(map);
    SATELLITE_LABELS.addTo(map);
  }
  window.basemapMode = mode;
  if (typeof window.updateBasemapButtonLabels === 'function') {
    window.updateBasemapButtonLabels();
  }
  // Sync the popover's active option.
  document.querySelectorAll('#mc-basemap-popover .mc-popover-option').forEach(opt => {
    opt.classList.toggle('active', opt.dataset.mode === mode);
  });
};

// Mapbox public token, restricted by URL in account dashboard.
// Used only for routing (Directions API) — base tiles are CartoDB (see above).
const MAPBOX_TOKEN = 'pk.eyJ1IjoiYW50YXJhbjIiLCJhIjoiY21vZGxqZ2E2MDQxcjJvcjFwYnl0cW94cCJ9.3XhY5-XiaDcBeEOvFUm_Jw';

// Highway lines are not drawn as colored polylines — motorways are visible
// through the CartoDB base tiles. HIGHWAY_COLORS (from tolls.js) is still
// used for legend dots, toll markers, side panel badges, and verdict chip borders.

window.setActiveRouteLayer = function(coords) {
  if (window._activeRouteHighlight) map.removeLayer(window._activeRouteHighlight);
  window._activeRouteHighlight = L.polyline(coords, {
    color: '#2a6b9e', weight: 4, opacity: 0.75,
  }).addTo(map);
};
window.clearActiveRouteLayer = function() {
  if (window._activeRouteHighlight) {
    map.removeLayer(window._activeRouteHighlight);
    window._activeRouteHighlight = null;
  }
};

// ── Route fetcher ─────────────────────────────────────────
// Uses Mapbox Directions API for all routing: main analyze route, bypass
// (with motorway exclusion), and highway-vs-bypass comparison. Cached in
// localStorage so repeat queries don't burn API calls.
const routeCache = {};

async function fetchRoute(exitPt, entryPt, mode, via, opts) {
  opts = opts || {};
  const wantSteps = opts.steps === true;
  // Localized turn-by-turn instructions: el for Greek users, en for everyone
  // else. Mapbox accepts only language codes it has translations for; for
  // unsupported codes, the response falls back to English silently.
  const lang = (typeof getCurrentLang === 'function' && getCurrentLang() === 'el') ? 'el' : 'en';
  const viaKey = via?.length
    ? via.map(p => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join('|')
    : '';
  const stepsKey = wantSteps ? ':S' : '';
  // Cache key includes language: a Greek user and an English user requesting
  // the same route get separate cached responses with their respective
  // localised step instructions.
  const langKey = wantSteps ? `:${lang}` : '';
  const key = `${mode}${stepsKey}${langKey}:${exitPt.lat.toFixed(5)},${exitPt.lng.toFixed(5)};${entryPt.lat.toFixed(5)},${entryPt.lng.toFixed(5)}${viaKey ? '|' + viaKey : ''}`;

  if (routeCache[key]) return routeCache[key];

  // localStorage cache: bumped from v5 → v6 in R28 (added instructions[]
  // field; old entries lack it and would render as "Directions unavailable"
  // without a refetch). Old v5 entries are abandoned; localStorage will GC
  // them as it fills.
  try {
    const stored = localStorage.getItem(`diodio.route.v6.${key}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      routeCache[key] = parsed;
      return parsed;
    }
  } catch (e) { /* ignore */ }

  let url;
  // In bypass mode we always insert the curated `via` waypoints between exit
  // and entry. In highway mode we accept `via` too — used by the side-panel
  // comparison to anchor the highway segment to the toll booth's exact
  // position, so Mapbox can't generate a backtracking route through some
  // alternative interchange. Without this, ramp coordinates can confuse
  // Mapbox into routing off-motorway then back on, which produces nonsense
  // distances and arrows that point the wrong way.
  const waypoints = via?.length
    ? [exitPt, ...via, entryPt]
    : [exitPt, entryPt];
  const coordStr = waypoints.map(p => `${p.lng},${p.lat}`).join(';');
  const exclude = mode === 'bypass' ? '&exclude=motorway' : '';
  // steps + language only attached when we want instructions; saves bytes
  // on the toll-segment-only highway calls.
  const stepsParam = wantSteps ? `&steps=true&language=${lang}` : '';
  url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordStr}?geometries=geojson&overview=full${exclude}${stepsParam}&access_token=${MAPBOX_TOKEN}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.length) {
      console.warn('[mydiodia] route fetch failed', mode, key, data);
      return null;
    }
    const r = data.routes[0];
    const result = {
      coords:      r.geometry.coordinates.map(c => [c[1], c[0]]),
      distanceKm:  r.distance / 1000,
      durationMin: r.duration / 60,
    };
    if (wantSteps) {
      // Toll-segment classification (existing behaviour).
      const segs = computeTollSegments(r);
      if (segs) {
        result.segments     = segs.segments;
        result.tollKm       = segs.tollKm;
        result.nonTollKm    = segs.nonTollKm;
      }
      // R28: extract turn-by-turn instructions from legs[].steps[]. Each
      // step has a maneuver.instruction string already localised by Mapbox
      // (because we passed &language=). Distance is in metres → km.
      // Filter out trivial "head north" type prelude steps (< 50 m) and
      // the always-trailing "you have arrived" step which is unhelpful in
      // a printed reference. Cap at 10 entries — printed bypass directions
      // longer than 10 lines are rarely useful and crowd the page.
      const allSteps = [];
      for (const leg of (r.legs || [])) {
        for (const step of (leg.steps || [])) {
          const text = step.maneuver?.instruction || step.name || '';
          const m = step.distance || 0;
          if (!text) continue;
          if (m < 50 && allSteps.length > 0) continue;  // skip trivial prelude
          if (/arrived|έχετε φτάσει|έφτασες/i.test(text)) continue;
          allSteps.push({
            text,
            km: m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`,
          });
        }
      }
      // Cap & dedupe consecutive identical instructions (rare but happens
      // at waypoints).
      const seen = new Set();
      const dedupe = [];
      for (const s of allSteps) {
        const key = s.text + '|' + s.km;
        if (seen.has(key)) continue;
        seen.add(key);
        dedupe.push(s);
        if (dedupe.length >= 10) break;
      }
      result.instructions = dedupe;
    }
    routeCache[key] = result;
    try { localStorage.setItem(`diodio.route.v6.${key}`, JSON.stringify(result)); } catch (e) {}
    return result;
  } catch (e) {
    console.warn('[mydiodia] route fetch error', mode, key, e);
    return null;
  }
}

// Walk a Mapbox route's intersections and group the polyline into toll/non-toll
// segments. Each intersection has a `geometry_index` (into the full route
// polyline) and a `classes` array. A segment is "on toll" if the upstream
// intersection's classes contain "toll".
function computeTollSegments(route) {
  if (!route.legs) return null;
  const allCoords = route.geometry.coordinates;  // [[lng,lat], ...]
  // Collect every intersection across all legs/steps in route order.
  const intersections = [];
  for (const leg of route.legs) {
    if (!leg.steps) continue;
    for (const step of leg.steps) {
      if (!step.intersections) continue;
      for (const inter of step.intersections) {
        if (typeof inter.geometry_index !== 'number') continue;
        intersections.push({
          gi:      inter.geometry_index,
          isToll:  Array.isArray(inter.classes) && inter.classes.includes('toll'),
        });
      }
    }
  }
  if (intersections.length < 2) return null;
  // Dedupe: intersections at the same geometry_index can repeat at step boundaries.
  // Keep the first occurrence per gi.
  const seen = new Set();
  const cleaned = [];
  for (const it of intersections) {
    if (seen.has(it.gi)) continue;
    seen.add(it.gi);
    cleaned.push(it);
  }
  cleaned.sort((a, b) => a.gi - b.gi);
  // Build segments: each segment spans from intersection[i].gi to intersection[i+1].gi
  // and inherits intersection[i].isToll. Coords used are allCoords[gi..nextGi].
  const segments = [];
  let tollKm = 0, nonTollKm = 0;
  for (let i = 0; i < cleaned.length - 1; i++) {
    const a = cleaned[i], b = cleaned[i + 1];
    const coordSlice = allCoords.slice(a.gi, b.gi + 1).map(c => [c[1], c[0]]);
    if (coordSlice.length < 2) continue;
    let segKm = 0;
    for (let j = 0; j < coordSlice.length - 1; j++) {
      segKm += haversineKm(
        { lat: coordSlice[j][0],   lng: coordSlice[j][1] },
        { lat: coordSlice[j+1][0], lng: coordSlice[j+1][1] }
      );
    }
    segments.push({ coords: coordSlice, isToll: a.isToll, distanceKm: segKm });
    if (a.isToll) tollKm += segKm; else nonTollKm += segKm;
  }
  // Coalesce adjacent same-class segments to reduce polyline count.
  const merged = [];
  for (const s of segments) {
    const last = merged[merged.length - 1];
    if (last && last.isToll === s.isToll) {
      // Skip first coord of new segment to avoid duplicate joints
      last.coords = last.coords.concat(s.coords.slice(1));
      last.distanceKm += s.distanceKm;
    } else {
      merged.push({ coords: s.coords.slice(), isToll: s.isToll, distanceKm: s.distanceKm });
    }
  }
  return { segments: merged, tollKm, nonTollKm };
}

// Backward-compat helper used by calculator.js
window.fetchBypassRoute = async function(exitPt, entryPt, via) {
  const r = await fetchRoute(exitPt, entryPt, 'bypass', via);
  return r ? r.coords : null;
};
// Main analyze route: full origin → destination via motorway. Returns the
// same {coords, distanceKm, durationMin} shape as fetchRoute, plus
// {segments, tollKm, nonTollKm} when intersection-class data is available.
window.fetchMainRoute = async function(fromCoord, toCoord) {
  return fetchRoute(fromCoord, toCoord, 'highway', null, { steps: true });
};
window.fetchRoute = fetchRoute;

// ── Help popover + overflow menu ──────────────────────────
// The topbar overflow ("···") menu holds rare actions: Help and Feedback.
// Help opens a small popover anchored below the overflow trigger; feedback
// is just a mailto link. Mobile drawer keeps its own drawer-level Help
// button which calls openHelpPopover() directly. Single source of truth
// for help visibility.

const helpPopover     = document.getElementById('help-popover');
const helpPopoverClose= document.getElementById('help-popover-close');
const overflowToggle  = document.getElementById('overflow-toggle');
const overflowTrigger = document.getElementById('overflow-trigger-btn');
const overflowMenu    = document.getElementById('overflow-menu');
const overflowHelp    = document.getElementById('overflow-help');

function openOverflowMenu() {
  if (!overflowMenu || !overflowTrigger) return;
  overflowMenu.hidden = false;
  overflowTrigger.setAttribute('aria-expanded', 'true');
  setTimeout(() => {
    document.addEventListener('mousedown', onOverflowOutsideClick, true);
    document.addEventListener('keydown', onOverflowKey, true);
  }, 0);
}
function closeOverflowMenu() {
  if (!overflowMenu || !overflowTrigger) return;
  overflowMenu.hidden = true;
  overflowTrigger.setAttribute('aria-expanded', 'false');
  document.removeEventListener('mousedown', onOverflowOutsideClick, true);
  document.removeEventListener('keydown', onOverflowKey, true);
}
function onOverflowOutsideClick(ev) {
  if (overflowToggle && !overflowToggle.contains(ev.target)) closeOverflowMenu();
}
function onOverflowKey(ev) {
  if (ev.key === 'Escape') { closeOverflowMenu(); overflowTrigger?.focus(); }
}

if (overflowTrigger) {
  overflowTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    if (overflowMenu && overflowMenu.hidden) openOverflowMenu();
    else closeOverflowMenu();
  });
}

// Position the help-popover so its arrow points at the overflow trigger
// (or any caller-supplied anchor element). Called on open and on
// resize while the popover is visible.
function positionHelpPopover(anchor) {
  if (!helpPopover || !anchor) return;
  const r = anchor.getBoundingClientRect();
  const pop = helpPopover;
  // Width is fixed by CSS; clamp left so it stays in viewport with 8px
  // breathing room. Right-align under the trigger when there's space,
  // otherwise nudge left.
  const popWidth  = pop.offsetWidth || 320;
  const margin    = 8;
  let left = r.right - popWidth;             // right-align by default
  if (left < margin) left = margin;
  if (left + popWidth > window.innerWidth - margin) {
    left = window.innerWidth - popWidth - margin;
  }
  const top = r.bottom + 10;
  pop.style.left = left + 'px';
  pop.style.top  = top  + 'px';
  // Arrow points at trigger center horizontally
  const arrow = pop.querySelector('.help-popover-arrow');
  if (arrow) {
    const triggerCenter = r.left + r.width / 2;
    arrow.style.left = (triggerCenter - left - 7) + 'px';
  }
}

let _helpAnchor = null;
function openHelpPopover(anchor) {
  if (!helpPopover) return;
  _helpAnchor = anchor || overflowTrigger;
  helpPopover.hidden = false;
  positionHelpPopover(_helpAnchor);
  setTimeout(() => {
    document.addEventListener('mousedown', onHelpOutsideClick, true);
    document.addEventListener('keydown', onHelpKey, true);
    window.addEventListener('resize', onHelpResize);
  }, 0);
}
function closeHelpPopover() {
  if (!helpPopover) return;
  helpPopover.hidden = true;
  _helpAnchor = null;
  document.removeEventListener('mousedown', onHelpOutsideClick, true);
  document.removeEventListener('keydown', onHelpKey, true);
  window.removeEventListener('resize', onHelpResize);
}
function onHelpOutsideClick(ev) {
  if (helpPopover && !helpPopover.contains(ev.target) && !ev.target.closest('#overflow-help, #mobile-help-btn')) {
    closeHelpPopover();
  }
}
function onHelpKey(ev) {
  if (ev.key === 'Escape') closeHelpPopover();
}
function onHelpResize() {
  if (_helpAnchor) positionHelpPopover(_helpAnchor);
}

if (overflowHelp) {
  overflowHelp.addEventListener('click', (e) => {
    e.preventDefault();
    closeOverflowMenu();
    openHelpPopover(overflowTrigger);
  });
}
if (helpPopoverClose) {
  helpPopoverClose.addEventListener('click', closeHelpPopover);
}
// Expose for the mobile-drawer help button (wired in pages.js).
window.openHelpPopover = openHelpPopover;

// ── Language toggle ───────────────────────────────────────
document.getElementById('lang-toggle').addEventListener('click', toggleLanguage);

// ── Hover tooltip ─────────────────────────────────────────
const tooltipEl = document.createElement('div');
tooltipEl.className = 'toll-tooltip';
document.body.appendChild(tooltipEl);

function buildHoverTooltip(toll) {
  // Side tolls use the yellow side-toll color across all UI accents,
  // matching their map markers. Other tolls use the highway color.
  const color    = toll.type === 'side' ? SIDE_TOLL_COLOR : (HIGHWAY_COLORS[toll.highway] || '#888');
  const dirIcons = { frontal: '⇄', entry: '⬆', exit: '⬇', bridge: '⇌', side: '◇' };
  // Same notes-by-language logic as the side panel. Tolls with only
  // English `notes` show nothing in EL mode (preserving existing
  // behavior); Greek `notes_gr` opt-in fields surface in EL mode.
  const noteText = (getCurrentLang() === 'el' && toll.notes_gr)
    ? toll.notes_gr
    : (getCurrentLang() === 'en' ? toll.notes : null);
  const notes    = noteText ? `<div class="tt-notes">${noteText}</div>` : '';
  return `
    <div class="tt-header">
      <div>
        <div class="tt-name">${stripTollPrefix(toll.name_en)}</div>
        <div class="tt-name-gr">${stripTollPrefix(toll.name_gr)}</div>
        <div class="tt-sub">${toll.operator} · <em>${t('hover.click.details')}</em></div>
      </div>
      <div class="tt-badge" style="color:${color};border-color:${color}">${toll.highway}</div>
    </div>
    <div class="tt-direction">
      <span>${dirIcons[toll.type] || '⇄'}</span>
      <span>${toll.direction_label}</span>
    </div>
    <div class="tt-prices">
      <div class="price-cell">
        <span class="vehicle-icon">${window.getVehicleMeta().emoji}</span>
        <span class="price-val"><span class="eur">€</span>${window.getTollPrice(toll, window.getVehicleCat()).toFixed(2)}</span>
      </div>
    </div>
    ${notes}`;
}

function positionTooltip(e) {
  const m = 14, tw = tooltipEl.offsetWidth || 260, th = tooltipEl.offsetHeight || 160;
  let x = e.clientX + m, y = e.clientY + m;
  if (x + tw > window.innerWidth  - m) x = e.clientX - tw - m;
  if (y + th > window.innerHeight - m) y = e.clientY - th - m;
  tooltipEl.style.left = x + 'px';
  tooltipEl.style.top  = y + 'px';
}
document.addEventListener('mousemove', e => {
  if (tooltipEl.style.display === 'block') positionTooltip(e);
});

// ── Dim / restore helpers ─────────────────────────────────
function dimAll() {
  allMarkers.forEach(({ marker }) => marker.setOpacity(0.07));
  // Also dim ramp markers if visible
  rampMarkers.forEach(({ exitM, entryM, connLine }) => {
    if (exitM)    exitM.setOpacity(0.07);
    if (entryM)   entryM.setOpacity(0.07);
    if (connLine) connLine.setStyle({ opacity: 0.04 });
  });
}

function restoreAll() {
  allMarkers.forEach(({ marker }) => marker.setOpacity(1));
  rampMarkers.forEach(({ exitM, entryM, connLine }) => {
    if (exitM)    exitM.setOpacity(rampsVisible ? 1 : 0);
    if (entryM)   entryM.setOpacity(rampsVisible ? 1 : 0);
    if (connLine) connLine.setStyle({ opacity: rampsVisible ? 0.5 : 0 });
  });
}

// ── Side panel ────────────────────────────────────────────
let inspectLayers = [];
let sidePanelOpen = false;
let sidePanelOpenedAt = 0;
let currentTollOpen = null;
let _hoveredToll = null;  // tracked for vehicle-change re-render
const legendEl    = document.getElementById('legend');

function clearInspectLayers() {
  inspectLayers.forEach(l => map.removeLayer(l));
  inspectLayers = [];
}

function closeSidePanel() {
  document.getElementById('toll-side-panel')?.classList.remove('open');
  document.body.classList.remove('panel-open');
  clearInspectLayers();
  restoreAll();
  // Revert any side-toll icon swaps + z-index bumps applied by openSidePanel
  // for this toll's bypass-billed side tolls. Default zIndexOffset for
  // side markers is 100; ramp signs are 600; we used 700 to elevate.
  // Ferry pier markers (R31) have id pattern *_ferry_pier_* and their own
  // icon class — leave those alone.
  sideMarkers.forEach(({ toll, marker }) => {
    marker.setZIndexOffset(100);
    if (marker._bumped) {
      // Only ferry-pier ids contain "_ferry_pier_"; those weren't bumped
      // (bypassSideTollCost can't find them), so this branch only fires
      // for real side tolls and the regular icon is correct.
      if (!String(toll.id).includes('_ferry_pier_')) {
        marker.setIcon(makeRegularSideIcon());
      }
      marker._bumped = false;
    }
  });
  sidePanelOpen = false;
  currentTollOpen = null;
  if (typeof setActiveTollLabel === 'function') setActiveTollLabel(null);
  // Refresh map size after layout change so it fills new available area
  setTimeout(() => map.invalidateSize(), 320);
}

// ── Direction-of-travel arrow helpers ──────────────────────────────────
//
// When the user opens a toll's side panel, we draw two routes (bypass +
// highway). To make direction unambiguous, we drop a small chevron arrow
// at the midpoint of each route, rotated to point along the direction of
// travel (from exit toward entry).

// Compass bearing in degrees (0 = north, 90 = east, 180 = south, 270 = west)
// from point a to point b. Standard great-circle bearing formula.
function bearingDeg(a, b) {
  const toRad = d => d * Math.PI / 180;
  const toDeg = r => r * 180 / Math.PI;
  const φ1 = toRad(a.lat), φ2 = toRad(b.lat);
  const Δλ = toRad(b.lng - a.lng);
  const y  = Math.sin(Δλ) * Math.cos(φ2);
  const x  = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

// Great-circle distance between two {lat, lng} points in kilometers.
// Used for ferry-mode bypass stats where we don't fetch a road route.
function haversineKm(a, b) {
  const R = 6371;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const A = Math.sin(dLat/2)**2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(A), Math.sqrt(1 - A));
}
window.haversineKm = haversineKm;

// Given a polyline (array of [lat, lng] pairs), find the midpoint by
// array index plus the local bearing at that point. For routes with
// reasonably even waypoint spacing (Mapbox output) this approximates
// the cumulative-distance midpoint well enough.
function polylineMidpointAndBearing(coords) {
  if (!coords || coords.length < 2) return null;
  const midIdx = Math.floor(coords.length / 2);
  const a = { lat: coords[midIdx - 1][0], lng: coords[midIdx - 1][1] };
  const b = { lat: coords[midIdx][0],     lng: coords[midIdx][1] };
  // Midpoint as the average of the two surrounding waypoints
  const mid = [(a.lat + b.lat) / 2, (a.lng + b.lng) / 2];
  return { latlng: mid, bearing: bearingDeg(a, b) };
}

// Rotated arrow icon. Rotation is applied via CSS transform.
// Uses a filled triangle (▲) anchored at center; a chevron `^` reads as
// ambiguous (could be a peak), but a solid triangle clearly says
// "this is the direction of travel."
function makeDirectionArrow(bearing, colorClass) {
  return L.divIcon({
    className: `dir-arrow-wrap ${colorClass}`,
    html: `<div class="dir-arrow" style="transform:rotate(${bearing}deg)">
      <svg viewBox="0 0 24 24" width="22" height="22">
        <polygon points="12,3 20,20 12,16 4,20" fill="currentColor" stroke="white" stroke-width="1.2" stroke-linejoin="round" />
      </svg>
    </div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}


// EXIT sign icon — auto-sized so any language fits, includes place name.
// `offsetDown` (px) shifts the sign visually below the geo anchor — used
// when a side-toll dot sits at the same coord, so the dot stays visible
// at its real position and the sign clears below it.
function makeExitIcon(placeName, offsetDown) {
  const nameHtml = placeName
    ? `<span class="ramp-sign-name">${placeName}</span>`
    : '';
  // iconAnchor [0, 8] is the default — sign sits with its top 8px above
  // geo coord. Negate offsetDown so that adding 16 here pushes the sign
  // 16px BELOW its default position (i.e. coord ends up 16+8 = 24px
  // above the sign's top edge, leaving clear space for the side-toll dot).
  const anchorY = (offsetDown ? -offsetDown : 8);
  return L.divIcon({
    className: 'ramp-icon-wrap',
    html: `<div class="ramp-sign ramp-sign-exit">${t('ramp.exit.label')}${nameHtml}</div>`,
    iconSize: [null, null], iconAnchor: [0, anchorY],
  });
}

// ENTER sign icon — auto-sized so any language fits, includes place name.
// `offsetDown` (px) shifts the sign visually below the geo anchor — used
// when a side-toll dot sits at the same coord (see makeExitIcon).
function makeEntryIcon(placeName, offsetDown) {
  const nameHtml = placeName
    ? `<span class="ramp-sign-name">${placeName}</span>`
    : '';
  const anchorY = (offsetDown ? -offsetDown : 8);
  return L.divIcon({
    className: 'ramp-icon-wrap',
    html: `<div class="ramp-sign ramp-sign-entry">${t('ramp.entry.label')}${nameHtml}</div>`,
    iconSize: [null, null], iconAnchor: [0, anchorY],
  });
}

// Bumped side-toll icon — used for side tolls billed on the currently-open
// toll's bypass. Larger than the regular 11px side-toll dot, with a strong
// amber ring, so it pops visually. Centered on the geo coord — when a
// ramp pillar (EXIT/RE-ENTER) shares the same lat/lng, the *pillar* is
// offset away from the coord (see makeExitIcon/makeEntryIcon), not this
// dot. Toll positions are real geographic data and shouldn't be moved.
function makeBumpedSideIcon() {
  return L.divIcon({
    className: '',
    html: `<div class="toll-marker toll-marker-side toll-marker-bypass-side toll-marker-bumped" style="background:${SIDE_TOLL_COLOR}"></div>`,
    iconSize:   [16, 16],
    iconAnchor: [8, 8],
  });
}

// Regular side-toll icon, used to restore a marker after un-bumping.
// Mirrors the inline icon definition in the TOLL_DATA.forEach loop.
function makeRegularSideIcon() {
  return L.divIcon({
    className: '',
    html: `<div class="toll-marker toll-marker-side" style="background:${SIDE_TOLL_COLOR}"></div>`,
    iconSize:   [11, 11],
    iconAnchor: [5.5, 5.5],
  });
}

// ── Side-toll display-name cleaner ────────────────────────
// Side-toll names in the data are deliberately verbose so the dataset is
// self-describing — e.g. "Πλευρικά Καπανδρίτι — Βόρεια είσοδος" /
// "Kapandriti side — N entry". When we list these inside a "you'll still
// pay X side tolls" callout, the prefix and direction suffix are
// redundant (the callout already says "side toll" and renders the role
// separately). This helper strips both.
//
// Suffix format (since R33):
//   GR: "Πλευρικά Δρέπανο — Προς ανατολικά — είσοδος"  → "Δρέπανο"
//   EN: "Drepano side — Eastbound entry"                  → "Drepano"
// Old pre-R33 formats also handled for backward compat with cached data.
function cleanSideTollName(name, lang) {
  if (!name) return '';
  if (lang === 'el') {
    return name
      .replace(/^Πλευρικά\s+/i, '')
      // New format: "— Προς βόρεια — είσοδος[ Α]"
      .replace(/\s+[—–-]\s+Προς\s+(βόρεια|νότια|ανατολικά|δυτικά)\s+[—–-]\s+(είσοδος|έξοδος).*$/i, '')
      // Legacy bare-adjective format
      .replace(/\s+[—–-]\s+(Βόρεια|Νότια|Ανατολική|Δυτική).*$/i, '')
      .trim();
  }
  return name
    // New format: "side — Northbound entry[ A]"
    .replace(/\s+side\s+[—–-]\s+(Northbound|Southbound|Eastbound|Westbound)\s+(entry|exit)(\s+[A-Z])?\s*$/i, '')
    // Legacy "side — N entry" format
    .replace(/\s+side\s+[—–-]\s+[NSEW]\s+(entry|exit)\s*$/i, '')
    .replace(/\s+side\s*$/i, '')
    .trim();
}

function openSidePanel(toll) {
  // Auto-dismiss the first-visit tip — user took the hint, don't show again.
  if (typeof window.dismissFirstTip === 'function') window.dismissFirstTip();
  clearInspectLayers();
  // Reset z-index + icon swap of any side-toll markers a previous panel
  // may have bumped (when transitioning panel→panel without closing).
  // Default for side markers is 100; we re-elevate this toll's billed
  // side tolls below.
  sideMarkers.forEach(({ toll: sideToll, marker }) => {
    marker.setZIndexOffset(100);
    if (marker._bumped) {
      if (!String(sideToll.id).includes('_ferry_pier_')) {
        marker.setIcon(makeRegularSideIcon());
      }
      marker._bumped = false;
    }
  });
  sidePanelOpen = true;
  sidePanelOpenedAt = Date.now();
  currentTollOpen = toll;
  document.body.classList.add('panel-open');

  // Single source of truth for the currently active direction filter,
  // shared between setDirectionFilter() and the async Mapbox .then()
  // callbacks that update bypass/highway line opacities. Without this,
  // a callback resolving after the filter was applied would overwrite
  // the filter's opacity:0 with its own opacity:0.9, making both
  // directions visible until the user clicks a filter pill a second
  // time. Set in setDirectionFilter; consulted in the Mapbox callback.
  let activeDirFilter = null;

  // Mark side-toll panels with a class so CSS can theme them yellow.
  // (Direction pills, badges, etc. switch from blue to yellow accents.)
  const panelEl = document.getElementById('toll-side-panel');
  if (panelEl) panelEl.classList.toggle('side-toll', toll.type === 'side');

  // Mark this toll's label as active (green dot)
  if (typeof setActiveTollLabel === 'function') setActiveTollLabel(toll.id);

  // Dim everything first
  dimAll();

  // Restore just this toll's marker
  const myMarker = allMarkers.find(m => m.toll.id === toll.id);
  if (myMarker) myMarker.marker.setOpacity(1);

  // Side tolls billed on any of this toll's bypasses should remain
  // visible AND sit clearly above/beside the EXIT/RE-ENTER ramp signs
  // (which usually share the same lat/lng). Without this, dimAll() drops
  // them to 0.07 opacity and the visually-larger ramp pillars completely
  // cover the small 11px side-toll dots even with z-index priority.
  //
  // Three-part fix:
  //   1. Restore opacity to 1
  //   2. Bump z-index above ramp signs (which sit at 600)
  //   3. Swap to a larger icon offset up-and-left so it pops out of
  //      the ramp pillar's footprint
  // All reverted on close (or at start of next openSidePanel).
  if (toll.bypass_directions && typeof window.bypassSideTollCost === 'function') {
    Object.entries(toll.bypass_directions).forEach(([dirKey, dir]) => {
      if (!dir) return;
      // bypassSideTollCost only finds type:"side" records — ferry-mode
      // bypasses return empty (no "side" tolls at sea piers), which is fine.
      const info = window.bypassSideTollCost(toll, dirKey, dir);
      info.items.forEach(({ toll: sideToll }) => {
        const sm = allMarkers.find(am => am.toll.id === sideToll.id);
        if (sm) {
          sm.marker.setOpacity(1);
          sm.marker.setZIndexOffset(700);
          sm.marker.setIcon(makeBumpedSideIcon());
          // Mark so closeSidePanel knows to revert.
          sm.marker._bumped = true;
        }
      });
    });
  }

  // Wait for layout transition to settle (panel opens, bottom bar hides on mobile),
  // then invalidate map size so Leaflet recalculates its viewport and centers correctly.
  setTimeout(() => {
    map.invalidateSize();
    // Fit the view to the toll + its bypass endpoints (off_ramp & on_ramp
    // for each direction) so the user sees BOTH the toll plaza AND where
    // the bypass diverges/rejoins. Without this, very long bypasses fly
    // off-screen and the user has to pan to find the ramps.
    //
    // For tolls without bypass data (most side tolls, some frontals),
    // fall back to the previous "center on toll at zoom 11" behavior.
    const points = [[toll.lat, toll.lng]];
    if (toll.bypass_directions) {
      for (const dir of Object.values(toll.bypass_directions)) {
        if (!dir || dir.mode === 'ferry') continue;
        ['off_ramp', 'on_ramp', 'pre_exit', 'post_merge'].forEach(k => {
          if (dir[k] && typeof dir[k].lat === 'number') {
            points.push([dir[k].lat, dir[k].lng]);
          }
        });
      }
    }
    if (points.length > 1) {
      // Fit with asymmetric padding: extra on the right so the toll isn't
      // hidden behind the 420px-wide side panel. The panel covers roughly
      // the right third of the viewport on desktop. Mobile uses a bottom
      // sheet instead of right panel, so we use plain padding there.
      const isMobile = window.matchMedia('(max-width: 740px)').matches;
      const fitOpts = isMobile
        ? { padding: [60, 60], maxZoom: 14, animate: true }
        : { paddingTopLeft: [60, 60], paddingBottomRight: [500, 60], maxZoom: 14, animate: true };
      map.fitBounds(L.latLngBounds(points), fitOpts);
    } else {
      // Solo toll (no bypass) — just center and zoom in.
      map.setView([toll.lat, toll.lng], Math.max(map.getZoom(), 13), { animate: true });
    }
  }, 320);

  const bd    = toll.bypass_directions;
  // Side tolls use the yellow side-toll color across all UI accents,
  // matching their map markers. Other tolls use the highway color.
  const color = toll.type === 'side' ? SIDE_TOLL_COLOR : (HIGHWAY_COLORS[toll.highway] || '#888');

  if (bd) {
    const dirEntries = Object.entries(bd);
    // Distinct colors for each direction so they don't overlap visually.
    // Both shades are blue because the bypass line is now blue (Greek
    // motorway-sign convention: blue = local/free road).
    const dirColors = ['#2a6b9e', '#3d83bc'];

    dirEntries.forEach(([key, dir], i) => {
      // Need all four ramp coords. The normalizer ensures we have at least
      // off_ramp/on_ramp/pre_exit/post_merge for any direction that
      // originally had exit+entry. If still missing, the data is broken;
      // skip silently rather than crash.
      if (!dir.off_ramp || !dir.on_ramp || !dir.pre_exit || !dir.post_merge) return;

      const lineColor = dirColors[i % dirColors.length];

      // Initial bearing along the route's overall direction (pre_exit →
      // post_merge). Updated to actual route bearing once Mapbox returns.
      const placeholderBearing = bearingDeg(dir.pre_exit, dir.post_merge);
      const placeholderMid = [
        (dir.pre_exit.lat + dir.post_merge.lat) / 2,
        (dir.pre_exit.lng + dir.post_merge.lng) / 2,
      ];

      // ─── Bypass line (local roads, blue per Greek motorway-sign convention:
      //     blue = local/free road, green = motorway). The bypass is now
      //     drawn as a single concatenated polyline from pre_exit through
      //     off_ramp and on_ramp to post_merge — same start/end as the
      //     highway route, diverging only in the middle. ───
      const bypassPlaceholder = [
        [dir.pre_exit.lat,   dir.pre_exit.lng],
        [dir.off_ramp.lat,   dir.off_ramp.lng],
        [dir.on_ramp.lat,    dir.on_ramp.lng],
        [dir.post_merge.lat, dir.post_merge.lng],
      ];
      const bypassLine = L.polyline(bypassPlaceholder, {
        color: lineColor, weight: 4, opacity: 0.5, dashArray: '8 6',
        lineCap: 'round', lineJoin: 'round',
      }).addTo(map);
      bypassLine.bindTooltip(
        `🔵 ${translateDirectionLabel(dir.label)} — ${t(dir.mode === 'ferry' ? 'bypass.via.ferry' : 'bypass.via.local')}`,
        { sticky: true, className: 'bypass-tooltip' }
      );
      bypassLine._dirKey = key;
      inspectLayers.push(bypassLine);

      const bypassArrow = L.marker(placeholderMid, {
        icon: makeDirectionArrow(placeholderBearing, 'dir-arrow-bypass'),
        zIndexOffset: 500,
        interactive: false,
      }).addTo(map);
      bypassArrow._dirKey = key;
      inspectLayers.push(bypassArrow);

      // ─── Highway line (motorway through the toll, green) ───
      const highwayPlaceholder = [
        [dir.pre_exit.lat,   dir.pre_exit.lng],
        [dir.post_merge.lat, dir.post_merge.lng],
      ];
      const highwayLine = L.polyline(highwayPlaceholder, {
        color: '#2e7a4a', weight: 3.5, opacity: 0.4, dashArray: '4 6',
        lineCap: 'round', lineJoin: 'round',
      }).addTo(map);
      highwayLine.bindTooltip(
        `🟢 ${translateDirectionLabel(dir.label)} — ${t('bypass.via.highway')}`,
        { sticky: true, className: 'bypass-tooltip' }
      );
      highwayLine._dirKey = key;
      inspectLayers.push(highwayLine);

      const highwayArrow = L.marker(placeholderMid, {
        icon: makeDirectionArrow(placeholderBearing, 'dir-arrow-highway'),
        zIndexOffset: 500,
        interactive: false,
      }).addTo(map);
      highwayArrow._dirKey = key;
      inspectLayers.push(highwayArrow);

      function updateArrow(arrow, coords, colorClass) {
        const mb = polylineMidpointAndBearing(coords);
        if (!mb) return;
        arrow.setLatLng(mb.latlng);
        arrow.setIcon(makeDirectionArrow(mb.bearing, colorClass));
      }

      // ─── Fetch the routes ───
      //
      // Highway: single Mapbox call from pre_exit to post_merge, no
      // waypoints. Mapbox naturally takes the through-motorway between two
      // motorway points.
      //
      // Bypass: 3 legs concatenated:
      //   1. pre_exit → off_ramp  (motorway, no exclusion)
      //   2. off_ramp → on_ramp   (local roads, exclude=motorway)
      //   3. on_ramp  → post_merge (motorway, no exclusion)
      //
      // Sum the three durations and distances for the comparison stats;
      // concatenate the three polylines for visualization.
      //
      // Ferry mode: route the two road legs via Mapbox (using exit_ramp /
      // entry_ramp as waypoints to force the route through the actual ramp
      // toward the pier), then synthesize the ferry crossing as a straight
      // line between piers. Total bypass distance/time = leg1 + ferry +
      // leg2. Highway alternative = direct pre_exit → post_merge route via
      // the bridge (Mapbox knows the bridge exists and will use it).
      if (dir.mode === 'ferry') {
        Promise.all([
          fetchRoute(dir.pre_exit, dir.post_merge, 'highway'),
          fetchRoute(dir.pre_exit, dir.off_ramp,   'highway', dir.exit_ramp ? [dir.exit_ramp] : []),
          fetchRoute(dir.on_ramp,  dir.post_merge, 'highway', dir.entry_ramp ? [dir.entry_ramp] : []),
        ]).then(([highwayRes, leg1, leg2]) => {
          const visible = activeDirFilter == null
            || activeDirFilter === 'both'
            || activeDirFilter === key;
          if (highwayRes && highwayRes.coords.length > 1) {
            highwayLine.setLatLngs(highwayRes.coords);
            highwayLine.setStyle({ opacity: visible ? 0.7 : 0, dashArray: null });
            updateArrow(highwayArrow, highwayRes.coords, 'dir-arrow-highway');
            highwayArrow.setOpacity(visible ? 1 : 0);
            // Refine pill bearing from real route geometry (ferry-mode bridge).
            refineTollBearingFromRoute(toll, highwayRes.coords);
          }
          if (leg1 && leg2) {
            // Bypass coords: leg1 (drive to embarkation) + leg2 (drive from
            // disembarkation). The polyline jumps from leg1's last point
            // (off_ramp = pier A) to leg2's first point (on_ramp = pier B),
            // which visually represents the ferry crossing as a straight
            // line — exactly what we want.
            const ferryDistKm = haversineKm(dir.off_ramp, dir.on_ramp);
            const bypassCoords = [...leg1.coords, ...leg2.coords];
            const bypassRes = {
              coords:      bypassCoords,
              distanceKm:  leg1.distanceKm + ferryDistKm + leg2.distanceKm,
              durationMin: leg1.durationMin + dir.minutes + leg2.durationMin,
            };
            bypassLine.setLatLngs(bypassRes.coords);
            bypassLine.setStyle({ opacity: visible ? 0.9 : 0, dashArray: null });
            updateArrow(bypassArrow, bypassRes.coords, 'dir-arrow-bypass');
            bypassArrow.setOpacity(visible ? 1 : 0);
            updateDirStats(toll, key, dir, bypassRes, highwayRes);
          } else {
            // Mapbox failed for one of the road legs — fall back to
            // pier-to-pier straight-line stats so the panel still works.
            const ferryDistKm = haversineKm(dir.off_ramp, dir.on_ramp);
            const fallbackRes = {
              coords: [[dir.off_ramp.lat, dir.off_ramp.lng], [dir.on_ramp.lat, dir.on_ramp.lng]],
              distanceKm: ferryDistKm,
              durationMin: dir.minutes,
            };
            updateDirStats(toll, key, dir, fallbackRes, highwayRes || { distanceKm: ferryDistKm, durationMin: 5 });
          }
        });
      } else {
      Promise.all([
        fetchRoute(dir.pre_exit, dir.post_merge, 'highway'),
        Promise.all([
          fetchRoute(dir.pre_exit, dir.off_ramp,   'highway'),
          fetchRoute(dir.off_ramp, dir.on_ramp,    'bypass', dir.via),
          fetchRoute(dir.on_ramp,  dir.post_merge, 'highway'),
        ]).then(legs => {
          if (legs.some(l => !l)) return null;
          const coords = [
            ...legs[0].coords,
            ...legs[1].coords.slice(1), // skip duplicate endpoint
            ...legs[2].coords.slice(1),
          ];
          return {
            coords,
            distanceKm:  legs.reduce((s, l) => s + l.distanceKm,  0),
            durationMin: legs.reduce((s, l) => s + l.durationMin, 0),
          };
        }),
      ]).then(([highwayRes, bypassRes]) => {
        // Honor the current direction filter — if the user opened a
        // multi-direction toll and we're filtered to e.g. northbound, the
        // southbound .then() arrives later and would otherwise blindly
        // re-reveal that direction's lines. Check first.
        const visible = activeDirFilter == null
          || activeDirFilter === 'both'
          || activeDirFilter === key;
        if (highwayRes && highwayRes.coords.length > 1) {
          highwayLine.setLatLngs(highwayRes.coords);
          highwayLine.setStyle({ opacity: visible ? 0.7 : 0, dashArray: null });
          updateArrow(highwayArrow, highwayRes.coords, 'dir-arrow-highway');
          // setIcon (inside updateArrow) replaces the marker's DOM, so any
          // previously-applied setOpacity is lost. Re-apply.
          highwayArrow.setOpacity(visible ? 1 : 0);
          // Refine the toll's pill bearing from the actual route geometry —
          // far more accurate than the bypass-corridor approximation.
          refineTollBearingFromRoute(toll, highwayRes.coords);
        }
        if (bypassRes && bypassRes.coords.length > 1) {
          bypassLine.setLatLngs(bypassRes.coords);
          bypassLine.setStyle({ opacity: visible ? 0.9 : 0, dashArray: null });
          updateArrow(bypassArrow, bypassRes.coords, 'dir-arrow-bypass');
          bypassArrow.setOpacity(visible ? 1 : 0);
        }
        updateDirStats(toll, key, dir, bypassRes, highwayRes);
      });
      }

      // EXIT sign marker — anchored on the off-ramp itself.
      // If a side toll is at the same coord (its dot would be hidden under
      // the sign), offset the SIGN downward so the dot stays visible at
      // its real position. Toll positions are real geographic data and
      // shouldn't be moved.
      const sideInfo = (typeof window.bypassSideTollCost === 'function')
        ? window.bypassSideTollCost(toll, key, dir)
        : { items: [], totals: {}, anyAtRamps: false };
      const exitHasCoincident  = sideInfo.items.some(it => it.role === 'exit');
      const entryHasCoincident = sideInfo.items.some(it => it.role === 'entry');
      const RAMP_SIGN_OFFSET   = 16;  // px below geo coord, clears the 11/16px dot

      const em = L.marker([dir.off_ramp.lat, dir.off_ramp.lng], {
        icon: makeExitIcon(undefined, exitHasCoincident ? RAMP_SIGN_OFFSET : 0),
        zIndexOffset: 600,
      });
      em.bindTooltip(`${t('ramp.exit.tooltip', {name: dir.exit_name})}<br><small>${translateDirectionLabel(dir.label)}</small>`, {
        className: 'ramp-tooltip',
      });
      em.addTo(map);
      em._dirKey = key;
      inspectLayers.push(em);

      // ENTER sign marker — anchored on the on-ramp itself
      const nm = L.marker([dir.on_ramp.lat, dir.on_ramp.lng], {
        icon: makeEntryIcon(undefined, entryHasCoincident ? RAMP_SIGN_OFFSET : 0),
        zIndexOffset: 600,
      });
      nm.bindTooltip(`${t('ramp.entry.tooltip', {name: dir.entry_name})}<br><small>${translateDirectionLabel(dir.label)}</small>`, {
        className: 'ramp-tooltip',
      });
      nm.addTo(map);
      nm._dirKey = key;
      inspectLayers.push(nm);

      // ─── Bypass-context side-toll markers ────────────────────
      // If this bypass forces the driver through one or more side tolls,
      // pin them on the map so the route looks honest. We skip when the
      // global side-tolls toggle is already on (those markers are already
      // visible) to avoid duplicate dots at the same coords.
      if (!sideTollsVisible) {
        sideInfo.items.forEach(({ toll: sideToll, role }) => {
          // Use the same bumped icon as the global-toggle path: 16px
          // ringed marker offset up-and-left so it pops out from behind
          // the green RE-ENTER / blue EXIT pillar that usually shares
          // the same lat/lng. Without the offset, the dot is invisible.
          const sideMarker = L.marker([sideToll.lat, sideToll.lng], {
            icon: makeBumpedSideIcon(),
            zIndexOffset: 700,  // above ramp signs (600)
          });
          // Tooltip mirrors the side-panel callout — name + role.
          const lang = getCurrentLang();
          const nameForTip = cleanSideTollName(
            lang === 'el' ? sideToll.name_gr : sideToll.name_en,
            lang
          );
          const roleLabel  = t('sp.bypass.sidetolls.role.' + role);
          sideMarker.bindTooltip(
            `${nameForTip} <small>(${roleLabel})</small>`,
            { className: 'ramp-tooltip' }
          );
          // Click-through to side toll's own panel — same UX as global toggle.
          sideMarker.on('click', function(e) {
            L.DomEvent.stopPropagation(e);
            openSidePanel(sideToll);
          });
          sideMarker.addTo(map);
          sideMarker._dirKey = key;
          inspectLayers.push(sideMarker);
        });
      }
    });
  }

  // Translate direction labels from data (e.g. "Both directions", "Northbound (towards Thessaloniki)")
  function translateDirectionLabel(label) {
    if (!label) return '';
    // Map known patterns to translation keys
    const patterns = [
      { re: /^Both directions$/i,                          key: 'dir.both' },
      { re: /^Northbound \(towards (.+)\)$/i,              key: 'dir.northbound.to' },
      { re: /^Southbound \(towards (.+)\)$/i,              key: 'dir.southbound.to' },
      { re: /^Eastbound \(towards (.+)\)$/i,               key: 'dir.eastbound.to' },
      { re: /^Westbound \(towards (.+)\)$/i,               key: 'dir.westbound.to' },
      { re: /^Northbound$/i,                               key: 'dir.northbound' },
      { re: /^Southbound$/i,                               key: 'dir.southbound' },
      { re: /^Eastbound$/i,                                key: 'dir.eastbound' },
      { re: /^Westbound$/i,                                key: 'dir.westbound' },
      { re: /^Westbound only\. Eastbound is FREE\.$/i,     key: 'dir.westbound.free' },
      { re: /^Southbound \(entering Greece from (.+)\)$/i, key: 'dir.southbound.border' },
      { re: /^Westbound \(entering Greece from (.+)\)$/i,  key: 'dir.westbound.border' },
      { re: /^Exit — towards (.+)$/i,                      key: 'dir.exit.to' },
      { re: /^Pay once on entry — covers full traverse$/i, key: 'dir.entry.once' },
    ];
    for (const { re, key } of patterns) {
      const m = label.match(re);
      if (m) return t(key, { dest: translateCity(m[1] || '') });
    }
    return label; // fallback: show original
  }
  // Translate common destination/city names inline
  function translateCity(name) {
    if (!name) return '';
    const cityMap = {
      'Thessaloniki':    { el: 'Θεσσαλονίκη' },
      'Athens':          { el: 'Αθήνα' },
      'Ioannina':        { el: 'Ιωάννινα' },
      'Igoumenitsa':     { el: 'Ηγουμενίτσα' },
      'Patras':          { el: 'Πάτρα' },
      'Antirrio':        { el: 'Αντίρριο' },
      'Kavala':          { el: 'Καβάλα' },
      'Kavala/Drama':    { el: 'Καβάλα/Δράμα' },
      'Drama':           { el: 'Δράμα' },
      'Arta':            { el: 'Άρτα' },
      'Aigio':           { el: 'Αίγιο' },
      'Trikala':         { el: 'Τρίκαλα' },
      'Trikala city':    { el: 'Τρίκαλα' },
      'Karditsa':        { el: 'Καρδίτσα' },
      'Lamia':           { el: 'Λαμία' },
      'Peloponnese':     { el: 'Πελοπόννησος' },
      'Kozani':          { el: 'Κοζάνη' },
      'Veroia':          { el: 'Βέροια' },
      'Komotini':        { el: 'Κομοτηνή' },
      'Xanthi':          { el: 'Ξάνθη' },
      'Alexandroupoli':  { el: 'Αλεξανδρούπολη' },
      'Ardanio':         { el: 'Αρδάνιο' },
      'Rio/Bridge':      { el: 'Ρίο/Γέφυρα' },
      'Bulgaria':        { el: 'Βουλγαρία' },
      'N. Macedonia':    { el: 'Β. Μακεδονία' },
      'Sparta / Mystras':{ el: 'Σπάρτη / Μυστράς' },
      'Pyrgos / Ancient Olympia':   { el: 'Πύργος / Αρχαία Ολυμπία' },
      'Volos / Larissa east':       { el: 'Βόλος / Λάρισα Α.' },
      'Aeginio / Pieria coast':     { el: 'Αιγίνιο / Παραλία Πιερίας' },
    };
    const lang = getCurrentLang();
    if (lang === 'el' && cityMap[name]) return cityMap[name].el;
    return name;
  }

  // Update the comparison stats inline in the side panel after OSRM returns.
  // Three-column layout: money · distance · time. The Διαφορά row sits at the
  // bottom of the same table with sign-prefixed colored values, replacing the
  // old separate price-diff block + diff line.
  function updateDirStats(toll, dirKey, dir, bypassRes, highwayRes) {
    const el = document.querySelector(`.sp-dir[data-dir-key="${dirKey}"] [data-stats="${dirKey}"]`);
    if (!el) return;
    const fmtKm  = n => n != null ? `${n.toFixed(1)} ${t('unit.km')}` : '—';
    const fmtMin = n => n != null ? `${n.toFixed(1)} ${t('bar.time.label2')}` : '—';

    // Per-vehicle costs. Highway: the frontal toll. Bypass: side tolls (or ferry fare).
    const catKey = window.getVehicleCat();
    const isFerry = dir.mode === 'ferry' && dir.fare;
    const sideInfo = isFerry ? null
      : (typeof window.bypassSideTollCost === 'function'
          ? window.bypassSideTollCost(toll, dirKey, dir)
          : { totals: {} });
    const highwayCost = window.getTollPrice(toll, catKey, dirKey);
    const bypassCost = isFerry ? (dir.fare[catKey] || 0) : (sideInfo.totals[catKey] || 0);
    const fmtMoney = c => `€${c.toFixed(2)}`;

    // Bypass row
    const bm = el.querySelector('[data-bypass-money]');
    const bd = el.querySelector('[data-bypass-dist]');
    const bt = el.querySelector('[data-bypass-time]');
    if (bm) bm.textContent = fmtMoney(bypassCost);
    if (bypassRes) {
      if (bd) bd.textContent = fmtKm(bypassRes.distanceKm);
      if (bt) bt.textContent = fmtMin(bypassRes.durationMin);
    } else {
      if (bd) bd.textContent = t('compare.unavailable');
      if (bt) bt.textContent = '';
    }

    // Highway row
    const hm = el.querySelector('[data-highway-money]');
    const hd = el.querySelector('[data-highway-dist]');
    const ht = el.querySelector('[data-highway-time]');
    if (hm) hm.textContent = fmtMoney(highwayCost);
    if (highwayRes) {
      if (hd) hd.textContent = fmtKm(highwayRes.distanceKm);
      if (ht) ht.textContent = fmtMin(highwayRes.durationMin);
    } else {
      if (hd) hd.textContent = t('compare.unavailable');
      if (ht) ht.textContent = '';
    }

    // Diff row — bypass minus highway. Negative money = savings (green);
    // positive distance/time = cost (amber). Tint the row based on net money.
    const diffRow = el.querySelector('[data-diff-row]');
    const dm = el.querySelector('[data-diff-money]');
    const dd = el.querySelector('[data-diff-dist]');
    const dt = el.querySelector('[data-diff-time]');
    const moneyDiff = bypassCost - highwayCost;       // <0 = savings
    const moneySign = moneyDiff > 0 ? '+' : (moneyDiff < 0 ? '−' : '');
    const moneyCls  = moneyDiff < 0 ? 'savings' : (moneyDiff > 0 ? 'cost' : 'zero');
    if (dm) {
      dm.textContent = `${moneySign}€${Math.abs(moneyDiff).toFixed(2)}`;
      dm.className = `sp-cmp-money ${moneyCls}`;
    }
    if (diffRow) {
      // Tint the diff row green if the bypass net-saves money, amber if it costs more.
      diffRow.classList.toggle('savings', moneyDiff < 0);
      diffRow.classList.toggle('cost',    moneyDiff > 0);
    }
    if (bypassRes && highwayRes) {
      const distDiff = bypassRes.distanceKm  - highwayRes.distanceKm;
      const timeDiff = bypassRes.durationMin - highwayRes.durationMin;
      const distSign = distDiff > 0 ? '+' : (distDiff < 0 ? '−' : '');
      const timeSign = timeDiff > 0 ? '+' : (timeDiff < 0 ? '−' : '');
      const distCls  = distDiff > 0 ? 'cost' : (distDiff < 0 ? 'savings' : 'zero');
      const timeCls  = timeDiff > 0 ? 'cost' : (timeDiff < 0 ? 'savings' : 'zero');
      if (dd) {
        dd.textContent = `${distSign}${Math.abs(distDiff).toFixed(1)} ${t('unit.km')}`;
        dd.className = `sp-cmp-dist ${distCls}`;
      }
      if (dt) {
        dt.textContent = `${timeSign}${Math.round(Math.abs(timeDiff))} ${t('bar.time.label2')}`;
        dt.className = `sp-cmp-time ${timeCls}`;
      }
    }
  }

  // Show only the selected direction's lines + signs, or both
  function setDirectionFilter(activeKey /* 'northbound' | 'southbound' | 'eastbound' | 'westbound' | 'both' */) {
    activeDirFilter = activeKey;  // record so async route callbacks can honor it
    inspectLayers.forEach(layer => {
      if (!layer._dirKey) return;
      const visible = activeKey === 'both' || layer._dirKey === activeKey;
      if (layer.setOpacity) {
        layer.setOpacity(visible ? 1 : 0);
      } else if (layer.setStyle) {
        // Highway line is rendered in green; bypass in blue. We dim the
        // highway slightly more so the bypass reads as the primary route
        // when both are visible.
        const isHighway = layer.options.color === '#2e7a4a';
        layer.setStyle({ opacity: visible ? (isHighway ? 0.7 : 0.9) : 0 });
      }
    });
    // Highlight active filter pill
    document.querySelectorAll('.sp-dir-filter .sp-filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.dirFilter === activeKey);
    });
    // Highlight active sp-dir block, dim inactive
    document.querySelectorAll('.sp-dir').forEach(el => {
      const k = el.dataset.dirKey;
      el.classList.toggle('active', activeKey === 'both' || k === activeKey);
      el.classList.toggle('dimmed', activeKey !== 'both' && k !== activeKey);
    });
  }

  // Build side panel HTML
  let bypassHTML = '';
  if (!bd) {
    bypassHTML = `<div class="sp-no-bypass">${t('sp.no.bypass')}</div>`;
  } else {
    const dirKeys = Object.keys(bd);
    const defaultDir = dirKeys[0]; // first direction is initially active

    // Build direction filter pills if there are 2+ directions
    let filterPillsHTML = '';
    if (dirKeys.length > 1) {
      filterPillsHTML = `<div class="sp-dir-filter">`;
      dirKeys.forEach(k => {
        const dirLabel = translateDirectionLabel(bd[k].label);
        // Shorten label: take first word (e.g. "Northbound" → "Northbound", "Βόρεια" → "Βόρεια")
        const short = dirLabel.split(/\s|\(/)[0];
        const isActive = k === defaultDir;
        filterPillsHTML += `<button class="sp-filter-btn${isActive ? ' active' : ''}" data-dir-filter="${k}">${short}</button>`;
      });
      filterPillsHTML += `</div>`;
    }

    // Active direction headline (prominent, above the per-dir blocks)
    bypassHTML = filterPillsHTML;
    Object.entries(bd).forEach(([key, dir]) => {
      const isActive = key === defaultDir;
      // Confidence indicator — only render if we have a confidence tag
      // (older data without the field stays silent)
      let confHTML = '';
      if (dir.confidence === 'approximate') {
        confHTML = `<div class="sp-confidence sp-conf-approximate" title="${t('sp.confidence.tooltip.approximate')}">${t('sp.confidence.approximate')}</div>`;
      } else if (dir.confidence === 'auto') {
        confHTML = `<div class="sp-confidence sp-conf-auto" title="${t('sp.confidence.tooltip.auto')}">${t('sp.confidence.auto')}</div>`;
      }
      // 'verified' deliberately renders nothing — clean state, no clutter.
      // Side-toll callout: when this bypass has billable side tolls,
      // list them so the user knows the bypass isn't fully free.
      // When it IS fully free, render a positive confirmation.
      // Uses the same bypassSideTollCost helper that calculator.js uses
      // for the price math, so the displayed list matches what's billed.
      //
      // Ferry mode (e.g. Rio-Antirrio): render a different block entirely
      // — schedule + fare info, since "side tolls" doesn't apply at sea.
      let sideTollsHTML = '';
      if (dir.mode === 'ferry' && dir.fare) {
        const lang = getCurrentLang();
        const key  = window.getVehicleCat();
        const meta = window.getVehicleMeta();
        const fare = dir.fare[key];
        const fareRows = (fare == null) ? '' : `<li class="sp-ferry-fare-item">
            <span class="sp-ferry-fare-veh"><span class="sp-ferry-fare-emoji">${meta.emoji}</span>${t(meta.labelKey)}</span>
            <span class="sp-ferry-fare-val">€${fare.toFixed(2)}</span>
          </li>`;
        const freq = dir.frequency_min;
        const cross = dir.crossing_min;
        sideTollsHTML = `<div class="sp-bypass-sidetolls sp-bypass-ferry">
          <div class="sp-bypass-ferry-title">${t('sp.bypass.ferry.title')}</div>
          <div class="sp-bypass-ferry-schedule">
            <span class="sp-bypass-ferry-stat">${t('sp.bypass.ferry.frequency', { n: freq })}</span>
            <span class="sp-bypass-ferry-stat">${t('sp.bypass.ferry.crossing', { n: cross })}</span>
          </div>
          <div class="sp-bypass-ferry-fare-label">${t('sp.bypass.ferry.fare')}</div>
          <ul class="sp-ferry-fare-list">${fareRows}</ul>
        </div>`;
      } else if (typeof window.bypassSideTollCost === 'function') {
        const sideInfo = window.bypassSideTollCost(toll, key, dir);
        if (sideInfo.items.length > 0) {
          const lang = getCurrentLang();
          const titleKey = sideInfo.items.length === 1
            ? 'sp.bypass.sidetolls.title.one'
            : 'sp.bypass.sidetolls.title.many';
          const items = sideInfo.items.map(({ toll: s, role }) => {
            // Side-toll names are e.g. "Πλευρικά Καπανδρίτι — Βόρεια είσοδος"
            // or "Kapandriti side — N entry". Strip the "Πλευρικά"/"side" prefix
            // and the direction suffix — both are redundant here (the heading
            // already says "side toll" and we render the role separately).
            const rawName = lang === 'el' ? s.name_gr : s.name_en;
            const name = cleanSideTollName(rawName, lang);
            const roleLabel = t('sp.bypass.sidetolls.role.' + role);
            return `<li class="sp-bypass-sidetoll-item">
              <span class="sp-bypass-sidetoll-dot"></span>
              <span class="sp-bypass-sidetoll-name">${name}</span>
              <span class="sp-bypass-sidetoll-role">(${roleLabel})</span>
            </li>`;
          }).join('');
          sideTollsHTML = `<div class="sp-bypass-sidetolls sp-bypass-sidetolls-some">
            <div class="sp-bypass-sidetolls-title">${t(titleKey, { n: sideInfo.items.length })}</div>
            <ul class="sp-bypass-sidetolls-list">${items}</ul>
          </div>`;
        } else {
          sideTollsHTML = `<div class="sp-bypass-sidetolls sp-bypass-sidetolls-free">
            ${t('sp.bypass.sidetolls.free')}
          </div>`;
        }
      }

      bypassHTML += `
        <div class="sp-dir${isActive ? ' active' : ''}" data-dir-key="${key}">
          <div class="sp-dir-label">${translateDirectionLabel(dir.label)}</div>
          <div class="sp-dir-exits">
            ${dir.exit_name ? `
            <span class="sp-exit-tag">
              <svg class="sp-tag-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <line x1="17" y1="7" x2="7" y2="17"/>
                <polyline points="16 17 7 17 7 8"/>
              </svg>
              <span class="sp-tag-text">${t('sp.exit.tag')}${dir.exit_name}</span>
            </span>` : ''}
            ${dir.entry_name ? `
            <span class="sp-entry-tag">
              <svg class="sp-tag-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <line x1="7" y1="17" x2="17" y2="7"/>
                <polyline points="8 7 17 7 17 16"/>
              </svg>
              <span class="sp-tag-text">${t('sp.entry.tag')}${dir.entry_name}</span>
            </span>` : ''}
          </div>
          ${confHTML}
          ${sideTollsHTML}
          <div class="sp-dir-compare" data-stats="${key}">
            <div class="sp-cmp-row sp-cmp-bypass">
              <span class="sp-cmp-dot" style="background:#2a6b9e"></span>
              <span class="sp-cmp-label">${t('compare.bypass')}</span>
              <span class="sp-cmp-vals" data-bypass-vals>
                <span class="sp-cmp-money" data-bypass-money>${t('compare.loading')}</span>
                <span class="sp-cmp-dist" data-bypass-dist>—</span>
                <span class="sp-cmp-time" data-bypass-time>—</span>
              </span>
            </div>
            <div class="sp-cmp-row sp-cmp-highway">
              <span class="sp-cmp-dot" style="background:#2e7a4a"></span>
              <span class="sp-cmp-label">${t('compare.highway')}</span>
              <span class="sp-cmp-vals" data-highway-vals>
                <span class="sp-cmp-money" data-highway-money>${t('compare.loading')}</span>
                <span class="sp-cmp-dist" data-highway-dist>—</span>
                <span class="sp-cmp-time" data-highway-time>—</span>
              </span>
            </div>
            <div class="sp-cmp-row sp-cmp-diff" data-diff-row>
              <span class="sp-cmp-label sp-cmp-diff-label">${t('compare.diff')}</span>
              <span class="sp-cmp-vals">
                <span class="sp-cmp-money" data-diff-money>—</span>
                <span class="sp-cmp-dist" data-diff-dist>—</span>
                <span class="sp-cmp-time" data-diff-time>—</span>
              </span>
            </div>
          </div>
        </div>`;
    });
  }

  // Name: show Greek first in Greek mode, English first in English mode
  // Strip "Διόδια" / "Toll of" prefix — the panel header already says "Toll Information".
  const primaryName   = stripTollPrefix(getCurrentLang() === 'el' ? toll.name_gr : toll.name_en);
  const secondaryName = stripTollPrefix(getCurrentLang() === 'el' ? toll.name_en : toll.name_gr);

  // Notes show on either language. notes_gr is the Greek copy when
  // present; falls back to the English `notes` field otherwise. This
  // keeps backward compatibility — tolls without notes_gr still show
  // their English note in EN mode (and nothing in EL mode) as before.
  const noteText = (getCurrentLang() === 'el' && toll.notes_gr)
    ? toll.notes_gr
    : (getCurrentLang() === 'en' ? toll.notes : null);
  const notesHTML = noteText
    ? `<div class="sp-notes">${noteText}</div>`
    : '';

  document.getElementById('sp-content').innerHTML = `
    <div class="sp-header-inner">
      <div class="sp-hwy-badge" style="--hwy-color:${color}">${t('hwy.' + toll.highway)}</div>
      <div class="sp-name">${primaryName}</div>
      <div class="sp-name-gr">${secondaryName}</div>
      <div class="sp-price-row"><span><span class="sp-emoji">${window.getVehicleMeta().emoji}</span><span class="sp-vlabel">${t(window.getVehicleMeta().labelKey)}</span></span><strong>€${window.getTollPrice(toll, window.getVehicleCat()).toFixed(2)}</strong></div>
    </div>
    ${
      // Hide Direction section when it's redundant — frontal toll charges both directions
      // equally so saying "Both directions" adds nothing.
      (toll.type === 'frontal' && /both directions/i.test(toll.direction_label || ''))
        ? ''
        : `<div class="sp-section-title">${t('sp.direction')}</div>
           <div class="sp-direction">${translateDirectionLabel(toll.direction_label)}</div>`
    }
    ${notesHTML}
    <div class="sp-section-title">${t('sp.bypass')}</div>
    ${bypassHTML}
  `;

  document.getElementById('toll-side-panel').classList.add('open');

  // Wire up direction filter pills
  document.querySelectorAll('.sp-dir-filter .sp-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => setDirectionFilter(btn.dataset.dirFilter));
  });

  // Make the entire direction block clickable too — not just the filter pill —
  // so the user has a larger hit target. Clicking "anywhere" on the
  // Northbound block selects northbound, etc.
  document.querySelectorAll('.sp-dir[data-dir-key]').forEach(block => {
    block.addEventListener('click', e => {
      // Don't trigger when clicking interactive children (buttons, links)
      if (e.target.closest('button, a, input, textarea, select')) return;
      const key = block.dataset.dirKey;
      if (key) setDirectionFilter(key);
    });
  });

  // Apply default direction filter on first open (show first direction only).
  // We call setDirectionFilter synchronously: the layer objects were pushed
  // into inspectLayers in the loop above, before this point. Deferring the
  // call (as we used to with setTimeout) caused the browser to paint both
  // directions briefly before the inactive one was hidden, which looked like
  // "both directions are highlighted; clicking again filters."
  if (bd) {
    const dirKeys = Object.keys(bd);
    if (dirKeys.length > 1) {
      setDirectionFilter(dirKeys[0]);
    }
  }
}

// ── Toll markers ──────────────────────────────────────────
const markersByHighway = {};
const allMarkers       = [];

// Side tolls (type === "side") get yellow markers and are visible by default.
// Toggleable via the legend "Πλευρικά διόδια / Side tolls" button.
const SIDE_TOLL_COLOR = '#f4c430';  // light yellow
let sideTollsVisible = true;
const sideMarkers    = [];  // { toll, marker } for side tolls only

// Zoom threshold above which frontal tolls render as perpendicular pills.
// Below this, they render as small dots (matches the visual hierarchy of
// other zoom-aware features: ramps appear at zoom 10, names at 9, pills at 11).
// At Greece-wide overview the pills would clutter; at street level they
// convey "this is a barrier across the road."
const ZOOM_THRESHOLD_FRONTAL_PILL = 11;

// Build the divIcon for a toll marker. Frontals AND bridges get a pill
// shape oriented perpendicular to the road/bridge.
//
// Bearing source priority (highest wins):
//   1. `bearing_route`   — computed from the actual Mapbox highway route
//                          geometry once the user has clicked this toll.
//                          Most accurate; samples coords ~100m on either
//                          side of the toll's projection onto the route.
//   2. `bearing_manual`  — explicit user override (rarely needed once
//                          bearing_route exists, but kept for cases where
//                          the route happens to curve through the toll
//                          location.
//   3. `bearing`         — auto-computed at build time from the bypass
//                          corridor endpoints. Coarse, used as default
//                          before the user clicks.
//
// At low zoom (< ZOOM_THRESHOLD_FRONTAL_PILL) frontals/bridges revert
// to the same small circle as side tolls so the overview isn't crowded.
// Compute a default bearing from any bypass direction's
// pre_exit → post_merge segment. Those two anchors sit on the
// motorway, on either side of the toll, so the segment between them
// approximates the local highway direction. Far better than hand-typed
// static `bearing` values that have drifted out of sync with the data.
//
// Returns null if the toll has no usable corridor (e.g. bypass_directions
// is null/missing, or all directions are ferry-mode).
function _computeCorridorBearing(toll) {
  const dirs = toll && toll.bypass_directions;
  if (!dirs) return null;
  for (const dir of Object.values(dirs)) {
    if (!dir || dir.mode === 'ferry') continue;
    const a = dir.pre_exit;
    const b = dir.post_merge;
    if (!a || !b || typeof a.lat !== 'number' || typeof b.lat !== 'number') continue;
    return bearingDeg(a, b);
  }
  return null;
}

function makeTollMarkerIcon(toll, isActive) {
  const isSide   = toll.type === 'side';
  const isPillEligible = toll.type === 'frontal' || toll.type === 'bridge';
  const color   = isSide
    ? SIDE_TOLL_COLOR
    : (isActive ? '#1f5828' : (HIGHWAY_COLORS[toll.highway] || '#888'));

  // Pills only appear when the user has zoomed in far enough to see road
  // geometry. At lower zooms, fall through to the dot rendering.
  const showAsPill = isPillEligible && map.getZoom() >= ZOOM_THRESHOLD_FRONTAL_PILL;

  if (showAsPill) {
    const longSide  = isActive ? 30 : 26;
    const shortSide = isActive ? 12 : 10;
    // Bearing source priority:
    //   1. bearing_route   — refined from real Mapbox highway geometry
    //                        once the toll has been opened (most accurate)
    //   2. bearing_manual  — explicit user override
    //   3. corridor-derived — computed from any direction's
    //                        pre_exit → post_merge segment. Available for
    //                        every toll with bypass_directions, no click
    //                        required, no cache hydration required.
    //   4. static bearing  — fallback only; many static values in data
    //                        have drifted out of sync with the actual
    //                        highway geometry, so this is the last resort.
    const corridorBearing = _computeCorridorBearing(toll);
    const rawBearing = (typeof toll.bearing_route === 'number')
      ? toll.bearing_route
      : (typeof toll.bearing_manual === 'number')
      ? toll.bearing_manual
      : (corridorBearing != null)
      ? corridorBearing
      : (typeof toll.bearing === 'number' ? toll.bearing : 0);
    const rot = ((rawBearing % 180) + 180) % 180;
    const cw = longSide + 4;
    return L.divIcon({
      className: '',
      html: `<div class="toll-marker toll-marker-frontal${isActive ? ' active' : ''}" style="background:${color};width:${longSide}px;height:${shortSide}px;left:50%;top:50%;transform:translate(-50%,-50%) rotate(${rot}deg)"></div>`,
      iconSize:   [cw, cw],
      iconAnchor: [cw / 2, cw / 2],
    });
  }

  // Side, low-zoom frontal/bridge: 11/14 px circle.
  // Side tolls specifically render even smaller (6px) at low zoom — there
  // are 87 of them on the map and at country-level zoom they create
  // visual clutter. They grow to the regular 11px size at the same
  // zoom threshold where frontals turn into pills, so as the user
  // zooms in to plan a specific section all markers gain detail
  // together.
  let size;
  if (isSide && !isActive && map.getZoom() < ZOOM_THRESHOLD_FRONTAL_PILL) {
    size = 6;
  } else {
    size = isActive ? 14 : 11;
  }
  const sideSmallClass = (isSide && size === 6) ? ' toll-marker-side-small' : '';
  return L.divIcon({
    className: '',
    html: `<div class="toll-marker${isActive ? ' active' : ''}${isSide ? ' toll-marker-side' : ''}${sideSmallClass}" style="background:${color}"></div>`,
    iconSize:   [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// ── Compute pill bearing from actual route geometry ─────────────────
//
// When the user clicks a toll, the highway route polyline is fetched
// from Mapbox. That polyline IS the ground truth for the road's local
// shape at the toll. We use it to refine the toll's pill orientation:
// find the polyline coord closest to the toll's lat/lng, walk ~100m
// in each direction, and take the bearing of the resulting segment.
// This produces a perfectly-perpendicular pill regardless of how
// curving the road is between the bypass corridor endpoints.
//
// The result is cached on the toll object as `bearing_route` and
// reused on subsequent panel opens / re-renders.

function _haversineMeters(p1, p2) {
  const R = 6_371_000;
  const toRad = d => d * Math.PI / 180;
  const lat1 = toRad(p1[0]), lat2 = toRad(p2[0]);
  const dlat = lat2 - lat1, dlon = toRad(p2[1] - p1[1]);
  const a = Math.sin(dlat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function _bearingDeg(p1, p2) {
  const toRad = d => d * Math.PI / 180;
  const lat1 = toRad(p1[0]), lat2 = toRad(p2[0]);
  const dlon = toRad(p2[1] - p1[1]);
  const x = Math.sin(dlon) * Math.cos(lat2);
  const y = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dlon);
  return (Math.atan2(x, y) * 180 / Math.PI + 360) % 360;
}

// Refine the toll's bearing using the highway route polyline. `coords` is
// an array of [lat, lng] pairs (Mapbox returns lng,lat — the caller flips).
// On success, sets toll.bearing_route and calls setIcon to update the marker.
function refineTollBearingFromRoute(toll, coords) {
  if (!Array.isArray(coords) || coords.length < 3) return;
  if (toll.type !== 'frontal' && toll.type !== 'bridge') return;
  // Don't override an explicit user value.
  if (typeof toll.bearing_manual === 'number') return;

  const tollPt = [toll.lat, toll.lng];
  // 1. Find the route coord closest to the toll.
  let nearestIdx = -1, nearestDist = Infinity;
  for (let i = 0; i < coords.length; i++) {
    const d = _haversineMeters(tollPt, coords[i]);
    if (d < nearestDist) { nearestDist = d; nearestIdx = i; }
  }
  // If the nearest coord is more than 800m away, this route doesn't pass
  // through the toll (e.g. a different direction's route). Skip.
  if (nearestDist > 800) return;

  // 2. Walk the polyline backward and forward from nearestIdx until the
  //    cumulative distance reaches ~100m. Use those two points to compute
  //    the local bearing.
  const TARGET_OFFSET_M = 100;

  function findOffset(start, dir) {
    let cum = 0;
    let prev = coords[start];
    let i = start + dir;
    while (i >= 0 && i < coords.length) {
      cum += _haversineMeters(prev, coords[i]);
      if (cum >= TARGET_OFFSET_M) return i;
      prev = coords[i];
      i += dir;
    }
    // Hit the end of the polyline before reaching target — return endpoint.
    const last = i - dir;
    return (last !== start && last >= 0 && last < coords.length) ? last : null;
  }

  const beforeIdx = findOffset(nearestIdx, -1);
  const afterIdx  = findOffset(nearestIdx, +1);
  if (beforeIdx == null || afterIdx == null || beforeIdx === afterIdx) return;

  const b = _bearingDeg(coords[beforeIdx], coords[afterIdx]);
  toll.bearing_route = Math.round(((b % 180) + 180) % 180);

  // Update the marker icon if it's currently rendered as a pill.
  const entry = allMarkers.find(m => m.toll === toll);
  if (entry && map.getZoom() >= ZOOM_THRESHOLD_FRONTAL_PILL) {
    const isActive = currentTollOpen && currentTollOpen.id === toll.id;
    entry.marker.setIcon(makeTollMarkerIcon(toll, isActive));
  }
}
window.refineTollBearingFromRoute = refineTollBearingFromRoute;

// Hydrate bearing_route from any cached highway routes in localStorage.
// On a fresh page load we re-derive the bearings of tolls the user has
// previously clicked, so their pills are correctly oriented from the
// start instead of waiting for another click. Skipped silently if the
// browser blocks localStorage. Cheap — at most one parse per toll.
function _hydrateBearingsFromCache() {
  if (typeof TOLL_DATA === 'undefined') return;
  for (const toll of TOLL_DATA) {
    if (toll.type !== 'frontal' && toll.type !== 'bridge') continue;
    if (typeof toll.bearing_route === 'number') continue;       // already set
    if (typeof toll.bearing_manual === 'number') continue;       // explicit override wins
    const dirs = toll.bypass_directions;
    if (!dirs) continue;
    // Try each direction's highway route in turn.
    for (const dir of Object.values(dirs)) {
      if (!dir?.pre_exit || !dir?.post_merge || dir.mode === 'ferry') continue;
      const key = `highway:${dir.pre_exit.lat.toFixed(5)},${dir.pre_exit.lng.toFixed(5)};${dir.post_merge.lat.toFixed(5)},${dir.post_merge.lng.toFixed(5)}`;
      try {
        const stored = localStorage.getItem(`diodio.route.v5.${key}`);
        if (!stored) continue;
        const parsed = JSON.parse(stored);
        if (parsed?.coords?.length > 2) {
          refineTollBearingFromRoute(toll, parsed.coords);
          break;
        }
      } catch (e) { /* ignore */ }
    }
  }
}
// Defer slightly so TOLL_DATA + map are ready, and non-blocking.
setTimeout(_hydrateBearingsFromCache, 50);

TOLL_DATA.forEach(toll => {
  const isSide = toll.type === 'side';
  const icon   = makeTollMarkerIcon(toll, false);

  const marker = L.marker([toll.lat, toll.lng], { icon, zIndexOffset: 100 });

  marker.on('mouseover', function(e) {
    _hoveredToll = toll;
    tooltipEl.innerHTML = buildHoverTooltip(toll);
    tooltipEl.style.display = 'block';
    positionTooltip(e.originalEvent);
  });
  marker.on('mousemove', function(e) { positionTooltip(e.originalEvent); });
  marker.on('mouseout',  function()  { _hoveredToll = null; tooltipEl.style.display = 'none'; });
  marker.on('click', function(e) {
    L.DomEvent.stopPropagation(e);
    tooltipEl.style.display = 'none';
    openSidePanel(toll);
  });

  // Side tolls hidden by default; only add to map if not side or toggle is on.
  if (!isSide || sideTollsVisible) {
    marker.addTo(map);
  }
  allMarkers.push({ toll, marker });
  if (isSide) {
    sideMarkers.push({ toll, marker });
  }
  if (!markersByHighway[toll.highway]) markersByHighway[toll.highway] = [];
  markersByHighway[toll.highway].push(marker);
});

// ── Ferry pier markers ───────────────────────────────────
// Tolls that have a ferry-mode bypass (currently just rioantirrio) get
// synthetic yellow markers at each pier so the global "Πλευρικά διόδια"
// toggle reveals them alongside regular side tolls — they're billable
// stops on a bypass, same conceptual category, even though they're not
// in TOLL_DATA as type:"side" records.
//
// They're also registered under the parent bridge's highway key
// (markersByHighway["BRIDGE"]) so when the user clicks "Γέφυρες & Σήραγγες"
// in the legend, the piers stay highlighted along with the bridge they
// belong to (instead of dimming with everything else).
//
// Click → opens the parent toll's side panel so the user gets to the
// ferry schedule + fare info.
//
// We dedupe by lat/lng key because northbound and southbound bypasses
// reference the same two piers (just swapped). One marker per pier.
TOLL_DATA.forEach(parentToll => {
  if (!parentToll.bypass_directions) return;
  const seen = new Set();
  Object.entries(parentToll.bypass_directions).forEach(([dirKey, dir]) => {
    if (dir.mode !== 'ferry' || !dir.fare) return;
    [['off_ramp', dir.exit_name],
     ['on_ramp',  dir.entry_name]].forEach(([rampField, pierName]) => {
      const ramp = dir[rampField];
      if (!ramp) return;
      const key = `${ramp.lat.toFixed(5)},${ramp.lng.toFixed(5)}`;
      if (seen.has(key)) return;
      seen.add(key);
      const icon = L.divIcon({
        className: '',
        html: `<div class="toll-marker toll-marker-side toll-marker-ferry-pier" style="background:${SIDE_TOLL_COLOR}"></div>`,
        iconSize: [11, 11], iconAnchor: [5.5, 5.5],
      });
      const marker = L.marker([ramp.lat, ramp.lng], { icon, zIndexOffset: 100 });
      // Tooltip: pier name + ferry fare for car (sensible default) + frequency.
      // Mirrors what the bridge panel shows in detail. Function-form content
      // re-resolves on each hover so it tracks the current language.
      marker.bindTooltip(() => {
        const carFare = dir.fare.cat2;
        const freq    = dir.frequency_min;
        return `<strong>${pierName}</strong><br>` +
               `<small>${t('sp.bypass.ferry.title')} · 🚗 €${carFare.toFixed(2)} · ${t('sp.bypass.ferry.frequency', { n: freq })}</small>`;
      }, { className: 'ramp-tooltip', sticky: true });
      // Click → open the parent toll's panel (the bridge), where users get
      // the full ferry block: schedule, full fare table, verdict math.
      marker.on('click', function(e) {
        L.DomEvent.stopPropagation(e);
        openSidePanel(parentToll);
      });
      // Add to map only if toggle is on — same default as regular side tolls
      if (sideTollsVisible) marker.addTo(map);
      // Synthetic toll record so allMarkers behavior (dim/restore) works.
      const synthToll = {
        id:        `${parentToll.id}_ferry_pier_${key}`,
        type:      'side',
        lat:       ramp.lat,
        lng:       ramp.lng,
        name_gr:   pierName,
        name_en:   pierName,
      };
      allMarkers.push({ toll: synthToll, marker });
      sideMarkers.push({ toll: synthToll, marker });
      // Also register under the parent bridge's highway key so the per-highway
      // legend filter dims/highlights piers in sync with the bridge they belong to.
      // Without this, clicking "Bridges & Tunnels" would leave piers at full opacity
      // while everything else dims (or vice-versa).
      if (!markersByHighway[parentToll.highway]) markersByHighway[parentToll.highway] = [];
      markersByHighway[parentToll.highway].push(marker);
    });
  });
});

map.on('click', () => {
  if (sidePanelOpen && Date.now() - sidePanelOpenedAt > 800) closeSidePanel();
});
document.getElementById('sp-close').addEventListener('click', closeSidePanel);

// Swipe-down to close on mobile (touch only)
(function() {
  const panel = document.getElementById('toll-side-panel');
  if (!panel) return;
  let startY = null;
  let startT = 0;
  let dragging = false;

  panel.addEventListener('touchstart', (e) => {
    if (window.innerWidth > 640) return; // only on mobile
    if (!panel.classList.contains('open')) return;
    // Only start a drag if the touch is on the header area (not on scrollable content
    // unless that content is scrolled to top)
    const scroll = panel.querySelector('.sp-scroll');
    if (scroll && scroll.scrollTop > 0) return;
    startY = e.touches[0].clientY;
    startT = Date.now();
    dragging = true;
    panel.style.transition = 'none';
  }, { passive: true });

  panel.addEventListener('touchmove', (e) => {
    if (!dragging) return;
    const dy = e.touches[0].clientY - startY;
    if (dy < 0) return; // only allow downward drag
    panel.style.transform = `translateY(${dy}px)`;
  }, { passive: true });

  panel.addEventListener('touchend', (e) => {
    if (!dragging) return;
    dragging = false;
    panel.style.transition = '';
    const dy = (e.changedTouches[0].clientY - startY) || 0;
    const dt = Date.now() - startT;
    const fastSwipe = dy > 60 && dt < 300;
    const longSwipe = dy > 120;
    if (fastSwipe || longSwipe) {
      panel.style.transform = '';
      closeSidePanel();
    } else {
      panel.style.transform = '';
    }
  });
})();

// ── Ramp markers layer (off by default) ──────────────────
// Each entry: { tollId, exitM, entryM, connLine }
const rampMarkers  = [];
let   rampsVisible = false;

function buildRampMarkers() {
  TOLL_DATA.forEach(toll => {
    const bd = toll.bypass_directions;
    if (!bd) return;

    Object.entries(bd).forEach(([dirKey, dir]) => {
      let exitM = null, entryM = null, connLine = null;

      if (dir.off_ramp) {
        exitM = L.marker([dir.off_ramp.lat, dir.off_ramp.lng], {
          icon: makeExitIcon(dir.exit_name), zIndexOffset: 50, opacity: 0,
        });
        exitM._placeName = dir.exit_name;
        exitM._kind = 'exit';
        exitM.bindTooltip(
          `<strong>${t('ramp.exit.label')}:</strong> ${dir.exit_name}<br><small>${t('ramp.avoid', {toll: toll.name_en})}</small>`,
          { className: 'ramp-tooltip' }
        );
      }

      if (dir.on_ramp) {
        entryM = L.marker([dir.on_ramp.lat, dir.on_ramp.lng], {
          icon: makeEntryIcon(dir.entry_name), zIndexOffset: 50, opacity: 0,
        });
        entryM._placeName = dir.entry_name;
        entryM._kind = 'entry';
        entryM.bindTooltip(
          `<strong>${t('ramp.entry.label')}:</strong> ${dir.entry_name}<br><small>${t('ramp.avoid', {toll: toll.name_en})}</small>`,
          { className: 'ramp-tooltip' }
        );
      }

      // Dashed connection line: off_ramp → toll → on_ramp
      if (dir.off_ramp && dir.on_ramp) {
        connLine = L.polyline(
          [[dir.off_ramp.lat, dir.off_ramp.lng],[toll.lat, toll.lng],[dir.on_ramp.lat, dir.on_ramp.lng]],
          { color: '#c4613d', weight: 1.5, opacity: 0, dashArray: '5 4', lineCap: 'round' }
        );
        connLine.bindTooltip(
          `${dir.exit_name} → ${toll.name_en} → ${dir.entry_name}`,
          { sticky: true, className: 'bypass-tooltip' }
        );
      }

      rampMarkers.push({ tollId: toll.id, toll, exitM, entryM, connLine });
    });
  });
}

buildRampMarkers();

// ── Zoom thresholds for clarity at low zoom levels ────────
const ZOOM_THRESHOLD_RAMPS     = 10; // show EX/EN signs + connectors only at zoom >= 10
const ZOOM_THRESHOLD_TOLLNAMES = 9;  // show toll-name labels at zoom >= 9

function updateRampsVisibility() {
  if (!rampsVisible) return;
  const zoomedIn = map.getZoom() >= ZOOM_THRESHOLD_RAMPS;
  rampMarkers.forEach(({ exitM, entryM, connLine }) => {
    if (zoomedIn) {
      if (exitM    && !map.hasLayer(exitM))    { exitM.addTo(map);    exitM.setOpacity(1); }
      if (entryM   && !map.hasLayer(entryM))   { entryM.addTo(map);   entryM.setOpacity(1); }
      if (connLine && !map.hasLayer(connLine)) { connLine.addTo(map); connLine.setStyle({ opacity: 0.5 }); }
    } else {
      if (exitM    && map.hasLayer(exitM))    map.removeLayer(exitM);
      if (entryM   && map.hasLayer(entryM))   map.removeLayer(entryM);
      if (connLine && map.hasLayer(connLine)) map.removeLayer(connLine);
    }
  });
}

function updateTollNamesVisibility() {
  const zoomedIn = map.getZoom() >= ZOOM_THRESHOLD_TOLLNAMES;
  tollNameMarkers.forEach(({ marker, toll }) => {
    // Side tolls never get name labels — the booths cluster too tight at any zoom
    // (155-365m apart at the same interchange). Hover tooltip and side panel
    // already convey the name, so labels would only clutter the map.
    const isSide = toll.type === 'side';
    const allowed = !isSide && zoomedIn;
    if (allowed) {
      if (!map.hasLayer(marker)) marker.addTo(map);
    } else {
      if (map.hasLayer(marker))  map.removeLayer(marker);
    }
  });
}

map.on('zoomend', () => {
  updateRampsVisibility();
  updateTollNamesVisibility();
  // Re-render markers — at the zoom threshold frontals swap dot↔pill,
  // and side tolls swap small (6px) ↔ regular (11px). Bridges follow
  // frontals. We track each marker's last-rendered shape so we don't
  // burn cycles re-rendering when nothing changed.
  if (typeof allMarkers !== 'undefined') {
    const z = map.getZoom();
    const aboveThreshold = z >= ZOOM_THRESHOLD_FRONTAL_PILL;
    allMarkers.forEach(({ toll, marker }) => {
      const isActive = currentTollOpen && currentTollOpen.id === toll.id;
      let wantShape;
      if (toll.type === 'frontal' || toll.type === 'bridge') {
        wantShape = aboveThreshold ? 'pill' : 'dot';
      } else if (toll.type === 'side') {
        wantShape = aboveThreshold ? 'side-regular' : 'side-small';
      } else {
        return;
      }
      if (marker._lastFrontalShape === wantShape
          && marker._lastFrontalActive === !!isActive) return;
      marker.setIcon(makeTollMarkerIcon(toll, isActive));
      marker._lastFrontalShape  = wantShape;
      marker._lastFrontalActive = !!isActive;
    });
  }
});

document.getElementById('legend-ramps-btn').addEventListener('click', function() {
  rampsVisible = !rampsVisible;
  this.classList.toggle('active', rampsVisible);
  const stateEl = this.querySelector('.legend-ramps-state');
  if (stateEl) {
    stateEl.setAttribute('data-i18n', rampsVisible ? 'legend.ramps.on' : 'legend.ramps.off');
    stateEl.textContent = t(rampsVisible ? 'legend.ramps.on' : 'legend.ramps.off');
  }
  if (rampsVisible) {
    updateRampsVisibility();
  } else {
    rampMarkers.forEach(({ exitM, entryM, connLine }) => {
      if (exitM)    map.removeLayer(exitM);
      if (entryM)   map.removeLayer(entryM);
      if (connLine) map.removeLayer(connLine);
    });
  }
});

// ── Side tolls toggle (now in the top-right map controls stack) ────────
// Side tolls (type === "side") are visible by default. The user toggles
// them via the side-tolls icon button in #map-controls. Markers are
// yellow; they cluster tightly around interchanges so hiding them
// reduces visual noise when planning long-distance routes.
const mcSideBtn = document.getElementById('mc-side-btn');
if (mcSideBtn) {
  mcSideBtn.addEventListener('click', function() {
    sideTollsVisible = !sideTollsVisible;
    this.setAttribute('aria-pressed', sideTollsVisible ? 'true' : 'false');
    sideMarkers.forEach(({ marker }) => {
      if (sideTollsVisible) {
        marker.addTo(map);
      } else {
        map.removeLayer(marker);
      }
    });
  });
}

// ── Bottom-bar height tracker ─────────────────────────────
// On mobile the bottom bar wraps from 1 row (~72px) to 2-3 rows (140-220px+)
// depending on viewport, language wrap, and content. CSS can't measure this,
// so we observe the bar's rendered height and write it to --bar-actual-h on
// :root. The floating pill anchor (.map-floating-toggle bottom) and the
// mobile map-container/results-panel offsets read this variable, falling
// back to --bar-h (72px) before JS runs.
(function trackBottomBarHeight() {
  const bar  = document.getElementById('bottom-bar');
  const root = document.documentElement;
  if (!bar) return;
  const update = () => {
    const h = Math.round(bar.getBoundingClientRect().height);
    if (h > 0) root.style.setProperty('--bar-actual-h', h + 'px');
  };
  update();
  // ResizeObserver covers content reflow (language change, slider tier label
  // length change, viewport resize affecting wrap). One observer is enough.
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(update).observe(bar);
  } else {
    // Fallback for ancient browsers — recompute on common reflow triggers.
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    window.addEventListener('langchange', update);
  }
})();

// ── Toll names layer (labels above each toll marker) — always on, zoom-aware ──
const tollNameMarkers = [];

function buildLabelHtml(toll) {
  const name = getCurrentLang() === 'el' ? toll.name_gr : toll.name_en;
  const short = stripTollPrefix(name);
  return `<div class="toll-name-label">${short}</div>`;
}

function buildTollNameMarkers() {
  TOLL_DATA.forEach(toll => {
    // Side tolls never show name labels (clusters too tight). Skip creating
    // their label markers entirely — the dot's hover tooltip handles naming.
    if (toll.type === 'side') return;

    const icon = L.divIcon({
      className: '',
      html: buildLabelHtml(toll),
      iconSize: [null, null], iconAnchor: [0, -18],
    });
    const m = L.marker([toll.lat, toll.lng], { icon, zIndexOffset: 30 });
    m.on('click', function(e) {
      L.DomEvent.stopPropagation(e);
      tooltipEl.style.display = 'none';
      openSidePanel(toll);
    });
    m.on('mouseover', function(e) {
      _hoveredToll = toll;
      tooltipEl.innerHTML = buildHoverTooltip(toll);
      tooltipEl.style.display = 'block';
      positionTooltip(e.originalEvent);
    });
    m.on('mousemove', function(e) { positionTooltip(e.originalEvent); });
    m.on('mouseout',  function()  { _hoveredToll = null; tooltipEl.style.display = 'none'; });
    tollNameMarkers.push({ marker: m, toll });
  });
}
buildTollNameMarkers();
updateTollNamesVisibility();

function updateTollNameLabels() {
  tollNameMarkers.forEach(({ marker, toll }) => {
    marker.setIcon(L.divIcon({
      className: '',
      html: buildLabelHtml(toll),
      iconSize: [null, null], iconAnchor: [0, -18],
    }));
  });
}

// Mark a toll as active (label = green pill, dot = green) — call when toll is selected
function setActiveTollLabel(activeTollId) {
  // Update labels (tollNameMarkers contains only frontals — side tolls
  // were skipped in buildTollNameMarkers).
  tollNameMarkers.forEach(({ marker, toll }) => {
    const name = getCurrentLang() === 'el' ? toll.name_gr : toll.name_en;
    const short = stripTollPrefix(name);
    const isActive = toll.id === activeTollId;
    marker.setIcon(L.divIcon({
      className: '',
      html: `<div class="toll-name-label${isActive ? ' active' : ''}">${short}</div>`,
      iconSize: [null, null], iconAnchor: [0, -18],
    }));
  });
  // Update dot markers — turn the active one green, restore others to highway color
  // (or yellow, for side tolls). Frontals retain their pill shape; only the size +
  // color change in the active state.
  allMarkers.forEach(({ toll, marker }) => {
    const isActive = toll.id === activeTollId;
    marker.setIcon(makeTollMarkerIcon(toll, isActive));
  });
}
window.setActiveTollLabel = setActiveTollLabel;

// Re-render labels when language changes
window.addEventListener('langchange', () => {
  updateTollNameLabels();
  updateTollNamesVisibility();
  // Refresh ramp marker icons + tooltips (their text is baked-in at creation time)
  rampMarkers.forEach(({ exitM, entryM, toll }) => {
    if (exitM) {
      exitM.setIcon(makeExitIcon(exitM._placeName));
      const tollName = toll ? (getCurrentLang() === 'el' ? toll.name_gr : toll.name_en) : '';
      exitM.setTooltipContent(`<strong>${t('ramp.exit.label')}:</strong> ${exitM._placeName}<br><small>${t('ramp.avoid', {toll: tollName})}</small>`);
    }
    if (entryM) {
      entryM.setIcon(makeEntryIcon(entryM._placeName));
      const tollName = toll ? (getCurrentLang() === 'el' ? toll.name_gr : toll.name_en) : '';
      entryM.setTooltipContent(`<strong>${t('ramp.entry.label')}:</strong> ${entryM._placeName}<br><small>${t('ramp.avoid', {toll: tollName})}</small>`);
    }
  });
  // If side panel is open, re-render its content with the new language.
  // Use setTimeout so applyTranslations completes its DOM walk first,
  // then we cleanly rebuild sp-content from scratch with new language strings.
  if (sidePanelOpen && currentTollOpen) {
    const tollToReopen = currentTollOpen;
    setTimeout(() => openSidePanel(tollToReopen), 10);
  }
});

// ── Legend ────────────────────────────────────────────────
// Legend panel is toggled via the #mc-legend-btn button in the top-right
// map controls stack. Starts hidden by default; the controls button's
// aria-pressed state mirrors the panel's open/closed state.
const legendBtn = document.getElementById('mc-legend-btn');
window.legendVis = false;
let   legendVis = window.legendVis;

legendEl.classList.toggle('hidden', !legendVis);

if (legendBtn) {
  legendBtn.addEventListener('click', () => {
    legendVis = !legendVis;
    window.legendVis = legendVis;
    legendEl.classList.toggle('hidden', !legendVis);
    legendBtn.setAttribute('aria-pressed', legendVis ? 'true' : 'false');
  });
}

const LEGEND_GROUPS = ['A1','A2','A5','A8','E65','A7','A6','BRIDGE'];

const highwayCounts = {};
TOLL_DATA.forEach(tollEntry => { highwayCounts[tollEntry.highway] = (highwayCounts[tollEntry.highway] || 0) + 1; });

const legendList   = document.getElementById('legend-list');
let   activeFilter = null;

function applyFilter(selectedKey) {
  const allKeys = Object.keys(markersByHighway);

  if (activeFilter === selectedKey) {
    activeFilter = null;
    allKeys.forEach(k => {
      markersByHighway[k]?.forEach(m => m.setOpacity(1));
    });
    legendList.querySelectorAll('.legend-item').forEach(el => {
      el.classList.remove('active-filter', 'dimmed-filter');
    });
  } else {
    activeFilter = selectedKey;
    allKeys.forEach(k => {
      const solo = k === selectedKey;
      markersByHighway[k]?.forEach(m => m.setOpacity(solo ? 1 : 0.07));
    });
    legendList.querySelectorAll('.legend-item').forEach(el => {
      const sel = el.dataset.hwy === selectedKey;
      el.classList.toggle('active-filter',  sel);
      el.classList.toggle('dimmed-filter', !sel);
    });
  }
}

function renderLegendList() {
  legendList.innerHTML = '';
  LEGEND_GROUPS.forEach(key => {
    const color = HIGHWAY_COLORS[key] || '#888';
    const count = highwayCounts[key] || 0;

    const item = document.createElement('div');
    item.className   = 'legend-item';
    item.dataset.hwy = key;
    item.innerHTML   = `
      <div class="legend-dot" style="background:${color}"></div>
      <div class="legend-text">
        <div class="legend-label">${t('hwy.' + key)}</div>
        <div class="legend-sub">${t('hwy.' + key + '.sub')}</div>
      </div>
      <span class="legend-count">${count}</span>`;

    // preserve active filter state
    if (activeFilter === key) item.classList.add('active-filter');
    else if (activeFilter)    item.classList.add('dimmed-filter');

    item.addEventListener('click', () => applyFilter(key));
    legendList.appendChild(item);
  });
}
renderLegendList();

// Re-render when language changes
window.addEventListener('langchange', renderLegendList);

// ── Basemap toggle ────────────────────────────────────────
// Desktop: button in #map-controls opens a popover with 3 options.
// Mobile: drawer button cycles through modes (no room for a popover
// inside the drawer). updateBasemapButtonLabels() keeps the visible
// labels in sync with the current mode and the active language.
window.updateBasemapButtonLabels = function() {
  const key = `btn.basemap.${window.basemapMode}`;  // btn.basemap.streets|satellite|hybrid
  const label = t(key);
  // Mobile drawer still has a text label.
  const mobBtn = document.getElementById('mobile-basemap-btn');
  if (mobBtn) {
    const span = mobBtn.querySelector('span[data-basemap-label]');
    if (span) span.textContent = label;
  }
};

// Mobile drawer cycles. Desktop popover selects directly.
const basemapMobBtn = document.getElementById('mobile-basemap-btn');
if (basemapMobBtn) basemapMobBtn.addEventListener('click', window.cycleBaseLayer);

// Wire the popover: trigger button + outside-click + Escape close.
(function initBasemapPopover() {
  const trigger = document.getElementById('mc-basemap-btn');
  const popover = document.getElementById('mc-basemap-popover');
  if (!trigger || !popover) return;

  function open() {
    popover.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    setTimeout(() => {
      document.addEventListener('mousedown', onOutside, true);
      document.addEventListener('keydown', onEscape, true);
    }, 0);
  }
  function close() {
    popover.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    document.removeEventListener('mousedown', onOutside, true);
    document.removeEventListener('keydown', onEscape, true);
  }
  function onOutside(ev) {
    if (!popover.contains(ev.target) && ev.target !== trigger && !trigger.contains(ev.target)) close();
  }
  function onEscape(ev) {
    if (ev.key === 'Escape') { close(); trigger.focus(); }
  }

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    if (popover.hidden) open();
    else close();
  });

  popover.querySelectorAll('.mc-popover-option').forEach(opt => {
    // Initialize active state from current basemap.
    opt.classList.toggle('active', opt.dataset.mode === window.basemapMode);
    opt.addEventListener('click', () => {
      window.setBasemap(opt.dataset.mode);
      close();
    });
  });
})();

// Initial label paint + re-paint on language change
window.updateBasemapButtonLabels();
window.addEventListener('langchange', window.updateBasemapButtonLabels);

// ── First-visit tip ────────────────────────────────────────────────
// Reveals a small "Tap any toll to see if it's worth paying or
// bypassing" card on first visit. Auto-dismisses on first toll click
// (so users who took the hint don't see it again next page load).
// Persists dismiss state in localStorage as `mydiodia.tip.bypass.v1`.
//
// Exposes `window.dismissFirstTip()` which `openSidePanel` calls directly.
// (We can't monkey-patch openSidePanel from out here — marker click
// handlers reference the lexically-scoped declaration, not the global.)
(function initFirstTip() {
  const STORAGE_KEY = 'mydiodia.tip.bypass.v1';
  const tipEl = document.getElementById('first-tip');
  if (!tipEl) {
    // No DOM element — expose a no-op so openSidePanel's call site is safe.
    window.dismissFirstTip = function() {};
    return;
  }

  // localStorage can throw in incognito / restricted contexts. Default to
  // "already dismissed" so the tip never blocks anything when storage fails.
  let dismissed = true;
  try {
    dismissed = localStorage.getItem(STORAGE_KEY) === 'dismissed';
  } catch (e) { /* ignore */ }

  function persistDismiss() {
    try { localStorage.setItem(STORAGE_KEY, 'dismissed'); }
    catch (e) { /* ignore quota / disabled */ }
  }

  function dismiss() {
    if (tipEl.hidden) return;
    persistDismiss();
    tipEl.classList.add('is-leaving');
    // Match the CSS animation duration (250ms).
    setTimeout(() => {
      tipEl.hidden = true;
      tipEl.classList.remove('is-leaving');
    }, 260);
  }
  window.dismissFirstTip = dismiss;

  if (dismissed) return;

  // Show now (the CSS keyframes handle the fade-in delay).
  tipEl.hidden = false;

  // Close-button click.
  const closeBtn = document.getElementById('first-tip-close');
  if (closeBtn) closeBtn.addEventListener('click', dismiss);
})();

// ── Re-render UI when the user changes vehicle ────────────────────────
//
// Hover tooltip pulls fresh content from buildHoverTooltip on every
// mouseover, so it auto-reflects the current vehicle without a listener.
// What we DO need to refresh:
//   - The side panel if open: re-run openSidePanel for the active toll.
//   - All-Tolls page table: it has its own re-render; let it subscribe.
window.addEventListener('vehiclechange', () => {
  if (sidePanelOpen && currentTollOpen && typeof openSidePanel === 'function') {
    openSidePanel(currentTollOpen);
  }
  if (tooltipEl && tooltipEl.style.display === 'block' && _hoveredToll) {
    tooltipEl.innerHTML = buildHoverTooltip(_hoveredToll);
  }
});
