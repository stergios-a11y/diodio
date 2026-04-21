/**
 * DIODIO — map.js
 * Initialises the Leaflet map, renders toll booth markers,
 * and handles hover tooltips.
 */

// ── Map init ─────────────────────────────────────────────
const map = L.map('map', {
  center: [38.9, 22.5],
  zoom: 7,
  minZoom: 6,
  maxZoom: 16,
  zoomControl: true,
});

// Dark CartoDB tiles
L.tileLayer(
  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19,
  }
).addTo(map);

// ── Tooltip element ───────────────────────────────────────
const tooltipEl = document.createElement('div');
tooltipEl.className = 'toll-tooltip';
tooltipEl.style.cssText = `
  position: fixed;
  z-index: 9999;
  display: none;
  pointer-events: none;
`;
document.body.appendChild(tooltipEl);

function buildTooltipHTML(toll) {
  const color = HIGHWAY_COLORS[toll.highway] || '#aaa';
  const notes = toll.notes
    ? `<div class="tooltip-notes">${toll.notes}</div>`
    : '';
  return `
    <div class="tooltip-header">
      <div>
        <div class="tooltip-name">${toll.name}</div>
        <div class="tooltip-hwy">${toll.highway_name}</div>
      </div>
      <div class="tooltip-badge" style="color:${color};border-color:${color}">
        ${toll.highway}
      </div>
    </div>
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

function positionTooltip(e) {
  const margin = 16;
  const tw = tooltipEl.offsetWidth  || 280;
  const th = tooltipEl.offsetHeight || 160;
  let x = e.clientX + margin;
  let y = e.clientY + margin;

  if (x + tw > window.innerWidth  - margin) x = e.clientX - tw - margin;
  if (y + th > window.innerHeight - margin) y = e.clientY - th - margin;

  tooltipEl.style.left = x + 'px';
  tooltipEl.style.top  = y + 'px';
}

// ── Create markers ────────────────────────────────────────
const markersByHighway = {};
const allMarkers = [];

TOLL_DATA.forEach(toll => {
  const color = HIGHWAY_COLORS[toll.highway] || '#aaa';

  const icon = L.divIcon({
    className: '',
    html: `<div class="toll-marker" style="background:${color};" data-id="${toll.id}"></div>`,
    iconSize:   [14, 14],
    iconAnchor: [ 7,  7],
  });

  const marker = L.marker([toll.lat, toll.lng], { icon, zIndexOffset: 0 });

  marker.on('mouseover', function(e) {
    tooltipEl.innerHTML = buildTooltipHTML(toll);
    tooltipEl.style.display = 'block';
    positionTooltip(e.originalEvent);
    const el = this.getElement();
    if (el) el.querySelector('.toll-marker').classList.add('active');
  });

  marker.on('mousemove', function(e) {
    positionTooltip(e.originalEvent);
  });

  marker.on('mouseout', function() {
    tooltipEl.style.display = 'none';
    const el = this.getElement();
    if (el) el.querySelector('.toll-marker').classList.remove('active');
  });

  marker.addTo(map);
  allMarkers.push({ toll, marker });

  if (!markersByHighway[toll.highway]) markersByHighway[toll.highway] = [];
  markersByHighway[toll.highway].push(marker);
});

// Keep tooltip positioned on fast mouse moves
document.addEventListener('mousemove', function(e) {
  if (tooltipEl.style.display === 'block') positionTooltip(e);
});

// ── Legend ────────────────────────────────────────────────
const legendEl = document.getElementById('legend');
const legendToggleBtn = document.getElementById('legend-toggle');
let legendVisible = true;

legendToggleBtn.addEventListener('click', () => {
  legendVisible = !legendVisible;
  legendEl.classList.toggle('hidden', !legendVisible);
  legendToggleBtn.textContent = legendVisible ? 'Hide legend' : 'Show legend';
});

// Build legend from data
const highwayCounts = {};
TOLL_DATA.forEach(t => {
  highwayCounts[t.highway] = (highwayCounts[t.highway] || 0) + 1;
});

const legendList = document.getElementById('legend-list');
const dimmedSet  = new Set();

Object.entries(highwayCounts).forEach(([hwy, count]) => {
  const color = HIGHWAY_COLORS[hwy] || '#aaa';
  const name  = TOLL_DATA.find(t => t.highway === hwy)?.highway_name || hwy;
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
