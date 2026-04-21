/**
 * DIODIO — calculator.js
 * Compact bottom bar, OSRM real route, toll snapping,
 * bypass route drawing in green
 */

// ── Slider ────────────────────────────────────────────────
const slider = document.getElementById('tv-slider');
const tvVal  = document.getElementById('tv-val');
slider.addEventListener('input', () => { tvVal.textContent = slider.value; });

// ── Swap button ───────────────────────────────────────────
document.getElementById('swap-btn').addEventListener('click', () => {
  const originEl = document.getElementById('origin');
  const destEl   = document.getElementById('dest');
  const tmp = originEl.value;
  originEl.value = destEl.value;
  destEl.value   = tmp;
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

// ── Route drawing ─────────────────────────────────────────
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

// Geocode via Nominatim
async function geocode(name) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(name + ', Greece')}&format=json&limit=1`;
  const r = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  const d = await r.json();
  if (!d.length) throw new Error(`Could not find "${name}" on the map`);
  return { lat: parseFloat(d[0].lat), lng: parseFloat(d[0].lon) };
}

// Fetch route from OSRM — returns { coords, legs }
async function fetchRoute(from, to, avoidHighways = false) {
  const profile = avoidHighways ? 'driving' : 'driving';
  // For bypass we pass exclude=motorway hint
  const exclude = avoidHighways ? '&exclude=motorway' : '';
  const url = `https://router.project-osrm.org/route/v1/${profile}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson${exclude}`;
  const r = await fetch(url);
  const d = await r.json();
  if (d.code !== 'Ok') throw new Error('Could not calculate route');
  return d.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
}

// Point-to-segment distance in degrees
function distToSegment(p, a, b) {
  const dx = b[0]-a[0], dy = b[1]-a[1];
  if (dx===0 && dy===0) return Math.hypot(p[0]-a[0], p[1]-a[1]);
  const t = Math.max(0, Math.min(1, ((p[0]-a[0])*dx + (p[1]-a[1])*dy) / (dx*dx+dy*dy)));
  return Math.hypot(p[0]-(a[0]+t*dx), p[1]-(a[1]+t*dy));
}

// Find tolls near the route polyline
function tollsOnRoute(coords, threshold = 0.025) {
  const on = [];
  TOLL_DATA.forEach(toll => {
    const p = [toll.lat, toll.lng];
    for (let i = 0; i < coords.length - 1; i++) {
      if (distToSegment(p, coords[i], coords[i+1]) < threshold) {
        // Record the index along the route for ordering
        on.push({ toll, routeIdx: i });
        break;
      }
    }
  });
  on.sort((a, b) => a.routeIdx - b.routeIdx);
  return on.map(x => x.toll);
}

// Get nearest point index on route to a coord
function nearestIdx(coords, lat, lng) {
  let best = 0, bestDist = Infinity;
  coords.forEach(([clat, clng], i) => {
    const d = Math.hypot(clat - lat, clng - lng);
    if (d < bestDist) { bestDist = d; best = i; }
  });
  return best;
}

// Draw bypass route between two toll coords avoiding motorways
async function drawBypass(tollA, tollB) {
  try {
    const from = { lat: tollA.lat, lng: tollA.lng };
    const to   = { lat: tollB.lat, lng: tollB.lng };
    const bypassCoords = await fetchRoute(from, to, true);

    const layer = L.polyline(bypassCoords, {
      color:   '#2d7a3a',
      weight:  4,
      opacity: 0.8,
      dashArray: '1 6',
      lineCap: 'round',
    }).addTo(map);

    layer.bindTooltip('🟢 Free bypass', { sticky: true, className: 'bypass-tooltip' });
    bypassLayers.push(layer);
  } catch (e) {
    // bypass fetch failed silently — not critical
  }
}

// ── Analyze ───────────────────────────────────────────────
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
    // 1. Geocode
    const [fromCoord, toCoord] = await Promise.all([geocode(origin), geocode(dest)]);

    // 2. Main route
    const routeCoords = await fetchRoute(fromCoord, toCoord);

    // 3. Draw main route (blue)
    routeLayer = L.polyline(routeCoords, {
      color:   '#1a4a8a',
      weight:  4,
      opacity: 0.6,
    }).addTo(map);

    map.fitBounds(routeLayer.getBounds().pad(0.15));

    // 4. Find tolls on route
    const matchedTolls = tollsOnRoute(routeCoords);
    if (matchedTolls.length === 0) {
      showError('No tolls found on this route');
      setLoading(false);
      return;
    }

    // 5. Ask AI for bypass info
    const vehicleLabels = {
      motorcycle: 'Motorcycle (cat1)',
      car:        'Car (cat2)',
      lighttruck: 'Light truck (cat3)',
      heavytruck: 'Heavy truck (cat4)',
    };
    const catKey = { motorcycle:'cat1', car:'cat2', lighttruck:'cat3', heavytruck:'cat4' }[vehicle];
    const hourlyRate = (60 / timeValue).toFixed(2);

    const tollList = matchedTolls.map(t =>
      `- ${t.name} (${t.highway}): €${t[catKey].toFixed(2)}`
    ).join('\n');

    const prompt = `You are a Greek toll road expert.

Route: ${origin} → ${dest}
Vehicle: ${vehicleLabels[vehicle]}
Time preference: user accepts ${timeValue} min extra driving to save €1 (time value: €${hourlyRate}/hr)

These toll booths are confirmed on the route (names and prices are correct, do NOT change them):
${tollList}

For each toll:
1. Is there a realistic free bypass? If yes, how many extra minutes?
2. Verdict: AVOID if bypass_minutes ≤ (cost × ${timeValue}), PAY otherwise, MARGINAL if within 20%.

Respond ONLY with valid JSON, no markdown:
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
      method: 'POST',
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
    try { ai = JSON.parse(raw.replace(/```json|```/g, '').trim()); }
    catch { throw new Error('Could not parse AI response'); }

    // 6. Merge by index
    const aiTolls = ai.tolls || [];
    const results = matchedTolls.map((toll, i) => {
      const aiData = aiTolls[i] || { verdict: 'PAY', has_bypass: false, bypass_extra_minutes: null, reasoning: '' };
      return { toll, ...aiData };
    });

    // 7. Draw verdict markers
    const verdictColors = { PAY: '#1a4a8a', AVOID: '#2d7a3a', MARGINAL: '#b8860b' };
    results.forEach(r => {
      const color = verdictColors[r.verdict] || '#555';
      const icon = L.divIcon({
        className: '',
        html: `<div style="
          width:20px;height:20px;
          background:${color};
          border:2.5px solid white;
          border-radius:50%;
          box-shadow:0 1px 6px rgba(0,0,0,0.25);
          display:flex;align-items:center;justify-content:center;
          font-size:9px;font-weight:700;color:white;font-family:sans-serif;
        ">${r.verdict === 'PAY' ? '✓' : r.verdict === 'AVOID' ? '✕' : '~'}</div>`,
        iconSize:   [20, 20],
        iconAnchor: [10, 10],
      });

      const m = L.marker([r.toll.lat, r.toll.lng], { icon, zIndexOffset: 1000 });
      m.bindPopup(`
        <div class="map-popup">
          <div class="map-popup-name">${r.toll.name}</div>
          <div class="map-popup-verdict ${r.verdict}">${r.verdict} · €${r.toll[catKey].toFixed(2)}</div>
          <div class="map-popup-reason">${r.reasoning}</div>
        </div>`, { maxWidth: 200 });
      m.addTo(map);
      routeMarkers.push(m);
    });

    // 8. Draw bypass routes for AVOID tolls
    // Group consecutive AVOID tolls and draw bypass between the toll before and after the group
    const avoidGroups = [];
    let currentGroup = null;

    results.forEach((r, i) => {
      if (r.verdict === 'AVOID' && r.has_bypass) {
        if (!currentGroup) {
          // Start of a new group — anchor from previous toll or route start
          const prevToll = i > 0 ? results[i-1].toll : null;
          currentGroup = { start: prevToll, tolls: [r], endIdx: i };
        } else {
          currentGroup.tolls.push(r);
          currentGroup.endIdx = i;
        }
      } else {
        if (currentGroup) {
          // End of group — anchor to this toll
          currentGroup.end = r.toll;
          avoidGroups.push(currentGroup);
          currentGroup = null;
        }
      }
    });
    // Close any open group at end of route
    if (currentGroup) {
      currentGroup.end = null;
      avoidGroups.push(currentGroup);
    }

    // Draw bypass for each group
    for (const group of avoidGroups) {
      const startPt = group.start
        ? { lat: group.start.lat, lng: group.start.lng }
        : fromCoord;
      const endPt = group.end
        ? { lat: group.end.lat, lng: group.end.lng }
        : toCoord;
      await drawBypass(startPt, endPt);
    }

    // 9. Results panel
    const totalCost = results.reduce((s, r) => s + r.toll[catKey], 0);
    const savings   = results.filter(r => r.verdict === 'AVOID').reduce((s, r) => s + r.toll[catKey], 0);
    const extraMin  = results.filter(r => r.verdict === 'AVOID' && r.bypass_extra_minutes)
                             .reduce((s, r) => s + r.bypass_extra_minutes, 0);

    rpTitle.textContent = `${origin} → ${dest}`;
    rpStats.innerHTML = `
      <span class="rp-stat">Total <strong>€${totalCost.toFixed(2)}</strong></span>
      <span class="rp-stat green">Save <strong>€${savings.toFixed(2)}</strong></span>
      <span class="rp-stat red">+<strong>${extraMin} min</strong></span>`;

    let html = '';
    results.forEach(r => {
      const bypass = r.has_bypass ? `+${r.bypass_extra_minutes ?? '?'} min` : 'no bypass';
      html += `<div class="toll-chip verdict-${r.verdict}"
        onclick="this.querySelector('.chip-reason').style.display = this.querySelector('.chip-reason').style.display === 'block' ? 'none' : 'block'">
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
