/**
 * DIODIO — calculator.js
 * Compact bottom bar, OSRM real route, toll snapping,
 * green bypass lines using forced off-motorway waypoints
 */

// ── Slider ────────────────────────────────────────────────
const slider = document.getElementById('tv-slider');
const tvVal  = document.getElementById('tv-val');
slider.addEventListener('input', () => { tvVal.textContent = slider.value; });

// ── Swap button ───────────────────────────────────────────
document.getElementById('swap-btn').addEventListener('click', () => {
  const o = document.getElementById('origin');
  const d = document.getElementById('dest');
  const tmp = o.value; o.value = d.value; d.value = tmp;
});

// ── UI helpers ────────────────────────────────────────────
const analyseBtn   = document.getElementById('analyse-btn');
const btnText      = document.getElementById('btn-text');
const errorPill    = document.getElementById('error-pill');
const resultsPanel = document.getElementById('results-panel');
const rpTitle      = document.getElementById('rp-title');
const rpStats      = document.getElementById('rp-stats');
const rpBody       = document.getElementById('rp-body');

document.getElementById('rp-close').addEventListener('click', () => {
  resultsPanel.classList.remove('open');
  clearRoute();
});

function setLoading(on) {
  analyseBtn.disabled = on;
  analyseBtn.classList.toggle('loading', on);
  btnText.textContent = on ? 'Analysing…' : 'Analyse';
}

function showError(msg) {
  errorPill.textContent = msg;
  errorPill.classList.add('visible');
}
function clearError() { errorPill.classList.remove('visible'); }

// ── Route state ───────────────────────────────────────────
let routeLayer   = null;
let bypassLayers = [];
let routeMarkers = [];

function clearRoute() {
  if (routeLayer) { map.removeLayer(routeLayer); routeLayer = null; }
  bypassLayers.forEach(l => map.removeLayer(l));
  bypassLayers = [];
  routeMarkers.forEach(m => map.removeLayer(m));
  routeMarkers = [];
}

// ── Geocode via Nominatim ─────────────────────────────────
async function geocode(name) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(name + ', Greece')}&format=json&limit=1`;
  const r = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  const d = await r.json();
  if (!d.length) throw new Error(`Could not find "${name}" on the map`);
  return { lat: parseFloat(d[0].lat), lng: parseFloat(d[0].lon) };
}

// ── OSRM routing ──────────────────────────────────────────
async function fetchOSRM(waypoints) {
  const coords = waypoints.map(w => `${w.lng},${w.lat}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
  try {
    const r = await fetch(url);
    const d = await r.json();
    if (d.code !== 'Ok') return null;
    return d.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
  } catch {
    return null;
  }
}

// ── Geometry helpers ──────────────────────────────────────
function distToSegment(p, a, b) {
  const dx = b[0]-a[0], dy = b[1]-a[1];
  if (dx===0 && dy===0) return Math.hypot(p[0]-a[0], p[1]-a[1]);
  const t = Math.max(0, Math.min(1, ((p[0]-a[0])*dx + (p[1]-a[1])*dy) / (dx*dx+dy*dy)));
  return Math.hypot(p[0]-(a[0]+t*dx), p[1]-(a[1]+t*dy));
}

function nearestRouteIdx(coords, lat, lng) {
  let best = 0, bestDist = Infinity;
  coords.forEach(([clat, clng], i) => {
    const d = Math.hypot(clat - lat, clng - lng);
    if (d < bestDist) { bestDist = d; best = i; }
  });
  return best;
}

function tollsOnRoute(coords, threshold = 0.025) {
  const found = [];
  TOLL_DATA.forEach(toll => {
    const p = [toll.lat, toll.lng];
    for (let i = 0; i < coords.length - 1; i++) {
      if (distToSegment(p, coords[i], coords[i+1]) < threshold) {
        found.push({ toll, routeIdx: i });
        break;
      }
    }
  });
  found.sort((a, b) => a.routeIdx - b.routeIdx);
  return found.map(x => x.toll);
}

// Walk along route from startIdx by ~distMeters (+forward / -backward)
function findPointAtDistance(coords, startIdx, distMeters) {
  const step   = distMeters > 0 ? 1 : -1;
  const target = Math.abs(distMeters);
  let accumulated = 0;
  let idx = startIdx;
  while (idx > 0 && idx < coords.length - 1) {
    const next = idx + step;
    if (next < 0 || next >= coords.length) break;
    const dlat = (coords[next][0] - coords[idx][0]) * 111320;
    const dlng = (coords[next][1] - coords[idx][1]) * 111320
                  * Math.cos(coords[idx][0] * Math.PI / 180);
    accumulated += Math.hypot(dlat, dlng);
    idx = next;
    if (accumulated >= target) break;
  }
  return Math.max(0, Math.min(coords.length - 1, idx));
}

// Snap a nudged point to the nearest actual road via OSRM nearest service
async function findOffMotorwayPoint(routeCoords, routeIdx, magnitude = 0.05) {
  const prev = routeCoords[Math.max(0, routeIdx - 10)];
  const next = routeCoords[Math.min(routeCoords.length - 1, routeIdx + 10)];
  const dlat = next[0] - prev[0];
  const dlng = next[1] - prev[1];
  const len  = Math.hypot(dlat, dlng) || 1;

  // Try both sides of the road
  for (const sign of [1, -1]) {
    const nudgedLat = routeCoords[routeIdx][0] + sign * (-dlng / len) * magnitude;
    const nudgedLng = routeCoords[routeIdx][1] + sign * ( dlat / len) * magnitude;
    try {
      const snapUrl = `https://router.project-osrm.org/nearest/v1/driving/${nudgedLng},${nudgedLat}?number=3`;
      const r = await fetch(snapUrl);
      const d = await r.json();
      if (d.code === 'Ok' && d.waypoints?.length > 0) {
        const wp = d.waypoints[0];
        return { lat: wp.location[1], lng: wp.location[0] };
      }
    } catch { /* continue to next side */ }
  }

  // Fallback: return unsnapped nudged point
  const nudgedLat = routeCoords[routeIdx][0] + (-dlng / len) * magnitude;
  const nudgedLng = routeCoords[routeIdx][1] + ( dlat / len) * magnitude;
  return { lat: nudgedLat, lng: nudgedLng };
}

// Draw a green bypass line through forced off-motorway waypoints
async function drawBypassSegment(fromLatLng, forcedWaypoints, toLatLng, label) {
  const waypoints = [fromLatLng, ...forcedWaypoints, toLatLng];
  const coords = await fetchOSRM(waypoints);
  if (!coords) return;

  const layer = L.polyline(coords, {
    color:    '#2d7a3a',
    weight:   4,
    opacity:  0.9,
    lineCap:  'round',
    lineJoin: 'round',
  }).addTo(map);

  layer.bindTooltip(
    `🟢 Free bypass${label ? ': skip ' + label : ''}`,
    { sticky: true, className: 'bypass-tooltip' }
  );

  bypassLayers.push(layer);
}

// ── Main analyze ──────────────────────────────────────────
async function analyze() {
  const origin    = document.getElementById('origin').value.trim();
  const dest      = document.getElementById('dest').value.trim();
  const vehicle   = document.getElementById('vehicle').value;
  const timeValue = parseInt(slider.value);

  if (!origin || !dest) { showError('Enter origin and destination'); return; }

  clearError();
  clearRoute();
  resultsPanel.classList.remove('open');
  setLoading(true);

  try {

    // 1. Geocode both endpoints
    const [fromCoord, toCoord] = await Promise.all([
      geocode(origin),
      geocode(dest),
    ]);

    // 2. Fetch main motorway route
    const routeCoords = await fetchOSRM([fromCoord, toCoord]);
    if (!routeCoords) throw new Error('Could not calculate route');

    // 3. Draw main route in blue
    routeLayer = L.polyline(routeCoords, {
      color:   '#1a4a8a',
      weight:  4,
      opacity: 0.55,
    }).addTo(map);

    map.fitBounds(routeLayer.getBounds().pad(0.15));

    // 4. Snap tolls to route
    const matchedTolls = tollsOnRoute(routeCoords);
    if (matchedTolls.length === 0) {
      showError('No tolls found on this route');
      setLoading(false);
      return;
    }

    // 5. Ask AI for bypass verdicts
    const catKey = {
      motorcycle: 'cat1',
      car:        'cat2',
      lighttruck: 'cat3',
      heavytruck: 'cat4',
    }[vehicle];

    const vehicleLabels = {
      motorcycle: 'Motorcycle (cat1)',
      car:        'Car (cat2)',
      lighttruck: 'Light truck (cat3)',
      heavytruck: 'Heavy truck (cat4)',
    };

    const hourlyRate = (60 / timeValue).toFixed(2);
    const tollList   = matchedTolls
      .map(t => `- ${t.name} (${t.highway}): €${t[catKey].toFixed(2)}`)
      .join('\n');

    const prompt = `You are a Greek toll road expert.

Route: ${origin} → ${dest}
Vehicle: ${vehicleLabels[vehicle]}
Time preference: user accepts ${timeValue} min extra driving to save €1 (time value: €${hourlyRate}/hr)

These toll booths are confirmed on the route (names and prices are correct, do NOT change them):
${tollList}

For each toll:
1. Is there a realistic free bypass road (old national road / Ethniki Odos)? If yes, approximately how many extra minutes does it add?
2. Verdict: AVOID if bypass_minutes ≤ (cost × ${timeValue}), PAY otherwise, MARGINAL if within 20% of threshold.

Respond ONLY with valid JSON, no markdown fences:
{
  "tolls": [
    {
      "name": "exact name from list above",
      "has_bypass": boolean,
      "bypass_extra_minutes": number or null,
      "verdict": "PAY" or "AVOID" or "MARGINAL",
      "reasoning": "one sentence"
    }
  ],
  "overall_advice": "1-2 sentences"
}`;

    const resp = await fetch('https://diodio-proxy.stergiosgousios.workers.dev', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model:      'claude-sonnet-4-6',
        max_tokens: 2000,
        messages:   [{ role: 'user', content: prompt }],
      }),
    });

    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error?.message || `HTTP ${resp.status}`);

    const raw = data.content.map(b => b.text || '').join('');
    let ai;
    try {
      ai = JSON.parse(raw.replace(/```json|```/g, '').trim());
    } catch {
      throw new Error('Could not parse AI response');
    }

    // 6. Merge verdicts by index
    const aiTolls = ai.tolls || [];
    const results = matchedTolls.map((toll, i) => {
      const aiData = aiTolls[i] || {
        verdict:              'PAY',
        has_bypass:           false,
        bypass_extra_minutes: null,
        reasoning:            '',
      };
      return { toll, ...aiData };
    });

    // 7. Draw verdict markers
    const verdictColors = { PAY: '#1a4a8a', AVOID: '#2d7a3a', MARGINAL: '#b8860b' };

    results.forEach(r => {
      const color = verdictColors[r.verdict] || '#555';
      const icon  = L.divIcon({
        className: '',
        html: `<div style="
          width:20px;height:20px;
          background:${color};
          border:2.5px solid white;
          border-radius:50%;
          box-shadow:0 1px 6px rgba(0,0,0,0.3);
          display:flex;align-items:center;justify-content:center;
          font-size:9px;font-weight:700;color:white;font-family:sans-serif;
        ">${r.verdict==='PAY'?'✓':r.verdict==='AVOID'?'✕':'~'}</div>`,
        iconSize:   [20, 20],
        iconAnchor: [10, 10],
      });

      const m = L.marker([r.toll.lat, r.toll.lng], { icon, zIndexOffset: 1000 });
      m.bindPopup(`
        <div class="map-popup">
          <div class="map-popup-name">${r.toll.name}</div>
          <div class="map-popup-verdict ${r.verdict}">
            ${r.verdict} · €${r.toll[catKey].toFixed(2)}
          </div>
          <div class="map-popup-reason">${r.reasoning}</div>
        </div>`, { maxWidth: 200 });
      m.addTo(map);
      routeMarkers.push(m);
    });

    // 8. Draw green bypass lines ───────────────────────────
    // For each group of consecutive AVOID tolls:
    //   - Exit the motorway 8km before the first avoided toll
    //   - Re-enter 8km after the last avoided toll
    //   - Force two waypoints perpendicular off the motorway
    //     (snapped to nearest road) so OSRM must use the
    //     parallel national road (Ethniki Odos)

    const tollRouteIdx = results.map(r =>
      nearestRouteIdx(routeCoords, r.toll.lat, r.toll.lng)
    );

    let idx = 0;
    while (idx < results.length) {
      if (results[idx].verdict === 'AVOID' && results[idx].has_bypass) {

        const groupStart = idx;
        while (
          idx < results.length &&
          results[idx].verdict === 'AVOID' &&
          results[idx].has_bypass
        ) { idx++; }
        const groupEnd = idx - 1;

        // Exit point: 8km before first avoided toll on main route
        const exitIdx  = findPointAtDistance(routeCoords, tollRouteIdx[groupStart], -8000);
        // Re-entry point: 8km after last avoided toll on main route
        const entryIdx = findPointAtDistance(routeCoords, tollRouteIdx[groupEnd],   +8000);

        const exitPt  = { lat: routeCoords[exitIdx][0],  lng: routeCoords[exitIdx][1]  };
        const entryPt = { lat: routeCoords[entryIdx][0], lng: routeCoords[entryIdx][1] };

        // Two forced waypoints just before and after the toll group,
        // nudged ~5km perpendicular off the motorway and snapped to road
        const wp1Idx = Math.max(0, tollRouteIdx[groupStart] - 3);
        const wp2Idx = Math.min(routeCoords.length - 1, tollRouteIdx[groupEnd] + 3);

        const avoidedNames = results
          .slice(groupStart, groupEnd + 1)
          .map(r => r.toll.name)
          .join(', ');

        // Async: find off-motorway waypoints then draw
        Promise.all([
          findOffMotorwayPoint(routeCoords, wp1Idx, 0.05),
          findOffMotorwayPoint(routeCoords, wp2Idx, 0.05),
        ]).then(([wp1, wp2]) => {
          drawBypassSegment(exitPt, [wp1, wp2], entryPt, avoidedNames);
        }).catch(() => {
          // If snapping fails, try without forced waypoints
          drawBypassSegment(exitPt, [], entryPt, avoidedNames);
        });

      } else {
        idx++;
      }
    }

    // 9. Results panel ─────────────────────────────────────
    const totalCost = results.reduce((s, r) => s + r.toll[catKey], 0);
    const savings   = results
      .filter(r => r.verdict === 'AVOID')
      .reduce((s, r) => s + r.toll[catKey], 0);
    const extraMin  = results
      .filter(r => r.verdict === 'AVOID' && r.bypass_extra_minutes)
      .reduce((s, r) => s + r.bypass_extra_minutes, 0);

    rpTitle.textContent = `${origin} → ${dest}`;
    rpStats.innerHTML = `
      <span class="rp-stat">Total <strong>€${totalCost.toFixed(2)}</strong></span>
      <span class="rp-stat green">Save <strong>€${savings.toFixed(2)}</strong></span>
      <span class="rp-stat red">+<strong>${extraMin} min</strong></span>`;

    let html = '';
    results.forEach(r => {
      const bypass = r.has_bypass
        ? `+${r.bypass_extra_minutes ?? '?'} min detour`
        : 'no free bypass';
      html += `
        <div class="toll-chip verdict-${r.verdict}"
          onclick="const el=this.querySelector('.chip-reason');
                   el.style.display=el.style.display==='block'?'none':'block'">
          <span class="chip-name">${r.toll.name}</span>
          <span class="chip-price">€${r.toll[catKey].toFixed(2)}</span>
          <span class="chip-verdict">${r.verdict}</span>
          <span class="chip-reason">${r.reasoning} (${bypass})</span>
        </div>`;
    });

    if (ai.overall_advice) {
      html += `<div class="rp-advice">💡 ${ai.overall_advice}</div>`;
    }

    rpBody.innerHTML = html;
    resultsPanel.classList.add('open');

  } catch (err) {
    showError(err.message);
  } finally {
    setLoading(false);
  }
}

// ── Enter key ─────────────────────────────────────────────
['origin', 'dest'].forEach(id => {
  document.getElementById(id).addEventListener('keydown', e => {
    if (e.key === 'Enter') analyze();
  });
});
