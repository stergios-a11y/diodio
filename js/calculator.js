/**
 * DIODIO — calculator.js
 * Compact bottom bar, OSRM real route, toll snapping
 */

// ── Slider ────────────────────────────────────────────────
const slider  = document.getElementById('tv-slider');
const tvVal   = document.getElementById('tv-val');

slider.addEventListener('input', () => { tvVal.textContent = slider.value; });

// ── UI helpers ────────────────────────────────────────────
const analyseBtn  = document.getElementById('analyse-btn');
const btnText     = document.getElementById('btn-text');
const errorPill   = document.getElementById('error-pill');
const resultsPanel = document.getElementById('results-panel');
const rpTitle     = document.getElementById('rp-title');
const rpStats     = document.getElementById('rp-stats');
const rpBody      = document.getElementById('rp-body');

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

// ── Route drawing (OSRM) ──────────────────────────────────
let routeLayer    = null;
let routeMarkers  = [];

function clearRoute() {
  if (routeLayer)  { map.removeLayer(routeLayer);  routeLayer = null; }
  routeMarkers.forEach(m => map.removeLayer(m));
  routeMarkers = [];
}

// Geocode a city name using Nominatim
async function geocode(name) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(name + ', Greece')}&format=json&limit=1`;
  const r = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  const d = await r.json();
  if (!d.length) throw new Error(`Could not find "${name}" on the map`);
  return { lat: parseFloat(d[0].lat), lng: parseFloat(d[0].lon) };
}

// Fetch real road route from OSRM
async function fetchRoute(from, to) {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
  const r = await fetch(url);
  const d = await r.json();
  if (d.code !== 'Ok') throw new Error('Could not calculate route');
  return d.routes[0].geometry.coordinates.map(c => [c[1], c[0]]); // [lat,lng]
}

// Point-to-segment distance (degrees, good enough for snapping)
function distToSegment(p, a, b) {
  const dx = b[0]-a[0], dy = b[1]-a[1];
  if (dx===0 && dy===0) return Math.hypot(p[0]-a[0], p[1]-a[1]);
  const t = Math.max(0, Math.min(1, ((p[0]-a[0])*dx + (p[1]-a[1])*dy) / (dx*dx+dy*dy)));
  return Math.hypot(p[0]-(a[0]+t*dx), p[1]-(a[1]+t*dy));
}

// Find which TOLL_DATA entries lie close to the route polyline
function tollsOnRoute(coords, thresholdDeg = 0.025) {
  const on = [];
  TOLL_DATA.forEach(toll => {
    const p = [toll.lat, toll.lng];
    for (let i = 0; i < coords.length - 1; i++) {
      if (distToSegment(p, coords[i], coords[i+1]) < thresholdDeg) {
        on.push(toll);
        break;
      }
    }
  });
  // Sort by position along route (project onto first coord axis)
  on.sort((a,b) => {
    const pa = coords.findIndex(c => distToSegment([a.lat,a.lng], c, c) < 0.05);
    const pb = coords.findIndex(c => distToSegment([b.lat,b.lng], c, c) < 0.05);
    return pa - pb;
  });
  return on;
}

// ── Analyze ───────────────────────────────────────────────
async function analyze() {
  const origin = document.getElementById('origin').value.trim();
  const dest   = document.getElementById('dest').value.trim();
  const vehicle = document.getElementById('vehicle').value;
  const timeValue = parseInt(slider.value);

  if (!origin || !dest) { showError('Enter origin and destination'); return; }

  clearError();
  clearRoute();
  resultsPanel.classList.remove('open');
  setLoading(true);

  try {
    // 1. Geocode both cities
    const [fromCoord, toCoord] = await Promise.all([geocode(origin), geocode(dest)]);

    // 2. Get real route from OSRM
    const routeCoords = await fetchRoute(fromCoord, toCoord);

    // 3. Draw route on map
    routeLayer = L.polyline(routeCoords, {
      color: '#1a4a8a',
      weight: 4,
      opacity: 0.65,
    }).addTo(map);

    map.fitBounds(routeLayer.getBounds().pad(0.15));

    // 4. Find tolls along the route
    const matchedTolls = tollsOnRoute(routeCoords);

    if (matchedTolls.length === 0) {
      showError('No tolls found on this route');
      setLoading(false);
      return;
    }

    // 5. Ask AI for bypass info and verdicts
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
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error?.message || `HTTP ${resp.status}`);

    const raw = data.content.map(b => b.text || '').join('');
    let ai;
    try { ai = JSON.parse(raw.replace(/```json|```/g, '').trim()); }
    catch { throw new Error('Could not parse AI response'); }

    // 6. Merge AI verdicts with matched tolls (match by index, not name)
    const aiTolls = ai.tolls || [];

    const results = matchedTolls.map((toll, i) => {
      const aiData = aiTolls[i] || { verdict: 'PAY', has_bypass: false, bypass_extra_minutes: null, reasoning: '' };
      return { toll, ...aiData };
    });

    // 7. Draw verdict markers on map
    const verdictColors = { PAY: '#3d5a22', AVOID: '#b33a22', MARGINAL: '#9a6f1a' };
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
          font-size:9px;font-weight:700;color:white;
          font-family:sans-serif;
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

    // 8. Render results panel
    const totalCost = results.reduce((s, r) => s + r.toll[catKey], 0);
    const savings   = results.filter(r => r.verdict === 'AVOID').reduce((s, r) => s + r.toll[catKey], 0);
    const extraMin  = results.filter(r => r.verdict === 'AVOID' && r.bypass_extra_minutes).reduce((s, r) => s + r.bypass_extra_minutes, 0);

    rpTitle.textContent = `${origin} → ${dest}`;
    rpStats.innerHTML = `
      <span class="rp-stat">Total <strong>€${totalCost.toFixed(2)}</strong></span>
      <span class="rp-stat green">Save <strong>€${savings.toFixed(2)}</strong></span>
      <span class="rp-stat red">+<strong>${extraMin} min</strong></span>`;

    let html = '';
    results.forEach(r => {
      const bypass = r.has_bypass ? `+${r.bypass_extra_minutes ?? '?'} min` : 'no bypass';
      html += `<div class="toll-chip verdict-${r.verdict}" onclick="this.querySelector('.chip-reason').style.display = this.querySelector('.chip-reason').style.display === 'block' ? 'none' : 'block'">
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
