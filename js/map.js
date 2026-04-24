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
    [23.5039038, 38.0499433],  // Elefsina
    [23.0325365, 37.9249719],  // Isthmos Canal
    [22.8096664, 37.9222552],  // Zevgolatio
    [22.1392536, 38.2057293],  // Elaionas/Aigio toll
    [21.8300325, 38.3164492],  // Rio
    [21.6191570, 38.1449493],  // Patras
    [21.3913023, 37.7120702],  // Pyrgos
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

async function fetchAndDrawRoute(hwy, waypoints) {
  const coordStr = waypoints.map(w => `${w[0]},${w[1]}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson`;
  try {
    const res  = await fetch(url);
    const data = await res.json();
    if (data.code !== 'Ok') return;
    const raw    = data.routes[0].geometry.coordinates;
    const coords = simplify(raw, 4).map(c => [c[1], c[0]]);
    const color  = HIGHWAY_COLORS[hwy] || '#888';
    const layer  = L.polyline(coords, {
      color, weight: 3, opacity: 0.3, lineCap: 'round', lineJoin: 'round',
    }).addTo(map);
    highwayRouteLayers[hwy] = layer;
  } catch (e) { /* fail silently */ }
}

Object.entries(HIGHWAY_WAYPOINTS).forEach(([hwy, wps]) => fetchAndDrawRoute(hwy, wps));

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
const legendEl    = document.getElementById('legend');

function clearInspectLayers() {
  inspectLayers.forEach(l => map.removeLayer(l));
  inspectLayers = [];
}

function closeSidePanel() {
  document.getElementById('toll-side-panel')?.classList.remove('open');
  legendEl.classList.remove('pushed');
  document.getElementById('map-controls')?.classList.remove('pushed');
  clearInspectLayers();
  restoreAll();
  sidePanelOpen = false;
}

// EXIT sign icon
function makeExitIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="background:#2a6b9e;color:white;font-family:Arial Black,sans-serif;font-size:8px;font-weight:900;padding:2px 4px;border-radius:3px;border:1.5px solid white;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.3);letter-spacing:1px;">${t('ramp.exit.label')}</div>`,
    iconSize: [36, 16], iconAnchor: [18, 8],
  });
}

// ENTER sign icon
function makeEntryIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="background:#2e7a4a;color:white;font-family:Arial Black,sans-serif;font-size:8px;font-weight:900;padding:2px 4px;border-radius:3px;border:1.5px solid white;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.3);letter-spacing:1px;">${t('ramp.entry.label')}</div>`,
    iconSize: [42, 16], iconAnchor: [21, 8],
  });
}

function openSidePanel(toll) {
  clearInspectLayers();
  sidePanelOpen = true;
  legendEl.classList.add('pushed');
  document.getElementById('map-controls')?.classList.add('pushed');

  // Dim everything first
  dimAll();

  // Restore just this toll's marker
  const myMarker = allMarkers.find(m => m.toll.id === toll.id);
  if (myMarker) myMarker.marker.setOpacity(1);

  // Restore this highway's route line
  const hwyLayer = highwayRouteLayers[toll.highway];
  if (hwyLayer) hwyLayer.setStyle({ opacity: 0.35 });

  map.setView([toll.lat, toll.lng], Math.max(map.getZoom(), 11), { animate: true });

  const bd    = toll.bypass_directions;
  const color = HIGHWAY_COLORS[toll.highway] || '#888';

  if (bd) {
    Object.entries(bd).forEach(([key, dir]) => {
      if (!dir.via) return;

      // Green bypass line
      const line = L.polyline(dir.via.map(p => [p.lat, p.lng]), {
        color: '#2e7a4a', weight: 4, opacity: 0.9, lineCap: 'round', lineJoin: 'round',
      }).addTo(map);
      line.bindTooltip(`🟢 ${dir.label} (+${dir.minutes} min)`, {
        sticky: true, className: 'bypass-tooltip',
      });
      inspectLayers.push(line);

      // EXIT sign marker
      if (dir.exit) {
        const em = L.marker([dir.exit.lat, dir.exit.lng], {
          icon: makeExitIcon(), zIndexOffset: 600,
        });
        em.bindTooltip(`${t('ramp.exit.tooltip', {name: dir.exit_name})}<br><small>${dir.label}</small>`, {
          className: 'ramp-tooltip',
        });
        em.addTo(map);
        inspectLayers.push(em);
      }

      // ENTER sign marker
      if (dir.entry) {
        const nm = L.marker([dir.entry.lat, dir.entry.lng], {
          icon: makeEntryIcon(), zIndexOffset: 600,
        });
        nm.bindTooltip(`${t('ramp.entry.tooltip', {name: dir.entry_name})}<br><small>${dir.label}</small>`, {
          className: 'ramp-tooltip',
        });
        nm.addTo(map);
        inspectLayers.push(nm);
      }

      // Dashed connection: exit → toll → entry
      if (dir.exit && dir.entry) {
        const connCoords = [
          [dir.exit.lat,  dir.exit.lng],
          [toll.lat,       toll.lng],
          [dir.entry.lat, dir.entry.lng],
        ];
        const conn = L.polyline(connCoords, {
          color: '#c4613d',
          weight: 2,
          opacity: 0.8,
          dashArray: '6 5',
          lineCap: 'round',
        }).addTo(map);
        conn.bindTooltip(`${dir.exit_name} → toll → ${dir.entry_name}`, {
          sticky: true, className: 'bypass-tooltip',
        });
        inspectLayers.push(conn);
      }
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

  // Build side panel HTML
  let bypassHTML = '';
  if (!bd) {
    bypassHTML = `<div class="sp-no-bypass">${t('sp.no.bypass')}</div>`;
  } else {
    bypassHTML = `<div class="sp-bypass-title">${t('sp.bypass.options')}</div>`;
    Object.entries(bd).forEach(([key, dir]) => {
      bypassHTML += `
        <div class="sp-dir">
          <div class="sp-dir-label">${translateDirectionLabel(dir.label)}</div>
          <div class="sp-dir-time">${t('sp.detour', {n: dir.minutes})}</div>
          <div class="sp-dir-exits">
            <span class="sp-exit-tag">${t('sp.exit.tag')}${dir.exit_name}</span>
            <span class="sp-entry-tag">${t('sp.entry.tag')}${dir.entry_name}</span>
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
      <div class="sp-hwy-badge" style="background:${color}">${toll.highway}</div>
      <div class="sp-name">${primaryName}</div>
      <div class="sp-name-gr">${secondaryName}</div>
      <div class="sp-operator">${toll.operator} · ${t('hwy.' + toll.highway)}</div>
    </div>
    <div class="sp-section-title">${t('sp.prices')}</div>
    <div class="sp-prices">
      <div class="sp-price-row"><span>${t('sp.motorcycle')}</span><strong>€${toll.cat1.toFixed(2)}</strong></div>
      <div class="sp-price-row"><span>${t('sp.car')}</span><strong>€${toll.cat2.toFixed(2)}</strong></div>
      <div class="sp-price-row"><span>${t('sp.van')}</span><strong>€${toll.cat3.toFixed(2)}</strong></div>
      <div class="sp-price-row"><span>${t('sp.truck')}</span><strong>€${toll.cat4.toFixed(2)}</strong></div>
    </div>
    <div class="sp-section-title">${t('sp.direction')}</div>
    <div class="sp-direction">${translateDirectionLabel(toll.direction_label)}</div>
    ${notesHTML}
    <div class="sp-section-title">${t('sp.bypass')}</div>
    ${bypassHTML}
  `;

  document.getElementById('toll-side-panel').classList.add('open');
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

map.on('click', () => { if (sidePanelOpen) closeSidePanel(); });
document.getElementById('sp-close').addEventListener('click', closeSidePanel);

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

document.getElementById('ramps-btn').addEventListener('click', function() {
  rampsVisible = !rampsVisible;
  this.classList.toggle('active', rampsVisible);
  rampMarkers.forEach(({ exitM, entryM, connLine }) => {
    if (rampsVisible) {
      if (exitM)    { exitM.addTo(map);    exitM.setOpacity(1); }
      if (entryM)   { entryM.addTo(map);   entryM.setOpacity(1); }
      if (connLine) { connLine.addTo(map); connLine.setStyle({ opacity: 0.5 }); }
    } else {
      if (exitM)    map.removeLayer(exitM);
      if (entryM)   map.removeLayer(entryM);
      if (connLine) map.removeLayer(connLine);
    }
  });
});

// ── Toll names layer (labels above each toll marker) ──────
const tollNameMarkers = [];
let   tollNamesVisible = false;

function buildTollNameMarkers() {
  TOLL_DATA.forEach(toll => {
    const icon = L.divIcon({
      className: '',
      html: `<div class="toll-name-label">${toll.name_en}</div>`,
      iconSize: [null, null], iconAnchor: [0, -8],
    });
    const m = L.marker([toll.lat, toll.lng], { icon, zIndexOffset: 30 });
    tollNameMarkers.push({ marker: m, toll });
  });
}
buildTollNameMarkers();

function updateTollNameLabels() {
  // Rebuild labels with current-language name where available
  tollNameMarkers.forEach(({ marker, toll }) => {
    const name = getCurrentLang() === 'el' ? toll.name_gr : toll.name_en;
    const short = name.replace(/^Διόδια\s+/, '').replace(/^Toll\s+of\s+/i, '');
    marker.setIcon(L.divIcon({
      className: '',
      html: `<div class="toll-name-label">${short}</div>`,
      iconSize: [null, null], iconAnchor: [0, -8],
    }));
  });
}

document.getElementById('tollnames-btn').addEventListener('click', function() {
  tollNamesVisible = !tollNamesVisible;
  this.classList.toggle('active', tollNamesVisible);
  if (tollNamesVisible) {
    updateTollNameLabels();
    tollNameMarkers.forEach(({ marker }) => marker.addTo(map));
  } else {
    tollNameMarkers.forEach(({ marker }) => map.removeLayer(marker));
  }
});

// Re-render labels when language changes
window.addEventListener('langchange', () => {
  if (tollNamesVisible) updateTollNameLabels();
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
