/**
 * DIODIO — map.js
 * Light theme, diamond markers, hover tooltips,
 * click to inspect toll with directional bypass preview
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
        <div class="tt-name">${toll.name}</div>
        <div class="tt-sub">${toll.operator} · <em>click for bypass info</em></div>
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

// ── Inspect panel (click on toll) ─────────────────────────
let inspectLayers = []; // temporary layers shown during inspection

function clearInspect() {
  inspectLayers.forEach(l => map.removeLayer(l));
  inspectLayers = [];
}

function inspectToll(toll) {
  clearInspect();

  const bd = toll.bypass_directions;

  // Build popup HTML
  let html = `<div class="map-popup inspect-popup">
    <div class="map-popup-name">${toll.name}</div>
    <div class="inspect-hwy">${toll.highway_name}</div>
    <div class="inspect-prices">
      <span>🏍 €${toll.cat1.toFixed(2)}</span>
      <span>🚗 €${toll.cat2.toFixed(2)}</span>
      <span>🚐 €${toll.cat3.toFixed(2)}</span>
      <span>🚛 €${toll.cat4.toFixed(2)}</span>
    </div>`;

  if (!bd) {
    html += `<div class="inspect-no-bypass">⛔ No bypass available</div>`;
  } else {
    const directions = Object.entries(bd);
    html += `<div class="inspect-bypass-title">🟢 Bypass options</div>`;
    directions.forEach(([key, dir]) => {
      html += `<div class="inspect-dir">
        <div class="inspect-dir-label">${dir.label}</div>
        <div class="inspect-dir-time">+${dir.minutes} min detour</div>
      </div>`;
    });
  }

  html += `<div class="inspect-hint">Bypass routes shown on map</div></div>`;

  // Draw bypass layers for each direction
  if (bd) {
    const dirColors = ['#2d7a3a', '#1a7a5a', '#3a6a2d']; // slightly different greens per direction
    Object.entries(bd).forEach(([key, dir], i) => {
      if (!dir.via) return;
      const color = dirColors[i % dirColors.length];

      // Bypass route line
      const bypassLine = L.polyline(dir.via.map(p => [p.lat, p.lng]), {
        color,
        weight:   4,
        opacity:  0.9,
        lineCap:  'round',
        lineJoin: 'round',
        dashArray: null,
      }).addTo(map);
      bypassLine.bindTooltip(`🟢 ${dir.label} (+${dir.minutes} min)`, {
        sticky: true, className: 'bypass-tooltip',
      });
      inspectLayers.push(bypassLine);

      // Exit marker (red circle = leave motorway here)
      if (dir.exit) {
        const exitIcon = L.divIcon({
          className: '',
          html: `<div style="
            width:16px;height:16px;background:#b33a22;
            border:2px solid white;border-radius:50%;
            box-shadow:0 1px 5px rgba(0,0,0,0.3);
            display:flex;align-items:center;justify-content:center;
            font-size:8px;color:white;font-weight:700;font-family:sans-serif;
          ">↙</div>`,
          iconSize: [16,16], iconAnchor: [8,8],
        });
        const exitMarker = L.marker([dir.exit.lat, dir.exit.lng], { icon: exitIcon });
        exitMarker.bindTooltip(`Exit motorway (${dir.label})`, { className: 'bypass-tooltip' });
        exitMarker.addTo(map);
        inspectLayers.push(exitMarker);
      }

      // Entry marker (green circle = rejoin motorway here)
      if (dir.entry) {
        const entryIcon = L.divIcon({
          className: '',
          html: `<div style="
            width:16px;height:16px;background:#2d7a3a;
            border:2px solid white;border-radius:50%;
            box-shadow:0 1px 5px rgba(0,0,0,0.3);
            display:flex;align-items:center;justify-content:center;
            font-size:8px;color:white;font-weight:700;font-family:sans-serif;
          ">↗</div>`,
          iconSize: [16,16], iconAnchor: [8,8],
        });
        const entryMarker = L.marker([dir.entry.lat, dir.entry.lng], { icon: entryIcon });
        entryMarker.bindTooltip(`Rejoin motorway (${dir.label})`, { className: 'bypass-tooltip' });
        entryMarker.addTo(map);
        inspectLayers.push(entryMarker);
      }
    });

    // Draw the motorway segment between the outermost exit and entry points
    // (shows the section being bypassed in orange)
    const allVia = Object.values(bd)
      .filter(d => d.via)
      .flatMap(d => d.via);

    if (allVia.length > 0) {
      // Get the full set of via points to determine the extent of the bypass
      const allExits   = Object.values(bd).filter(d => d.exit).map(d => d.exit);
      const allEntries = Object.values(bd).filter(d => d.entry).map(d => d.entry);

      if (allExits.length > 0 && allEntries.length > 0) {
        // Draw orange dashed line for the bypassed motorway segment
        // Use the first direction's exit and last direction's entry as bounds
        const firstDir = Object.values(bd)[0];
        const lastDir  = Object.values(bd)[Object.values(bd).length - 1];

        if (firstDir.exit && lastDir.entry) {
          const bypassedSegment = L.polyline(
            [
              [firstDir.exit.lat, firstDir.exit.lng],
              [toll.lat, toll.lng],
              [lastDir.entry.lat, lastDir.entry.lng],
            ],
            {
              color:     '#c87020',
              weight:    5,
              opacity:   0.7,
              dashArray: '10 6',
              lineCap:   'round',
            }
          ).addTo(map);
          bypassedSegment.bindTooltip('🟠 Motorway segment with toll', {
            sticky: true, className: 'bypass-tooltip',
          });
          inspectLayers.push(bypassedSegment);
        }
      }
    }

    // Zoom map to show the full bypass area
    const allCoords = Object.values(bd)
      .filter(d => d.via)
      .flatMap(d => d.via.map(p => [p.lat, p.lng]));
    if (allCoords.length > 0) {
      map.fitBounds(L.latLngBounds(allCoords).pad(0.3));
    }
  }

  return html;
}

// ── CSS for inspect popup ─────────────────────────────────
const inspectStyle = document.createElement('style');
inspectStyle.textContent = `
  .inspect-popup { min-width: 200px; }
  .inspect-hwy {
    font-size: 0.62rem;
    color: var(--ink3, #9a9590);
    margin-bottom: 6px;
  }
  .inspect-prices {
    display: flex;
    gap: 8px;
    font-size: 0.68rem;
    color: var(--ink2, #5a5650);
    margin-bottom: 8px;
    flex-wrap: wrap;
    padding: 5px 7px;
    background: var(--bg2, #eeeae3);
    border-radius: 2px;
  }
  .inspect-no-bypass {
    font-size: 0.7rem;
    color: #b33a22;
    padding: 5px 0;
  }
  .inspect-bypass-title {
    font-size: 0.62rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #2d7a3a;
    margin-bottom: 5px;
    font-weight: 600;
  }
  .inspect-dir {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 7px;
    background: #e8f5eb;
    border-left: 3px solid #2d7a3a;
    margin-bottom: 4px;
    font-size: 0.68rem;
  }
  .inspect-dir-label { color: var(--ink, #1a1814); font-weight: 500; }
  .inspect-dir-time  { color: #2d7a3a; font-weight: 700; white-space: nowrap; margin-left: 8px; }
  .inspect-hint {
    font-size: 0.58rem;
    color: var(--ink3, #9a9590);
    margin-top: 6px;
    font-style: italic;
  }
`;
document.head.appendChild(inspectStyle);

// ── Build markers ─────────────────────────────────────────
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

  // Hover: show tooltip
  marker.on('mouseover', function(e) {
    tooltipEl.innerHTML = buildHoverTooltip(toll);
    tooltipEl.style.display = 'block';
    positionTooltip(e.originalEvent);
  });
  marker.on('mousemove', function(e) { positionTooltip(e.originalEvent); });
  marker.on('mouseout',  function()  { tooltipEl.style.display = 'none'; });

  // Click: open inspect panel with bypass preview
  marker.on('click', function() {
    tooltipEl.style.display = 'none';
    const popupHTML = inspectToll(toll);
    marker.bindPopup(popupHTML, {
      maxWidth: 260,
      className: 'toll-inspect-popup',
    }).openPopup();

    // Close inspect when popup closes
    marker.on('popupclose', () => {
      clearInspect();
      marker.off('popupclose');
    });
  });

  marker.addTo(map);
  allMarkers.push({ toll, marker });

  if (!markersByHighway[toll.highway]) markersByHighway[toll.highway] = [];
  markersByHighway[toll.highway].push(marker);
});

// Click on map background closes inspect
map.on('click', () => {
  clearInspect();
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
