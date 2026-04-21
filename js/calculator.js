/**
 * DIODIO — calculator.js
 * Bottom-panel logic:
 *   • Panel collapse / expand
 *   • Time-value slider
 *   • Route analysis via Claude API
 *   • Result rendering
 *   • Map highlighting of matched toll booths
 */

// ── Panel collapse ────────────────────────────────────────
const panelWrapper = document.getElementById('panel-wrapper');
const panelHandle  = document.getElementById('panel-handle');
let   panelOpen    = true;

panelHandle.addEventListener('click', () => {
  panelOpen = !panelOpen;
  panelWrapper.classList.toggle('collapsed', !panelOpen);
});

// ── Time value slider ─────────────────────────────────────
const slider     = document.getElementById('tv-slider');
const tvDisplay  = document.getElementById('tv-val');
const tvHourly   = document.getElementById('tv-hourly');
const presetBtns = document.querySelectorAll('.preset');

function updateSlider(val) {
  tvDisplay.textContent = val;
  tvHourly.textContent  = (60 / val).toFixed(2);
  slider.value          = val;
  presetBtns.forEach(b => b.classList.toggle('active', parseInt(b.dataset.val) === parseInt(val)));
}

slider.addEventListener('input', () => updateSlider(slider.value));
presetBtns.forEach(btn => {
  btn.addEventListener('click', () => updateSlider(btn.dataset.val));
});
updateSlider(10);

// ── UI state helpers ──────────────────────────────────────
const analyzeBtn = document.getElementById('analyze-btn');
const btnText    = document.getElementById('btn-text');
const resultsCol = document.getElementById('results-col');
const errorBar   = document.getElementById('error-bar');

function setLoading(on) {
  analyzeBtn.disabled = on;
  analyzeBtn.classList.toggle('btn-loading', on);
  btnText.textContent = on ? 'Analysing…' : 'Analyse Route';
}

function showError(msg) {
  errorBar.textContent = msg;
  errorBar.classList.add('visible');
}
function clearError() { errorBar.classList.remove('visible'); }

function showEmpty() {
  resultsCol.innerHTML = `
    <div class="results-empty">
      <div class="results-empty-icon">⊕</div>
      Enter a route and click<br>Analyse to see results
    </div>`;
}

function showResultsLoading() {
  resultsCol.innerHTML = `
    <div class="results-loading">
      <div class="dots">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
      </div>
      <div class="loading-text">Querying toll database<br>and calculating alternatives…</div>
    </div>`;
}

// ── Match AI toll name against TOLL_DATA ──────────────────
// Returns the best matching TOLL_DATA entry or null
function matchTollToData(aiName) {
  if (!aiName) return null;
  const needle = aiName.toLowerCase().replace(/[^a-z0-9]/g, '');

  let bestMatch = null;
  let bestScore = 0;

  TOLL_DATA.forEach(t => {
    const haystack = t.name.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Exact match
    if (haystack === needle) { bestMatch = t; bestScore = 100; return; }

    // One contains the other
    if (haystack.includes(needle) || needle.includes(haystack)) {
      const score = 80 - Math.abs(haystack.length - needle.length);
      if (score > bestScore) { bestScore = score; bestMatch = t; }
      return;
    }

    // Count matching characters at start (prefix match)
    let common = 0;
    for (let i = 0; i < Math.min(needle.length, haystack.length); i++) {
      if (needle[i] === haystack[i]) common++; else break;
    }
    const score = (common / Math.max(needle.length, haystack.length)) * 60;
    if (score > bestScore && score > 20) { bestScore = score; bestMatch = t; }
  });

  return bestMatch;
}

// ── Highlight route tolls on map ──────────────────────────
let routeHighlightMarkers = [];
let routePolyline = null;

function clearRouteHighlights() {
  routeHighlightMarkers.forEach(m => map.removeLayer(m));
  routeHighlightMarkers = [];
  if (routePolyline) { map.removeLayer(routePolyline); routePolyline = null; }
}

function highlightRouteTolls(tolls) {
  clearRouteHighlights();

  const coords = [];
  const verdictColors = { PAY: '#3d5a22', AVOID: '#b33a22', MARGINAL: '#c49a2e' };

  tolls.forEach(toll => {
    const matched = matchTollToData(toll.name);
    if (!matched) return;

    coords.push([matched.lat, matched.lng]);

    const color  = verdictColors[toll.verdict] || '#aaa';
    const size   = 22;

    const icon = L.divIcon({
      className: '',
      html: `<div style="
        width:${size}px;height:${size}px;
        background:${color};
        border:3px solid white;
        border-radius:50%;
        box-shadow:0 0 0 3px ${color}, 0 0 16px ${color}99;
        display:flex;align-items:center;justify-content:center;
        font-size:9px;font-weight:700;color:white;
        font-family:sans-serif;
      ">${toll.verdict === 'PAY' ? '✓' : toll.verdict === 'AVOID' ? '✕' : '~'}</div>`,
      iconSize:   [size, size],
      iconAnchor: [size / 2, size / 2],
    });

    const marker = L.marker([matched.lat, matched.lng], { icon, zIndexOffset: 1000 });

    // Popup with verdict info
    marker.bindPopup(`
      <div style="font-family:monospace;font-size:12px;min-width:160px">
        <strong>${matched.name}</strong><br>
        <span style="color:${color};font-weight:700">${toll.verdict}</span>
        · €${toll.cost_eur}<br>
        <span style="color:#666;font-size:11px">${toll.reasoning || ''}</span>
      </div>
    `, { maxWidth: 220 });

    marker.addTo(map);
    routeHighlightMarkers.push(marker);
  });

  // Draw a line connecting the route tolls in order
  if (coords.length >= 2) {
    routePolyline = L.polyline(coords, {
      color: '#c49a2e',
      weight: 3,
      opacity: 0.6,
      dashArray: '8 6',
    }).addTo(map);
  }

  // Fit map to show all highlighted markers
  if (coords.length > 0) {
    map.fitBounds(L.latLngBounds(coords).pad(0.2));
  }
}

// ── Analyze ───────────────────────────────────────────────
async function analyze() {
  const origin      = document.getElementById('origin').value.trim();
  const destination = document.getElementById('dest').value.trim();
  const vehicle     = document.getElementById('vehicle').value;
  const timeValue   = parseInt(slider.value);

  if (!origin || !destination) {
    showError('Please enter both origin and destination.');
    return;
  }

  clearError();
  setLoading(true);
  showResultsLoading();
  clearRouteHighlights();

  if (!panelOpen) {
    panelOpen = true;
    panelWrapper.classList.remove('collapsed');
  }

  const vehicleLabels = {
    motorcycle: 'Motorcycle (Category 1)',
    car:        'Car / light vehicle (Category 2)',
    lighttruck: 'Light truck / minibus (Category 3)',
    heavytruck: 'Heavy truck (Category 4)',
  };
  const vehicleLabel = vehicleLabels[vehicle];
  const hourlyRate   = (60 / timeValue).toFixed(2);

  // Build a list of our known toll names to help the AI match them
  const knownNames = TOLL_DATA.map(t => t.name).join(', ');

  const prompt = `You are a Greek toll road expert with detailed knowledge of all toll plazas on Greek motorways as of 2024.

Route: **${origin}** → **${destination}** (Greece)
Vehicle: **${vehicleLabel}**
Time preference: The user will accept **${timeValue} minutes** of extra driving to save **€1** in tolls (implied hourly value: **€${hourlyRate}/hr**).

IMPORTANT: When naming toll plazas, use names from this official list where possible:
${knownNames}

Task:
1. Identify all toll plazas on the primary motorway route between these two cities.
2. For each toll, assess whether a free bypass road exists and its approximate extra travel time.
3. Apply the user's time-value formula: a toll is worth AVOIDING if (bypass_extra_minutes / toll_cost_eur) is less than or equal to ${timeValue}. Otherwise it is worth PAYING. If within 20% of the threshold, mark MARGINAL.
4. Summarise total costs and recommendations.

Respond ONLY with valid JSON — no markdown fences, no preamble — using this exact schema:
{
  "route_summary": "string — brief description of primary motorway used",
  "total_distance_km": number,
  "tolls": [
    {
      "name": "string — use official name from the list above where possible",
      "highway": "string — e.g. A1, A2, A8",
      "location": "string — brief location note",
      "cost_eur": number,
      "has_bypass": boolean,
      "bypass_extra_minutes": number or null,
      "verdict": "PAY" or "AVOID" or "MARGINAL",
      "reasoning": "string — 1 sentence"
    }
  ],
  "summary": {
    "total_toll_cost": number,
    "recommended_savings": number,
    "total_extra_bypass_minutes": number,
    "overall_advice": "string — 1-2 sentences"
  }
}`;

  try {
    const resp = await fetch('https://diodio-proxy.stergiosgousios.workers.dev', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        model:      'claude-sonnet-4-6',
        max_tokens: 4000,
        messages:   [{ role: 'user', content: prompt }],
      }),
    });

    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error?.message || `HTTP ${resp.status}`);

    const rawText = data.content.map(b => b.text || '').join('');
    let parsed;
    try {
      parsed = JSON.parse(rawText.replace(/```json|```/g, '').trim());
    } catch {
      throw new Error('Could not parse AI response. Raw: ' + rawText.slice(0, 200));
    }

    // Highlight matched tolls on the map
    if (parsed.tolls?.length) {
      highlightRouteTolls(parsed.tolls);
    }

    renderResults(parsed, origin, destination, timeValue);

  } catch (err) {
    showError('Analysis failed: ' + err.message);
    showEmpty();
  } finally {
    setLoading(false);
  }
}

// ── Render results ────────────────────────────────────────
function renderResults(data, origin, destination, timeValue) {
  const s = data.summary || {};

  let html = '';

  html += `<div class="result-route-title">
    ${origin} <span class="arrow">→</span> ${destination}
    <span style="font-weight:400;font-size:0.65rem;color:rgba(255,255,255,0.4);margin-left:4px">~${data.total_distance_km || '?'} km</span>
  </div>`;

  html += `<div class="summary-bar">
    <div class="sum-cell">
      <span class="sum-val" style="color:var(--gold-lt)">€${(s.total_toll_cost || 0).toFixed(2)}</span>
      <span class="sum-lbl">Total tolls</span>
    </div>
    <div class="sum-cell">
      <span class="sum-val" style="color:#6fcf97">€${(s.recommended_savings || 0).toFixed(2)}</span>
      <span class="sum-lbl">Savings possible</span>
    </div>
    <div class="sum-cell">
      <span class="sum-val" style="color:var(--rust)">${s.total_extra_bypass_minutes || 0}'</span>
      <span class="sum-lbl">Extra time</span>
    </div>
  </div>`;

  html += `<div class="toll-results-list">`;
  for (const toll of (data.tolls || [])) {
    const matched    = matchTollToData(toll.name);
    const matchedTag = matched
      ? `<span style="color:rgba(255,255,255,0.3);font-size:0.58rem"> · 📍 matched</span>`
      : `<span style="color:rgba(255,100,100,0.5);font-size:0.58rem"> · unmatched</span>`;

    const bypassText = toll.has_bypass
      ? `bypass +${toll.bypass_extra_minutes ?? '?'} min`
      : 'no bypass';

    html += `<div class="result-card verdict-${toll.verdict}">
      <div class="rc-name">${toll.name}${matchedTag}</div>
      <div class="rc-verdict">${toll.verdict === 'PAY' ? 'Pay' : toll.verdict === 'AVOID' ? 'Avoid' : 'Marginal'}</div>
      <div class="rc-meta">
        <strong>€${toll.cost_eur}</strong> · ${toll.highway} · ${bypassText}
      </div>
      <div class="rc-reason">${toll.reasoning || ''}</div>
    </div>`;
  }
  html += `</div>`;

  if (s.overall_advice) {
    html += `<div class="overall-advice">💡 ${s.overall_advice}</div>`;
  }

  resultsCol.innerHTML = html;
}

// ── Enter key triggers analyze ────────────────────────────
['origin', 'dest'].forEach(id => {
  document.getElementById(id).addEventListener('keydown', e => {
    if (e.key === 'Enter') analyze();
  });
});

// ── Init empty state ──────────────────────────────────────
showEmpty();
