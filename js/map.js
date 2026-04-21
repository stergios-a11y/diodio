/**
 * DIODIO — map.js
 * Light theme map, diamond markers, hover tooltips
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
  'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19,
  }
).addTo(map);

// ── Tooltip ───────────────────────────────────────────────
const tooltipEl = document.createElement('div');
tooltipEl.className = 'toll-tooltip';
document.body.appendChild(tooltipEl);

function buildTooltip(toll) {
  const color = HIGHWAY_COLORS[toll.highway] || '#888';
  const dirIcons = { frontal: '⇄', entry: '⬆', exit: '⬇', bridge: '⇌' };
  const notes = toll.notes ? `<div class="tt-notes">${toll.notes}</div>` : '';
  return `
    <div class="tt-header">
      <div>
        <div class="tt-name">${toll.name}</div>
        <div class="tt-sub">${toll.operator}</div>
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

// ── Markers ───────────────────────────────────────────────
const markersByHighway = {};
const allMarkers = [];

TOLL_DATA.forEach(toll => {
  const color = HIGHWAY_COLORS[toll.highway] || '#888';

  const icon = L.divIcon({
    className: '',
    html: `<div class="toll-marker" style="background:${color}"></div>`,
    iconSize:   [11, 11],
    iconAnchor: [ 5.5, 5.5],
  });

  const marker = L.marker([toll.lat, toll.lng], { icon, zIndexOffset: 0 });

  marker.on('mouseover', function(e) {
    tooltipEl.innerHTML = buildTooltip(toll);
    tooltipEl.style.display = 'block';
    positionTooltip(e.originalEvent);
    this.getElement()?.querySelector('.toll-marker')?.classList.add('active');
  });
  marker.on('mousemove', function(e) { positionTooltip(e.originalEvent); });
  marker.on('mouseout',  function()  {
    tooltipEl.style.display = 'none';
    this.getElement()?.querySelector('.toll-marker')?.classList.remove('active');
  });

  marker.addTo(map);
  allMarkers.push({ toll, marker });

  if (!markersByHighway[toll.highway]) markersByHighway[toll.highway] = [];
  markersByHighway[toll.highway].push(marker);
});

// ── Legend ────────────────────────────────────────────────
const legendEl  = document.getElementById('legend');
const legendBtn = document.getElementById('legend-toggle');
let   legendVis = false;

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
    } else {
      dimmedSet.add(hwy);
      item.classList.add('dimmed');
      markersByHighway[hwy]?.forEach(m => m.setOpacity(0.1));
    }
  });

  legendList.appendChild(item);
});
