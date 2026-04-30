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
window.cycleBaseLayer = function() {
  // Tear down current layer(s)
  if (window.basemapMode === 'streets') {
    map.removeLayer(STREET_LAYER);
    SATELLITE_LAYER.addTo(map);
    window.basemapMode = 'satellite';
  } else if (window.basemapMode === 'satellite') {
    SATELLITE_LABELS.addTo(map);
    window.basemapMode = 'hybrid';
  } else {
    // hybrid → streets
    map.removeLayer(SATELLITE_LAYER);
    map.removeLayer(SATELLITE_LABELS);
    STREET_LAYER.addTo(map);
    window.basemapMode = 'streets';
  }
  // Notify the topbar/drawer buttons to update their label
  if (typeof window.updateBasemapButtonLabels === 'function') {
    window.updateBasemapButtonLabels();
  }
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

async function fetchRoute(exitPt, entryPt, mode, via) {
  const viaKey = via?.length
    ? via.map(p => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join('|')
    : '';
  const key = `${mode}:${exitPt.lat.toFixed(5)},${exitPt.lng.toFixed(5)};${entryPt.lat.toFixed(5)},${entryPt.lng.toFixed(5)}${viaKey ? '|' + viaKey : ''}`;

  if (routeCache[key]) return routeCache[key];

  try {
    const stored = localStorage.getItem(`diodio.route.v5.${key}`);
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
  url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordStr}?geometries=geojson&overview=full${exclude}&access_token=${MAPBOX_TOKEN}`;

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
    routeCache[key] = result;
    try { localStorage.setItem(`diodio.route.v5.${key}`, JSON.stringify(result)); } catch (e) {}
    return result;
  } catch (e) {
    console.warn('[mydiodia] route fetch error', mode, key, e);
    return null;
  }
}

// Backward-compat helper used by calculator.js
window.fetchBypassRoute = async function(exitPt, entryPt, via) {
  const r = await fetchRoute(exitPt, entryPt, 'bypass', via);
  return r ? r.coords : null;
};
// Main analyze route: full origin → destination via motorway. Returns the
// same {coords, distanceKm, durationMin} shape as fetchRoute, or null on failure.
window.fetchMainRoute = async function(fromCoord, toCoord) {
  return fetchRoute(fromCoord, toCoord, 'highway');
};
window.fetchRoute = fetchRoute;

// ── Help modal ────────────────────────────────────────────
const helpModal    = document.getElementById('help-modal');
const helpBtn      = document.getElementById('help-btn');
const helpClose    = document.getElementById('help-close');
const helpCloseBtn = document.getElementById('help-close-btn');

helpBtn.addEventListener('click',      () => helpModal.classList.add('open'));
helpClose.addEventListener('click',    () => helpModal.classList.remove('open'));
helpCloseBtn.addEventListener('click', () => helpModal.classList.remove('open'));
helpModal.addEventListener('click', e => {
  if (e.target === helpModal) helpModal.classList.remove('open');
});

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
  const notes    = toll.notes ? `<div class="tt-notes">${toll.notes}</div>` : '';
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
        <div class="vehicle-icon">🏍</div>
        <div class="vehicle-label">Moto</div>
        <div class="price-val"><span class="eur">€</span>${toll.cat1.toFixed(2)}</div>
      </div>
      <div class="price-cell">
        <div class="vehicle-icon">🚗</div>
        <div class="vehicle-label">Car</div>
        <div class="price-val"><span class="eur">€</span>${toll.cat2.toFixed(2)}</div>
      </div>
      <div class="price-cell">
        <div class="vehicle-icon">🚐</div>
        <div class="vehicle-label">Van</div>
        <div class="price-val"><span class="eur">€</span>${toll.cat3.toFixed(2)}</div>
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
const legendEl    = document.getElementById('legend');

function clearInspectLayers() {
  inspectLayers.forEach(l => map.removeLayer(l));
  inspectLayers = [];
}

function closeSidePanel() {
  document.getElementById('toll-side-panel')?.classList.remove('open');
  legendEl.classList.remove('pushed');
  document.body.classList.remove('panel-open');
  clearInspectLayers();
  restoreAll();
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


// EXIT sign icon — auto-sized so any language fits, includes place name
function makeExitIcon(placeName) {
  const nameHtml = placeName
    ? `<span class="ramp-sign-name">${placeName}</span>`
    : '';
  return L.divIcon({
    className: 'ramp-icon-wrap',
    html: `<div class="ramp-sign ramp-sign-exit">${t('ramp.exit.label')}${nameHtml}</div>`,
    iconSize: [null, null], iconAnchor: [0, 8],
  });
}

// ENTER sign icon — auto-sized so any language fits, includes place name
function makeEntryIcon(placeName) {
  const nameHtml = placeName
    ? `<span class="ramp-sign-name">${placeName}</span>`
    : '';
  return L.divIcon({
    className: 'ramp-icon-wrap',
    html: `<div class="ramp-sign ramp-sign-entry">${t('ramp.entry.label')}${nameHtml}</div>`,
    iconSize: [null, null], iconAnchor: [0, 8],
  });
}

// ── Side-toll display-name cleaner ────────────────────────
// Side-toll names in the data are deliberately verbose so the dataset is
// self-describing — e.g. "Πλευρικά Καπανδρίτι — Βόρεια είσοδος" /
// "Kapandriti side — N entry". When we list these inside a "you'll still
// pay X side tolls" callout, the prefix and direction suffix are
// redundant (the callout already says "side toll" and renders the role
// separately). This helper strips both.
function cleanSideTollName(name, lang) {
  if (!name) return '';
  if (lang === 'el') {
    // "Πλευρικά Καπανδρίτι — Βόρεια είσοδος" → "Καπανδρίτι"
    return name
      .replace(/^Πλευρικά\s+/i, '')
      .replace(/\s+[—–-]\s+(Βόρεια|Νότια|Ανατολική|Δυτική).*$/i, '')
      .trim();
  }
  // "Kapandriti side — N entry" → "Kapandriti"
  return name
    .replace(/\s+side\s+[—–-]\s+[NSEW]\s+(entry|exit)\s*$/i, '')
    .replace(/\s+side\s*$/i, '')
    .trim();
}

function openSidePanel(toll) {
  // Auto-dismiss the first-visit tip — user took the hint, don't show again.
  if (typeof window.dismissFirstTip === 'function') window.dismissFirstTip();
  clearInspectLayers();
  sidePanelOpen = true;
  sidePanelOpenedAt = Date.now();
  currentTollOpen = toll;
  legendEl.classList.add('pushed');
  document.body.classList.add('panel-open');

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

  // Wait for layout transition to settle (panel opens, bottom bar hides on mobile),
  // then invalidate map size so Leaflet recalculates its viewport and centers correctly.
  setTimeout(() => {
    map.invalidateSize();
    map.setView([toll.lat, toll.lng], Math.max(map.getZoom(), 11), { animate: true });
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
      // Ferry mode: skip road routing entirely. Pier→pier by road would
      // return an absurd detour around the gulf. Synthesize stats from
      // geodesic distance + dir.minutes / dir.crossing_min instead.
      if (dir.mode === 'ferry') {
        const ferryDistKm = haversineKm(dir.off_ramp, dir.on_ramp);
        // The bridge crossing itself is ~2.9km and takes ~5 min by car.
        // We don't have a true highway-route to fetch here (the bridge
        // is the highway), so the "highway" stats represent the bridge:
        // straight-line distance, fixed 5 min crossing.
        const bridgeRes  = { coords: highwayPlaceholder, distanceKm: ferryDistKm, durationMin: 5 };
        const ferryRes   = { coords: bypassPlaceholder,  distanceKm: ferryDistKm, durationMin: dir.minutes };
        updateDirStats(toll, key, dir, ferryRes, bridgeRes);
      } else {
      Promise.all([
        fetchRoute(dir.pre_exit, dir.post_merge, 'highway'),
        Promise.all([
          fetchRoute(dir.pre_exit, dir.off_ramp,   'highway'),
          fetchRoute(dir.off_ramp, dir.on_ramp,    'bypass', dir.bypass_via),
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
        if (highwayRes && highwayRes.coords.length > 1) {
          highwayLine.setLatLngs(highwayRes.coords);
          highwayLine.setStyle({ opacity: 0.7, dashArray: null });
          updateArrow(highwayArrow, highwayRes.coords, 'dir-arrow-highway');
        }
        if (bypassRes && bypassRes.coords.length > 1) {
          bypassLine.setLatLngs(bypassRes.coords);
          bypassLine.setStyle({ opacity: 0.9, dashArray: null });
          updateArrow(bypassArrow, bypassRes.coords, 'dir-arrow-bypass');
        }
        updateDirStats(toll, key, dir, bypassRes, highwayRes);
      });
      }

      // EXIT sign marker — anchored on the off-ramp itself
      const em = L.marker([dir.off_ramp.lat, dir.off_ramp.lng], {
        icon: makeExitIcon(), zIndexOffset: 600,
      });
      em.bindTooltip(`${t('ramp.exit.tooltip', {name: dir.exit_name})}<br><small>${translateDirectionLabel(dir.label)}</small>`, {
        className: 'ramp-tooltip',
      });
      em.addTo(map);
      em._dirKey = key;
      inspectLayers.push(em);

      // ENTER sign marker — anchored on the on-ramp itself
      const nm = L.marker([dir.on_ramp.lat, dir.on_ramp.lng], {
        icon: makeEntryIcon(), zIndexOffset: 600,
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
      if (!sideTollsVisible && typeof window.bypassSideTollCost === 'function') {
        const sideInfo = window.bypassSideTollCost(toll, key, dir);
        sideInfo.items.forEach(({ toll: sideToll, role }) => {
          const sideIcon = L.divIcon({
            className: '',
            html: `<div class="toll-marker toll-marker-side toll-marker-bypass-side" style="background:${SIDE_TOLL_COLOR}"></div>`,
            iconSize: [13, 13], iconAnchor: [6.5, 6.5],
          });
          const sideMarker = L.marker([sideToll.lat, sideToll.lng], {
            icon: sideIcon,
            zIndexOffset: 550,  // above bypass line, below ramp signs
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

  // Update the comparison stats inline in the side panel after OSRM returns
  function updateDirStats(toll, dirKey, dir, bypassRes, highwayRes) {
    const el = document.querySelector(`.sp-dir[data-dir-key="${dirKey}"] [data-stats="${dirKey}"]`);
    if (!el) return;
    const fmt = (n, suffix) => n != null ? `${n.toFixed(1)} ${suffix}` : '—';

    const bp = el.querySelector('[data-bypass-vals]');
    const hw = el.querySelector('[data-highway-vals]');
    const df = el.querySelector('[data-diff-vals]');
    const pd = el.querySelector('[data-price-diff]');

    if (bypassRes && bp) {
      bp.textContent = `${fmt(bypassRes.distanceKm, 'km')} · ${fmt(bypassRes.durationMin, t('bar.time.label2'))}`;
    } else if (bp) {
      bp.textContent = t('compare.unavailable');
    }
    if (highwayRes && hw) {
      hw.textContent = `${fmt(highwayRes.distanceKm, 'km')} · ${fmt(highwayRes.durationMin, t('bar.time.label2'))}`;
    } else if (hw) {
      hw.textContent = t('compare.unavailable');
    }

    if (bypassRes && highwayRes && df) {
      const distDiff = bypassRes.distanceKm  - highwayRes.distanceKm;
      const timeDiff = bypassRes.durationMin - highwayRes.durationMin;
      const distSign = distDiff >= 0 ? '+' : '';
      const timeSign = timeDiff >= 0 ? '+' : '';
      df.innerHTML = `${t('compare.diff')}: <strong>${distSign}${distDiff.toFixed(1)} km</strong> · <strong>${timeSign}${Math.round(timeDiff)} ${t('bar.time.label2')}</strong>`;
    }

    // Per-vehicle price diff: bypass price minus highway price for each of the 4
    // categories. Highway price is the frontal toll. Bypass price is the sum of
    // any side tolls billable at the bypass off_ramp/on_ramp endpoints — OR the
    // ferry fare when mode === 'ferry' (Rio-Antirrio bridge bypass).
    //   diff < 0 → bypass cheaper (savings, green)
    //   diff = 0 → no difference
    //   diff > 0 → bypass costlier (rare; happens when side tolls exceed frontal)
    if (pd && toll && dir && typeof window.bypassSideTollCost === 'function') {
      const isFerry = dir.mode === 'ferry' && dir.fare;
      const sideInfo = isFerry ? null : window.bypassSideTollCost(toll, dirKey, dir);
      const cats = [
        { key: 'cat1', emoji: '🏍', labelKey: 'sp.motorcycle' },
        { key: 'cat2', emoji: '🚗', labelKey: 'sp.car' },
        { key: 'cat3', emoji: '🚐', labelKey: 'sp.van' },
        { key: 'cat4', emoji: '🚛', labelKey: 'sp.truck' },
      ];
      const rows = cats.map(({ key, emoji, labelKey }) => {
        const frontal = toll[key] || 0;
        const side    = isFerry ? (dir.fare[key] || 0) : (sideInfo.totals[key] || 0);
        const diff    = side - frontal;     // negative = bypass cheaper
        const sign    = diff > 0 ? '+' : (diff < 0 ? '−' : '');
        const cls     = diff < 0 ? 'savings' : (diff > 0 ? 'cost' : 'zero');
        const abs     = Math.abs(diff).toFixed(2);
        return `<div class="sp-cmp-pd-row">
          <span class="sp-cmp-pd-veh"><span class="sp-cmp-pd-emoji">${emoji}</span>${t(labelKey)}</span>
          <span class="sp-cmp-pd-val ${cls}">${sign}€${abs}</span>
        </div>`;
      }).join('');
      pd.innerHTML = rows;
    }
  }

  // Show only the selected direction's lines + signs, or both
  function setDirectionFilter(activeKey /* 'northbound' | 'southbound' | 'eastbound' | 'westbound' | 'both' */) {
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
    // Update the active-direction headline
    const headline = document.getElementById('sp-active-dir');
    if (headline) {
      const labelEl = headline.querySelector('.sp-active-dir-name');
      if (labelEl) {
        if (activeKey === 'both') {
          labelEl.textContent = t('filter.both');
        } else if (bd && bd[activeKey]) {
          labelEl.textContent = translateDirectionLabel(bd[activeKey].label);
        }
      }
    }
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
    let activeHeadlineHTML = '';
    if (dirKeys.length > 1) {
      const activeLabel = translateDirectionLabel(bd[defaultDir].label);
      activeHeadlineHTML = `<div class="sp-active-dir" id="sp-active-dir">
        <span class="sp-active-dir-eyebrow">${t('sp.showing')}</span>
        <span class="sp-active-dir-name">${activeLabel}</span>
      </div>`;
    }

    bypassHTML = filterPillsHTML + activeHeadlineHTML;
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
        const cats = [
          { key: 'cat1', emoji: '🏍', labelKey: 'sp.motorcycle' },
          { key: 'cat2', emoji: '🚗', labelKey: 'sp.car' },
          { key: 'cat3', emoji: '🚐', labelKey: 'sp.van' },
          { key: 'cat4', emoji: '🚛', labelKey: 'sp.truck' },
        ];
        const fareRows = cats.map(({ key, emoji, labelKey }) => {
          const fare = dir.fare[key];
          if (fare == null) return '';
          return `<li class="sp-ferry-fare-item">
            <span class="sp-ferry-fare-veh"><span class="sp-ferry-fare-emoji">${emoji}</span>${t(labelKey)}</span>
            <span class="sp-ferry-fare-val">€${fare.toFixed(2)}</span>
          </li>`;
        }).join('');
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
            <span class="sp-exit-tag">
              <svg class="sp-tag-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <line x1="17" y1="7" x2="7" y2="17"/>
                <polyline points="16 17 7 17 7 8"/>
              </svg>
              <span class="sp-tag-text">${t('sp.exit.tag')}${dir.exit_name}</span>
            </span>
            <span class="sp-entry-tag">
              <svg class="sp-tag-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <line x1="7" y1="17" x2="17" y2="7"/>
                <polyline points="8 7 17 7 17 16"/>
              </svg>
              <span class="sp-tag-text">${t('sp.entry.tag')}${dir.entry_name}</span>
            </span>
          </div>
          ${confHTML}
          ${sideTollsHTML}
          <div class="sp-dir-compare" data-stats="${key}">
            <div class="sp-cmp-row sp-cmp-bypass">
              <span class="sp-cmp-dot" style="background:#2a6b9e"></span>
              <span class="sp-cmp-label">${t('compare.bypass')}</span>
              <span class="sp-cmp-vals" data-bypass-vals>${t('compare.loading')}</span>
            </div>
            <div class="sp-cmp-row sp-cmp-highway">
              <span class="sp-cmp-dot" style="background:#2e7a4a"></span>
              <span class="sp-cmp-label">${t('compare.highway')}</span>
              <span class="sp-cmp-vals" data-highway-vals>${t('compare.loading')}</span>
            </div>
            <div class="sp-cmp-diff" data-diff-vals>—</div>
            <div class="sp-cmp-price-diff" data-price-diff></div>
          </div>
        </div>`;
    });
  }

  // Name: show Greek first in Greek mode, English first in English mode
  // Strip "Διόδια" / "Toll of" prefix — the panel header already says "Toll Information".
  const primaryName   = stripTollPrefix(getCurrentLang() === 'el' ? toll.name_gr : toll.name_en);
  const secondaryName = stripTollPrefix(getCurrentLang() === 'el' ? toll.name_en : toll.name_gr);

  // Notes are English-only in data; only show when in English mode
  const notesHTML = (toll.notes && getCurrentLang() === 'en')
    ? `<div class="sp-notes">${toll.notes}</div>`
    : '';

  document.getElementById('sp-content').innerHTML = `
    <div class="sp-header-inner">
      <div class="sp-hwy-badge" style="--hwy-color:${color}">${t('hwy.' + toll.highway)}</div>
      <div class="sp-name">${primaryName}</div>
      <div class="sp-name-gr">${secondaryName}</div>
    </div>
    <div class="sp-prices">
      <div class="sp-price-row"><span><span class="sp-emoji">🏍</span><span class="sp-vlabel">${t('sp.motorcycle')}</span></span><strong>€${toll.cat1.toFixed(2)}</strong></div>
      <div class="sp-price-row"><span><span class="sp-emoji">🚗</span><span class="sp-vlabel">${t('sp.car')}</span></span><strong>€${toll.cat2.toFixed(2)}</strong></div>
      <div class="sp-price-row"><span><span class="sp-emoji">🚐</span><span class="sp-vlabel">${t('sp.van')}</span></span><strong>€${toll.cat3.toFixed(2)}</strong></div>
      <div class="sp-price-row"><span><span class="sp-emoji">🚛</span><span class="sp-vlabel">${t('sp.truck')}</span></span><strong>€${toll.cat4.toFixed(2)}</strong></div>
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

// Side tolls (type === "side") get yellow markers and are hidden by default.
// Toggleable via the legend "Πλευρικά διόδια / Side tolls" button.
const SIDE_TOLL_COLOR = '#f4c430';  // light yellow
let sideTollsVisible = false;
const sideMarkers    = [];  // { toll, marker } for side tolls only

TOLL_DATA.forEach(toll => {
  const isSide = toll.type === 'side';
  const color  = isSide ? SIDE_TOLL_COLOR : (HIGHWAY_COLORS[toll.highway] || '#888');
  const icon  = L.divIcon({
    className: '',
    html: `<div class="toll-marker${isSide ? ' toll-marker-side' : ''}" style="background:${color}"></div>`,
    iconSize: [11, 11], iconAnchor: [5.5, 5.5],
  });

  const marker = L.marker([toll.lat, toll.lng], { icon, zIndexOffset: 100 });

  marker.on('mouseover', function(e) {
    tooltipEl.innerHTML = buildHoverTooltip(toll);
    tooltipEl.style.display = 'block';
    positionTooltip(e.originalEvent);
  });
  marker.on('mousemove', function(e) { positionTooltip(e.originalEvent); });
  marker.on('mouseout',  function()  { tooltipEl.style.display = 'none'; });
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

// ── Side tolls toggle ─────────────────────────────────────
// Side tolls (type === "side") are hidden by default. The user toggles
// them on via the floating "Πλευρικά διόδια / Side tolls" button.
// Markers are yellow; they cluster tightly around interchanges
// (~150-365m apart) so hiding them by default reduces visual noise.
document.getElementById('side-tolls-toggle').addEventListener('click', function() {
  sideTollsVisible = !sideTollsVisible;
  this.classList.toggle('active', sideTollsVisible);
  const stateEl = this.querySelector('.map-floating-toggle-state');
  if (stateEl) {
    stateEl.setAttribute('data-i18n', sideTollsVisible ? 'legend.side.on' : 'legend.side.off');
    stateEl.textContent = t(sideTollsVisible ? 'legend.side.on' : 'legend.side.off');
  }
  sideMarkers.forEach(({ marker }) => {
    if (sideTollsVisible) {
      marker.addTo(map);
    } else {
      map.removeLayer(marker);
    }
  });
});

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
      iconSize: [null, null], iconAnchor: [0, -10],
    });
    const m = L.marker([toll.lat, toll.lng], { icon, zIndexOffset: 30 });
    m.on('click', function(e) {
      L.DomEvent.stopPropagation(e);
      tooltipEl.style.display = 'none';
      openSidePanel(toll);
    });
    m.on('mouseover', function(e) {
      tooltipEl.innerHTML = buildHoverTooltip(toll);
      tooltipEl.style.display = 'block';
      positionTooltip(e.originalEvent);
    });
    m.on('mousemove', function(e) { positionTooltip(e.originalEvent); });
    m.on('mouseout',  function()  { tooltipEl.style.display = 'none'; });
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
      iconSize: [null, null], iconAnchor: [0, -10],
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
      iconSize: [null, null], iconAnchor: [0, -10],
    }));
  });
  // Update dot markers — turn the active one green, restore others to highway color
  // (or yellow, for side tolls).
  allMarkers.forEach(({ toll, marker }) => {
    const isSide = toll.type === 'side';
    const color = isSide ? SIDE_TOLL_COLOR : (HIGHWAY_COLORS[toll.highway] || '#888');
    const isActive = toll.id === activeTollId;
    marker.setIcon(L.divIcon({
      className: '',
      html: `<div class="toll-marker${isActive ? ' active' : ''}${isSide ? ' toll-marker-side' : ''}" style="background:${isActive ? '#1f5828' : color}"></div>`,
      iconSize: isActive ? [14, 14] : [11, 11],
      iconAnchor: isActive ? [7, 7] : [5.5, 5.5],
    }));
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
const legendBtn = document.getElementById('legend-toggle');
// Legend starts hidden by default. Users discover it via the "Show legend"
// button in the topbar; previously the legend competed with the map for
// real estate on first load.
window.legendVis = false;
let   legendVis = window.legendVis;

legendEl.classList.toggle('hidden', !legendVis);
legendBtn.textContent = t(legendVis ? 'btn.legend.hide' : 'btn.legend.show');

legendBtn.addEventListener('click', () => {
  legendVis = !legendVis;
  window.legendVis = legendVis;
  legendEl.classList.toggle('hidden', !legendVis);
  legendBtn.textContent = t(legendVis ? 'btn.legend.hide' : 'btn.legend.show');
});

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
// Topbar button + mobile drawer button both cycle through streets→satellite→hybrid.
// updateBasemapButtonLabels() keeps the visible labels in sync with the current
// mode and the active language.
window.updateBasemapButtonLabels = function() {
  const key = `btn.basemap.${window.basemapMode}`;  // btn.basemap.streets|satellite|hybrid
  const label = t(key);
  const topBtn = document.getElementById('basemap-toggle');
  const mobBtn = document.getElementById('mobile-basemap-btn');
  if (topBtn) {
    const span = topBtn.querySelector('span[data-basemap-label]');
    if (span) span.textContent = label;
  }
  if (mobBtn) {
    const span = mobBtn.querySelector('span[data-basemap-label]');
    if (span) span.textContent = label;
  }
};

const basemapTopBtn = document.getElementById('basemap-toggle');
if (basemapTopBtn) basemapTopBtn.addEventListener('click', window.cycleBaseLayer);
const basemapMobBtn = document.getElementById('mobile-basemap-btn');
if (basemapMobBtn) basemapMobBtn.addEventListener('click', window.cycleBaseLayer);

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
