/**
 * DIODIO — map.js
 * Initialises the Leaflet map, renders toll booth markers
 * with shape-coded types, and handles hover tooltips
 * showing per-direction info.
 */

// ── Map init ──────────────────────────────────────────────
const map = L.map('map', {
  center: [38.9, 22.5],
  zoom: 7,
  minZoom: 6,
  maxZoom: 16,
  zoomControl: true,
});

L.tileLayer(
  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19,
  }
).addTo(map);

// ── Floating tooltip element ──────────────────────────────
const tooltipEl = document.createElement('div');
tooltipEl.className = 'toll-tooltip';
tooltipEl.style.cssText = 'position:fixed;z-index:9999;display:none;pointer-events:none;';
document.body.appendChild(tooltipEl);

// ── Marker HTML by type ───────────────────────────────────
function markerHTML(color, type) {
  switch (type) {
    case 'entry':
      // upward triangle
      return `<div class="toll-marker tm-entry" style="
        width:0;height:0;
        border-left:8px solid transparent;
        border-right:8px solid transparent;
        border-bottom:14px solid ${color};
        background:none;border-radius:0;transform:none;
        filter:drop-shadow(0 0 3px ${color}88);
      "></div>`;
    case 'exit':
      // downward triangle
      return `<div class="toll-marker tm-exit" style="
        width:0;height:0;
        border-left:8px solid transparent;
        border-right:8px solid transparent;
        border-top:14px solid ${color};
        background:none;border-radius:0;transform:none;
        filter:drop-shadow(0 0 3px ${color}88);
      "></div>`;
    case 'bridge':
      // circle
      return `<div class="toll-marker tm-bridge" style="
        width:13px;height:13px;
        background:${color};
        border-radius:50%;transform:none;
        border:2px solid rgba(0,0,0,0.5);
        box-shadow:0 0 6px ${color}99;
      "></div>`;
    default:
      // frontal = rotating diamond (default)
      return `<div class="toll-marker tm-frontal" style="
        width:12px;height:12px;
        background:${color};
        transform:rotate(45deg);
        border:2px solid rgba(0,0,0,0.5);
      "></div>`;
  }
}

// ── Direction badge ───────────────────────────────────────
function directionBadge(type, label) {
  const icons = { frontal: '⇄', entry: '⬆', exit: '⬇', bridge: '⇌' };
  const colors = {
    frontal: 'rgba(255,255,255,0.12)',
    entry:   'rgba(34,197,94,0.2)',
    exit:    'rgba(239,68,68,0.2)',
    bridge:  'rgba(168,85,247,0.2)',
  };
  const borders = {
    frontal: 'rgba(255,255,255,0.2)',
    entry:   'rgba(34,197,94,0.5)',
    exit:    'rgba(239,68,68,0.5)',
    bridge:  'rgba(168,85,247,0.5)',
  };
  return `<div class="tooltip-direction" style="
    background:${colors[type]||colors.frontal};
    border:1px solid ${borders[type]||borders.frontal};
    padding:5px 10px;
    font-size:0.62rem;
    letter-spacing:0.05em;
    color:rgba(255,255,255,0.75);
    display:flex;align-items:center;gap:6px;
  ">
    <span style="font-size:0.85rem">${icons[type]||'⇄'}</span>
    <span>${label}</span>
  </div>`;
}

// ── Tooltip HTML builder ──────────────────────────────────
function buildTooltipHTML(toll) {
  const color  = HIGHWAY_COLORS[toll.highway] || '#aaa';
  const notes  = toll.notes
    ? `<div class="tooltip-notes">${toll.notes}</div>`
    : '';

  const typeLabel = {
    frontal: 'Frontal station',
    entry:   'Entry ramp',
    exit:    'Exit ramp',
    bridge:  'Bridge / Tunnel',
  }[toll.type] || toll.type;

  return `
    <div class="tooltip-header">
      <div>
        <div class="tooltip-name">${toll.name}</div>
        <div class="tooltip-hwy">${toll.highway_name}</div>
        <div style="font-size:0.58rem;color:rgba(255,255,255,0.35);margin-top:2px;letter-spacing:0.06em">${toll.operator} · ${typeLabel}</div>
      </div>
      <div class="tooltip-badge" style="color:${color};border-color:${color}">
        ${toll.highway}
      </div>
    </div>
    ${directionBadge(toll.type, toll.direction_label)}
    <div class="tooltip-prices">
      <div class="price-cell">
        <div class="vehicle-icon">🏍</div>
        <div class="vehicle-label">Motorcycle</div>
        <div class="price-val"><span class="eur">€</span>${toll.cat1.toFixed(2)}</div>
      </div>
      <div class="price-cell">
        <div class="vehicle-icon">🚗</div>
        <div class="vehicle-label">Car</div>
        <div class="price-val"><span class="eur">€</span>${toll.cat2.toFixed(2)}</div>
      </div>
      <div class="price-cell">
        <div class="vehicle-icon">🚐</div>
        <div class="vehicle-label">Light truck</div>
        <div class="price-val"><span class="eur">€</span>${toll.cat3.toFixed(2)}</div>
      </div>
    </div>
    ${notes}
  `;
}

// ── Tooltip positioning ───────────────────────────────────
function positionTooltip(e) {
  const margin = 16;
  const tw = tooltipEl.offsetWidth  || 280;
  const th = tooltipEl.offsetHeight || 180;
  let x = e.clientX + margin;
  let y = e.clientY + margin;
  if (x + tw > window.innerWidth  - margin) x = e.clientX - tw - margin;
  if (y + th > window.innerHeight - margin) y = e.clientY - th - margin;
  tooltipEl.style.left = x + 'px';
  tooltipEl.style.top  = y + 'px';
}

document.addEventListener('mousemove', e => {
  if (tooltipEl.style.display === 'block') positionTooltip(e);
});

// ── Build markers ─────────────────────────────────────────
const markersByHighway = {};
const allMarkers = [];

TOLL_DATA.forEach(toll => {
  const color = HIGHWAY_COLORS[toll.highway] || '#aaa';
  const html  = markerHTML(color, toll.type);

  // icon size varies by type
  const sizes = {
    frontal: [16, 16],
    entry:   [16, 14],
    exit:    [16, 14],
    bridge:  [14, 14],
  };
  const sz = sizes[toll.type] || [14, 14];

  const icon = L.divIcon({
    className: '',
    html,
    iconSize:   sz,
    iconAnchor: [sz[0] / 2, sz[1] / 2],
  });

  const marker = L.marker([toll.lat, toll.lng], { icon, zIndexOffset: 0 });

  marker.on('mouseover', function(e) {
    tooltipEl.innerHTML = buildTooltipHTML(toll);
    tooltipEl.style.display = 'block';
    positionTooltip(e.originalEvent);
  });

  marker.on('mousemove', function(e) {
    positionTooltip(e.originalEvent);
  });

  marker.on('mouseout', function() {
    tooltipEl.style.display = 'none';
  });

  marker.addTo(map);
  allMarkers.push({ toll, marker });

  if (!markersByHighway[toll.highway]) markersByHighway[toll.highway] = [];
  markersByHighway[toll.highway].push(marker);
});

// ── Legend toggle ─────────────────────────────────────────
const legendEl        = document.getElementById('legend');
const legendToggleBtn = document.getElementById('legend-toggle');
let   legendVisible   = true;

legendToggleBtn.addEventListener('click', () => {
  legendVisible = !legendVisible;
  legendEl.classList.toggle('hidden', !legendVisible);
  legendToggleBtn.textContent = legendVisible ? 'Hide legend' : 'Show legend';
});

// ── Build legend ──────────────────────────────────────────
const highwayCounts = {};
TOLL_DATA.forEach(t => {
  highwayCounts[t.highway] = (highwayCounts[t.highway] || 0) + 1;
});

const legendList = document.getElementById('legend-list');
const dimmedSet  = new Set();

Object.entries(highwayCounts).forEach(([hwy, count]) => {
  const color     = HIGHWAY_COLORS[hwy] || '#aaa';
  const name      = TOLL_DATA.find(t => t.highway === hwy)?.highway_name || hwy;
  const shortName = name.split('(')[0].trim();

  const item = document.createElement('div');
  item.className = 'legend-item';
  item.innerHTML = `
    <div class="legend-dot" style="background:${color}"></div>
    <span>${shortName}</span>
    <span class="legend-count">${count}</span>
  `;

  item.addEventListener('click', () => {
    if (dimmedSet.has(hwy)) {
      dimmedSet.delete(hwy);
      item.classList.remove('dimmed');
      markersByHighway[hwy]?.forEach(m => m.setOpacity(1));
    } else {
      dimmedSet.add(hwy);
      item.classList.add('dimmed');
      markersByHighway[hwy]?.forEach(m => m.setOpacity(0.08));
    }
  });

  legendList.appendChild(item);
});

// ── Marker type key ───────────────────────────────────────
const typeKeyEl = document.getElementById('type-key');
if (typeKeyEl) {
  const types = [
    { shape: '◆', label: 'Frontal (both directions)' },
    { shape: '▲', label: 'Entry ramp' },
    { shape: '▼', label: 'Exit ramp' },
    { shape: '●', label: 'Bridge / Tunnel' },
  ];
  types.forEach(t => {
    const row = document.createElement('div');
    row.className = 'legend-item';
    row.style.cursor = 'default';
    row.innerHTML = `<span style="font-size:0.8rem;width:10px;text-align:center">${t.shape}</span><span>${t.label}</span>`;
    typeKeyEl.appendChild(row);
  });
}
