/**
 * DIODIO — map.js
 * - Accurate highway route polylines in each highway's colour
 * - Help modal
 * - Legend on by default
 * - Hover tooltip + click side panel
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

// ── Highway route polylines ───────────────────────────────
const highwayRouteLayers = {};

Object.entries(HIGHWAY_ROUTES).forEach(([hwy, coords]) => {
  const color = HIGHWAY_COLORS[hwy] || '#888';
  const layer = L.polyline(coords, {
    color:    color,
    weight:   3,
    opacity:  0.25,
    lineCap:  'round',
    lineJoin: 'round',
  }).addTo(map);
  highwayRouteLayers[hwy] = layer;
});

window.setActiveRouteLayer = function(coords) {
  if (window._activeRouteHighlight) map.removeLayer(window._activeRouteHighlight);
  window._activeRouteHighlight = L.polyline(coords, {
    color: '#1a4a8a', weight: 4, opacity: 0.75,
  }).addTo(map);
};

window.clearActiveRouteLayer = function() {
  if (window._activeRouteHighlight) {
    map.removeLayer(window._activeRouteHighlight);
    window._activeRouteHighlight = null;
  }
};

// ── Help modal ────────────────────────────────────────────
const helpModal = document.getElementById('help-modal');
const helpBtn   = document.getElementById('help-btn');
const helpClose = document.getElementById('help-close');

helpBtn.addEventListener('click', () => { helpModal.classList.add('open'); });
helpClose.addEventListener('click', () => { helpModal.classList.remove('open'); });
helpModal.addEventListener('click', (e) => {
  if (e.target === helpModal) helpModal.classList.remove('open');
});
document.getElementById('help-close-btn').addEventListener('click', () => {
  helpModal.classList.remove('open');
});

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
        <div class="tt-sub">${toll.operator} · <em>click for details</em></div>
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

// ── Side panel ────────────────────────────────────────────
let inspectLayers = [];
let sidePanelOpen = false;

function clearInspectLayers() {
  inspectLayers.forEach(l => map.removeLayer(l));
  inspectLayers = [];
}

function closeSidePanel() {
  document.getElementById('toll-side-panel')?.classList.remove('open');
  clearInspectLayers();
  sidePanelOpen = false;
}

function openSidePanel(toll) {
  clearInspectLayers();
  sidePanelOpen = true;
  map.setView([toll.lat, toll.lng], Math.max(map.getZoom(), 11), { animate: true });

  const bd    = toll.bypass_directions;
  const color = HIGHWAY_COLORS[toll.highway] || '#888';

  if (bd) {
    const dirColors = ['#2d7a3a', '#1a7a5a'];
    Object.entries(bd).forEach(([key, dir], i) => {
      if (!dir.via) return;
      const dc = dirColors[i % dirColors.length];

      const line = L.polyline(dir.via.map(p => [p.lat, p.lng]), {
        color: dc, weight: 4, opacity: 0.9, lineCap: 'round', lineJoin: 'round',
      }).addTo(map);
      line.bindTooltip(`🟢 ${dir.label} (+${dir.minutes} min)`, {
        sticky: true, className: 'bypass-tooltip',
      });
      inspectLayers.push(line);

      if (dir.exit) {
        const ei = L.divIcon({
          className: '',
          html: `<div style="width:14px;height:14px;background:#b33a22;border:2px solid white;border-radius:50%;box-shadow:0 1px 5px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:8px;color:white;font-weight:700;font-family:sans-serif;">↙</div>`,
          iconSize: [14,14], iconAnchor: [7,7],
        });
        const em = L.marker([dir.exit.lat, dir.exit.lng], { icon: ei, zIndexOffset: 500 });
        em.bindTooltip(`Exit motorway · ${dir.label}`, { className: 'bypass-tooltip' });
        em.addTo(map);
        inspectLayers.push(em);
      }

      if (dir.entry) {
        const ni = L.divIcon({
          className: '',
          html: `<div style="width:14px;height:14px;background:#2d7a3a;border:2px solid white;border-radius:50%;box-shadow:0 1px 5px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:8px;color:white;font-weight:700;font-family:sans-serif;">↗</div>`,
          iconSize: [14,14], iconAnchor: [7,7],
        });
        const nm = L.marker([dir.entry.lat, dir.entry.lng], { icon: ni, zIndexOffset: 500 });
        nm.bindTooltip(`Rejoin motorway · ${dir.label}`, { className: 'bypass-tooltip' });
        nm.addTo(map);
        inspectLayers.push(nm);
      }
    });

    const firstDir = Object.values(bd)[0];
    const lastDir  = Object.values(bd)[Object.values(bd).length - 1];
    if (firstDir?.exit && lastDir?.entry) {
      const seg = L.polyline(
        [[firstDir.exit.lat, firstDir.exit.lng],[toll.lat, toll.lng],[lastDir.entry.lat, lastDir.entry.lng]],
        { color: '#c87020', weight: 5, opacity: 0.7, dashArray: '10 6', lineCap: 'round' }
      ).addTo(map);
      seg.bindTooltip('🟠 Toll section on motorway', { sticky: true, className: 'bypass-tooltip' });
      inspectLayers.push(seg);
    }
  }

  let bypassHTML = '';
  if (!bd) {
    bypassHTML = `<div class="sp-no-bypass">⛔ No practical bypass available for this toll.</div>`;
  } else {
    bypassHTML = `<div class="sp-bypass-title">🟢 Bypass options</div>`;
    Object.entries(bd).forEach(([key, dir]) => {
      bypassHTML += `
        <div class="sp-dir">
          <div class="sp-dir-label">${dir.label}</div>
          <div class="sp-dir-time">+${dir.minutes} min detour</div>
          <div class="sp-dir-desc">Exit before toll → parallel road → rejoin after toll</div>
        </div>`;
    });
  }

  const notesHTML = toll.notes ? `<div class="sp-notes">${toll.notes}</div>` : '';

  document.getElementById('sp-content').innerHTML = `
    <div class="sp-header-inner">
      <div class="sp-hwy-badge" style="background:${color}">${toll.highway}</div>
      <div class="sp-name">${toll.name_en}</div>
      <div class="sp-name-gr">${toll.name_gr}</div>
      <div class="sp-operator">${toll.operator} · ${toll.highway_name}</div>
    </div>
    <div class="sp-section-title">Toll prices</div>
    <div class="sp-prices">
      <div class="sp-price-row"><span>🏍 Motorcycle</span><strong>€${toll.cat1.toFixed(2)}</strong></div>
      <div class="sp-price-row"><span>🚗 Car</span><strong>€${toll.cat2.toFixed(2)}</strong></div>
      <div class="sp-price-row"><span>🚐 Light truck / Van</span><strong>€${toll.cat3.toFixed(2)}</strong></div>
      <div class="sp-price-row"><span>🚛 Heavy truck</span><strong>€${toll.cat4.toFixed(2)}</strong></div>
    </div>
    <div class="sp-section-title">Direction</div>
    <div class="sp-direction">${toll.direction_label}</div>
    ${notesHTML}
    <div class="sp-section-title">Bypass</div>
    ${bypassHTML}
  `;

  document.getElementById('toll-side-panel').classList.add('open');
}

// ── Markers ───────────────────────────────────────────────
const markersByHighway = {};
const allMarkers = [];

TOLL_DATA.forEach(toll => {
  const color = HIGHWAY_COLORS[toll.highway] || '#888';
  const icon = L.divIcon({
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

map.on('click', () => { closeSidePanel(); });
document.getElementById('sp-close').addEventListener('click', closeSidePanel);

// ── Legend ────────────────────────────────────────────────
const legendEl  = document.getElementById('legend');
const legendBtn = document.getElementById('legend-toggle');
let   legendVis = true;

legendEl.classList.remove('hidden');
legendBtn.textContent = 'Hide legend';

legendBtn.addEventListener('click', () => {
  legendVis = !legendVis;
  legendEl.classList.toggle('hidden', !legendVis);
  legendBtn.textContent = legendVis ? 'Hide legend' : 'Legend';
});

const highwayCounts = {};
TOLL_DATA.forEach(t => { highwayCounts[t.highway] = (highwayCounts[t.highway] || 0) + 1; });

const legendList = document.getElementById('legend-list');
const dimmedSet  = new Set();

Object.entries(highwayCounts).forEach(([hwy, count]) => {
  const color     = HIGHWAY_COLORS[hwy] || '#888';
  const entry     = TOLL_DATA.find(t => t.highway === hwy);
  const shortName = (entry?.highway_name || hwy).split('(')[0].trim();

  const item = document.createElement('div');
  item.className = 'legend-item';
  item.innerHTML = `
    <div class="legend-dot" style="background:${color}"></div>
    <span>${shortName}</span>
    <span class="legend-count">${count}</span>`;

  item.addEventListener('click', () => {
    if (dimmedSet.has(hwy)) {
      dimmedSet.delete(hwy);
      item.classList.remove('dimmed');
      markersByHighway[hwy]?.forEach(m => m.setOpacity(1));
      if (highwayRouteLayers[hwy]) highwayRouteLayers[hwy].setStyle({ opacity: 0.25 });
    } else {
      dimmedSet.add(hwy);
      item.classList.add('dimmed');
      markersByHighway[hwy]?.forEach(m => m.setOpacity(0.1));
      if (highwayRouteLayers[hwy]) highwayRouteLayers[hwy].setStyle({ opacity: 0.03 });
    }
  });

  legendList.appendChild(item);
});
