/**
 * DIODIO — map.js
 * Features:
 *  - OSRM highway route polylines fetched at load
 *  - Help modal
 *  - Legend with solo-filter
 *  - Ramp layer: EXIT/ENTER signs + dashed connection lines toll→exit→entry
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

// Use CartoDB Light as the base map — free, reliable, no token needed.
// Motorways are visible on the base tiles. Mapbox would be richer but the URL-restricted
// token blocks tile API; we keep Mapbox for routing only (Directions API).
L.tileLayer(
  'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19,
  }
).addTo(map);

// ── Highway route polylines (OSRM) ────────────────────────
const HIGHWAY_WAYPOINTS = {
  "A1": [
    [23.8184657, 38.1067470],  // Athens start
    [23.2868636, 38.3708752],  // Thiva
    [23.1434298, 38.6174740],  // Traganas
    [22.6025569, 38.8087016],  // Agios Konstantinos
    [22.6291966, 38.9238268],  // Mavromantila
    [22.8462812, 38.9203273],  // Pelasgia
    [22.5567985, 39.5227965],  // Moschochori
    [22.5028431, 39.8044068],  // Makrychori/Larissa
    [22.5698233, 40.0357339],  // Leptokarya/Tempi
    [22.8384533, 40.6528427],  // Thessaloniki end
  ],
  "A2": [
    [20.2618948, 39.4861509],[20.9475803, 39.6188630],[21.2854099, 39.7855212],
    [21.5810286, 40.2378869],[22.0602089, 40.3671958],[22.9162091, 40.6956111],
    [25.0802422, 41.1203415],[25.5332019, 41.0135240],[26.308717, 40.9452663],
  ],
  "A5": [
    [21.6565418, 38.3592412],  // Klokova (first toll)
    [21.2723798, 38.5494744],  // Aggelokastro
    [21.1709225, 38.9898946],  // Menidi/Kouvaras
    [20.9053087, 39.4252460],  // Terovos
  ],
  "A8": [
    [23.5039038, 38.0499433],  // Elefsina toll
    [23.0325365, 37.9249719],  // Isthmos Canal toll
    [22.8096664, 37.9222552],  // Zevgolatio toll
    [22.1392536, 38.2057293],  // Aigio/Elaionas toll
    [21.8300325, 38.3164492],  // Rio toll
    [21.6191570, 38.1449493],  // Patras toll
    [21.3913023, 37.7120702],  // Pyrgos toll
  ],
  "E65": [
    [22.3487648, 38.9148821],[22.0831633, 39.2566317],[21.8322372, 39.5204295],
  ],
  "A7": [
    [22.9066924, 37.9142092],[22.4464524, 37.6007682],[22.1253947, 37.0463151],
  ],
  "A6": [
    [23.4958076, 38.0422442],[23.7495232, 38.0620135],[23.9350000, 37.9410000],
  ],
  "BRIDGE": [
    [21.7200000, 38.3190000],[21.7660189, 38.3337794],
  ],
};

const highwayRouteLayers = {};

function simplify(coords, n) {
  const out = [coords[0]];
  for (let i = n; i < coords.length - 1; i += n) out.push(coords[i]);
  out.push(coords[coords.length - 1]);
  return out;
}

// Mapbox public token, restricted by URL in account dashboard.
const MAPBOX_TOKEN = 'pk.eyJ1IjoiYW50YXJhbjIiLCJhIjoiY21vZGxqZ2E2MDQxcjJvcjFwYnl0cW94cCJ9.3XhY5-XiaDcBeEOvFUm_Jw';

// Highway lines are no longer drawn as colored polylines.
// Motorways are visible through the Mapbox base tile layer above.
// HIGHWAY_COLORS (from tolls.js) is still used for legend dots, toll markers,
// side panel badges, and verdict chip borders.

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
// Uses Mapbox Directions API for bypass (motorway exclusion works there),
// OSRM for highway comparison. Cached in localStorage.
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
  const coordStr = mode === 'bypass'
    ? [exitPt, ...(via || []), entryPt].map(p => `${p.lng},${p.lat}`).join(';')
    : `${exitPt.lng},${exitPt.lat};${entryPt.lng},${entryPt.lat}`;
  const exclude = mode === 'bypass' ? '&exclude=motorway' : '';
  url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordStr}?geometries=geojson&overview=full${exclude}&access_token=${MAPBOX_TOKEN}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.length) {
      console.warn('[DIODIO] route fetch failed', mode, key, data);
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
    console.warn('[DIODIO] route fetch error', mode, key, e);
    return null;
  }
}

// Backward-compat helper used by calculator.js
window.fetchBypassRoute = async function(exitPt, entryPt, via) {
  const r = await fetchRoute(exitPt, entryPt, 'bypass', via);
  return r ? r.coords : null;
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
  const color    = HIGHWAY_COLORS[toll.highway] || '#888';
  const dirIcons = { frontal: '⇄', entry: '⬆', exit: '⬇', bridge: '⇌' };
  const notes    = toll.notes ? `<div class="tt-notes">${toll.notes}</div>` : '';
  return `
    <div class="tt-header">
      <div>
        <div class="tt-name">${toll.name_en}</div>
        <div class="tt-name-gr">${toll.name_gr}</div>
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
  Object.values(highwayRouteLayers).forEach(l => l.setStyle({ opacity: 0.04 }));
  // Also dim ramp markers if visible
  rampMarkers.forEach(({ exitM, entryM, connLine }) => {
    if (exitM)    exitM.setOpacity(0.07);
    if (entryM)   entryM.setOpacity(0.07);
    if (connLine) connLine.setStyle({ opacity: 0.04 });
  });
}

function restoreAll() {
  allMarkers.forEach(({ marker }) => marker.setOpacity(1));
  Object.entries(highwayRouteLayers).forEach(([hwy, l]) => {
    // Respect active legend filter
    const isDimmedByFilter = activeFilter && activeFilter !== hwy;
    l.setStyle({ opacity: isDimmedByFilter ? 0.03 : 0.3 });
  });
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
  document.getElementById('map-controls')?.classList.remove('pushed');
  document.body.classList.remove('panel-open');
  clearInspectLayers();
  restoreAll();
  sidePanelOpen = false;
  currentTollOpen = null;
  if (typeof setActiveTollLabel === 'function') setActiveTollLabel(null);
  // Refresh map size after layout change so it fills new available area
  setTimeout(() => map.invalidateSize(), 320);
}

// EXIT sign icon — auto-sized so any language fits
function makeExitIcon() {
  return L.divIcon({
    className: 'ramp-icon-wrap',
    html: `<div class="ramp-sign ramp-sign-exit">${t('ramp.exit.label')}</div>`,
    iconSize: [null, null], iconAnchor: [0, 8],
  });
}

// ENTER sign icon — auto-sized so any language fits
function makeEntryIcon() {
  return L.divIcon({
    className: 'ramp-icon-wrap',
    html: `<div class="ramp-sign ramp-sign-entry">${t('ramp.entry.label')}</div>`,
    iconSize: [null, null], iconAnchor: [0, 8],
  });
}

function openSidePanel(toll) {
  clearInspectLayers();
  sidePanelOpen = true;
  sidePanelOpenedAt = Date.now();
  currentTollOpen = toll;
  legendEl.classList.add('pushed');
  document.getElementById('map-controls')?.classList.add('pushed');
  document.body.classList.add('panel-open');

  // Mark this toll's label as active (green dot)
  if (typeof setActiveTollLabel === 'function') setActiveTollLabel(toll.id);

  // Dim everything first
  dimAll();

  // Restore just this toll's marker
  const myMarker = allMarkers.find(m => m.toll.id === toll.id);
  if (myMarker) myMarker.marker.setOpacity(1);

  // Restore this highway's route line
  const hwyLayer = highwayRouteLayers[toll.highway];
  if (hwyLayer) hwyLayer.setStyle({ opacity: 0.35 });

  // Wait for layout transition to settle (panel opens, bottom bar hides on mobile),
  // then invalidate map size so Leaflet recalculates its viewport and centers correctly.
  setTimeout(() => {
    map.invalidateSize();
    map.setView([toll.lat, toll.lng], Math.max(map.getZoom(), 11), { animate: true });
  }, 320);

  const bd    = toll.bypass_directions;
  const color = HIGHWAY_COLORS[toll.highway] || '#888';

  if (bd) {
    const dirEntries = Object.entries(bd);
    // Distinct colors for each direction so they don't overlap visually
    const dirColors = ['#2e7a4a', '#1e5f7a'];

    dirEntries.forEach(([key, dir], i) => {
      if (!dir.exit || !dir.entry) return;

      const lineColor = dirColors[i % dirColors.length];

      // ─── Bypass line (local roads, green/teal) ───
      const placeholderCoords = [[dir.exit.lat, dir.exit.lng], [dir.entry.lat, dir.entry.lng]];
      const bypassLine = L.polyline(placeholderCoords, {
        color: lineColor, weight: 4, opacity: 0.5, dashArray: '8 6',
        lineCap: 'round', lineJoin: 'round',
      }).addTo(map);
      bypassLine.bindTooltip(
        `🟢 ${translateDirectionLabel(dir.label)} — ${t('bypass.via.local')}`,
        { sticky: true, className: 'bypass-tooltip' }
      );
      bypassLine._dirKey = key;
      inspectLayers.push(bypassLine);

      // ─── Highway segment line (motorway, dashed Aegean blue) ───
      const highwayLine = L.polyline(placeholderCoords, {
        color: '#2a6b9e', weight: 3.5, opacity: 0.4, dashArray: '4 6',
        lineCap: 'round', lineJoin: 'round',
      }).addTo(map);
      highwayLine.bindTooltip(
        `🔵 ${translateDirectionLabel(dir.label)} — ${t('bypass.via.highway')}`,
        { sticky: true, className: 'bypass-tooltip' }
      );
      highwayLine._dirKey = key;
      inspectLayers.push(highwayLine);

      // Fetch BOTH routes in parallel
      Promise.all([
        fetchRoute(dir.exit, dir.entry, 'bypass', dir.bypass_via),
        fetchRoute(dir.exit, dir.entry, 'highway'),
      ]).then(([bypassRes, highwayRes]) => {
        if (bypassRes && bypassRes.coords.length > 1) {
          bypassLine.setLatLngs(bypassRes.coords);
          bypassLine.setStyle({ opacity: 0.9, dashArray: null });
        }
        if (highwayRes && highwayRes.coords.length > 1) {
          highwayLine.setLatLngs(highwayRes.coords);
          highwayLine.setStyle({ opacity: 0.7, dashArray: null });
        }
        updateDirStats(toll.id, key, bypassRes, highwayRes);
      });

      // EXIT sign marker
      const em = L.marker([dir.exit.lat, dir.exit.lng], {
        icon: makeExitIcon(), zIndexOffset: 600,
      });
      em.bindTooltip(`${t('ramp.exit.tooltip', {name: dir.exit_name})}<br><small>${translateDirectionLabel(dir.label)}</small>`, {
        className: 'ramp-tooltip',
      });
      em.addTo(map);
      em._dirKey = key;
      inspectLayers.push(em);

      // ENTER sign marker
      const nm = L.marker([dir.entry.lat, dir.entry.lng], {
        icon: makeEntryIcon(), zIndexOffset: 600,
      });
      nm.bindTooltip(`${t('ramp.entry.tooltip', {name: dir.entry_name})}<br><small>${translateDirectionLabel(dir.label)}</small>`, {
        className: 'ramp-tooltip',
      });
      nm.addTo(map);
      nm._dirKey = key;
      inspectLayers.push(nm);
    });
  }

  // Translate direction labels from data (e.g. "Both directions", "Northbound (towards Thessaloniki)")
  function translateDirectionLabel(label) {
    if (!label) return '';
    // Map known patterns to translation keys
    const patterns = [
      { re: /^Both directions$/i,                          key: 'dir.both' },
      { re: /^Northbound \(towards (.+)\)$/i,              key: 'dir.north.to' },
      { re: /^Southbound \(towards (.+)\)$/i,              key: 'dir.south.to' },
      { re: /^Eastbound \(towards (.+)\)$/i,               key: 'dir.east.to' },
      { re: /^Westbound \(towards (.+)\)$/i,               key: 'dir.west.to' },
      { re: /^Northbound$/i,                               key: 'dir.north' },
      { re: /^Southbound$/i,                               key: 'dir.south' },
      { re: /^Eastbound$/i,                                key: 'dir.east' },
      { re: /^Westbound$/i,                                key: 'dir.west' },
      { re: /^Westbound only\. Eastbound is FREE\.$/i,     key: 'dir.west.free' },
      { re: /^Southbound \(entering Greece from (.+)\)$/i, key: 'dir.south.border' },
      { re: /^Westbound \(entering Greece from (.+)\)$/i,  key: 'dir.west.border' },
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
  function updateDirStats(tollId, dirKey, bypassRes, highwayRes) {
    const el = document.querySelector(`.sp-dir[data-dir-key="${dirKey}"] [data-stats="${dirKey}"]`);
    if (!el) return;
    const fmt = (n, suffix) => n != null ? `${n.toFixed(1)} ${suffix}` : '—';

    const bp = el.querySelector('[data-bypass-vals]');
    const hw = el.querySelector('[data-highway-vals]');
    const df = el.querySelector('[data-diff-vals]');

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
  }

  // Show only the selected direction's lines + signs, or both
  function setDirectionFilter(activeKey /* 'north' | 'south' | 'both' */) {
    inspectLayers.forEach(layer => {
      if (!layer._dirKey) return;
      const visible = activeKey === 'both' || layer._dirKey === activeKey;
      if (layer.setOpacity) {
        layer.setOpacity(visible ? 1 : 0);
      } else if (layer.setStyle) {
        const isHighway = layer.options.color === '#2a6b9e';
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
      bypassHTML += `
        <div class="sp-dir${isActive ? ' active' : ''}" data-dir-key="${key}">
          <div class="sp-dir-label">${translateDirectionLabel(dir.label)}</div>
          <div class="sp-dir-exits">
            <span class="sp-exit-tag">${t('sp.exit.tag')}${dir.exit_name}</span>
            <span class="sp-entry-tag">${t('sp.entry.tag')}${dir.entry_name}</span>
          </div>
          <div class="sp-dir-compare" data-stats="${key}">
            <div class="sp-cmp-row sp-cmp-bypass">
              <span class="sp-cmp-dot" style="background:#2e7a4a"></span>
              <span class="sp-cmp-label">${t('compare.bypass')}</span>
              <span class="sp-cmp-vals" data-bypass-vals>${t('compare.loading')}</span>
            </div>
            <div class="sp-cmp-row sp-cmp-highway">
              <span class="sp-cmp-dot" style="background:#2a6b9e"></span>
              <span class="sp-cmp-label">${t('compare.highway')}</span>
              <span class="sp-cmp-vals" data-highway-vals>${t('compare.loading')}</span>
            </div>
            <div class="sp-cmp-diff" data-diff-vals>—</div>
          </div>
        </div>`;
    });
  }

  // Name: show Greek first in Greek mode, English first in English mode
  const primaryName   = getCurrentLang() === 'el' ? toll.name_gr : toll.name_en;
  const secondaryName = getCurrentLang() === 'el' ? toll.name_en : toll.name_gr;

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

  // Apply default direction filter on first open (show first direction only by default)
  if (bd) {
    const dirKeys = Object.keys(bd);
    if (dirKeys.length > 1) {
      // Wait briefly so the layers are added to inspectLayers first, then filter
      setTimeout(() => setDirectionFilter(dirKeys[0]), 50);
    }
  }
}

// ── Toll markers ──────────────────────────────────────────
const markersByHighway = {};
const allMarkers       = [];

TOLL_DATA.forEach(toll => {
  const color = HIGHWAY_COLORS[toll.highway] || '#888';
  const icon  = L.divIcon({
    className: '',
    html: `<div class="toll-marker" style="background:${color}"></div>`,
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

  marker.addTo(map);
  allMarkers.push({ toll, marker });
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

      if (dir.exit) {
        exitM = L.marker([dir.exit.lat, dir.exit.lng], {
          icon: makeExitIcon(), zIndexOffset: 50, opacity: 0,
        });
        exitM.bindTooltip(
          `<strong>${t('ramp.exit.label')}:</strong> ${dir.exit_name}<br><small>${t('ramp.avoid', {toll: toll.name_en})}</small>`,
          { className: 'ramp-tooltip' }
        );
      }

      if (dir.entry) {
        entryM = L.marker([dir.entry.lat, dir.entry.lng], {
          icon: makeEntryIcon(), zIndexOffset: 50, opacity: 0,
        });
        entryM.bindTooltip(
          `<strong>${t('ramp.entry.label')}:</strong> ${dir.entry_name}<br><small>${t('ramp.avoid', {toll: toll.name_en})}</small>`,
          { className: 'ramp-tooltip' }
        );
      }

      // Dashed connection line: exit → toll → entry
      if (dir.exit && dir.entry) {
        connLine = L.polyline(
          [[dir.exit.lat, dir.exit.lng],[toll.lat, toll.lng],[dir.entry.lat, dir.entry.lng]],
          { color: '#c4613d', weight: 1.5, opacity: 0, dashArray: '5 4', lineCap: 'round' }
        );
        connLine.bindTooltip(
          `${dir.exit_name} → ${toll.name_en} → ${dir.entry_name}`,
          { sticky: true, className: 'bypass-tooltip' }
        );
      }

      rampMarkers.push({ tollId: toll.id, exitM, entryM, connLine });
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
  tollNameMarkers.forEach(({ marker }) => {
    if (zoomedIn) {
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

// ── Toll names layer (labels above each toll marker) — always on, zoom-aware ──
const tollNameMarkers = [];

function buildLabelHtml(toll) {
  const name = getCurrentLang() === 'el' ? toll.name_gr : toll.name_en;
  const short = name.replace(/^Διόδια\s+/, '').replace(/^Toll\s+of\s+/i, '');
  return `<div class="toll-name-label">${short}</div>`;
}

function buildTollNameMarkers() {
  TOLL_DATA.forEach(toll => {
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
  // Update labels
  tollNameMarkers.forEach(({ marker, toll }) => {
    const name = getCurrentLang() === 'el' ? toll.name_gr : toll.name_en;
    const short = name.replace(/^Διόδια\s+/, '').replace(/^Toll\s+of\s+/i, '');
    const isActive = toll.id === activeTollId;
    marker.setIcon(L.divIcon({
      className: '',
      html: `<div class="toll-name-label${isActive ? ' active' : ''}">${short}</div>`,
      iconSize: [null, null], iconAnchor: [0, -10],
    }));
  });
  // Update dot markers — turn the active one green, restore others to highway color
  allMarkers.forEach(({ toll, marker }) => {
    const color = HIGHWAY_COLORS[toll.highway] || '#888';
    const isActive = toll.id === activeTollId;
    marker.setIcon(L.divIcon({
      className: '',
      html: `<div class="toll-marker${isActive ? ' active' : ''}" style="background:${isActive ? '#1f5828' : color}"></div>`,
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
  // Refresh ramp marker icons (their text is baked-in at creation time)
  rampMarkers.forEach(({ exitM, entryM }) => {
    if (exitM)  exitM.setIcon(makeExitIcon());
    if (entryM) entryM.setIcon(makeEntryIcon());
  });
  // If side panel is open, re-render its content with the new language
  if (sidePanelOpen && currentTollOpen) {
    openSidePanel(currentTollOpen);
  }
});

// ── Legend ────────────────────────────────────────────────
const legendBtn = document.getElementById('legend-toggle');
const isMobile  = window.innerWidth <= 640;
window.legendVis = !isMobile;
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
      if (highwayRouteLayers[k]) highwayRouteLayers[k].setStyle({ opacity: 0.3 });
    });
    legendList.querySelectorAll('.legend-item').forEach(el => {
      el.classList.remove('active-filter', 'dimmed-filter');
    });
  } else {
    activeFilter = selectedKey;
    allKeys.forEach(k => {
      const solo = k === selectedKey;
      markersByHighway[k]?.forEach(m => m.setOpacity(solo ? 1 : 0.07));
      if (highwayRouteLayers[k]) {
        highwayRouteLayers[k].setStyle({ opacity: solo ? 0.7 : 0.03 });
      }
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
