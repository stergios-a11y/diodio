/**
 * DIODIO — calculator.js
 * Bottom-panel logic:
 *   • Panel collapse / expand
 *   • Time-value slider
 *   • Route analysis via Claude API
 *   • Result rendering
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

updateSlider(10); // default

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

  // Open panel if collapsed
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

  const prompt = `You are a Greek toll road expert with detailed knowledge of all toll plazas on Greek motorways as of 2024.

Route: **${origin}** → **${destination}** (Greece)
Vehicle: **${vehicleLabel}**
Time preference: The user will accept **${timeValue} minutes** of extra driving to save **€1** in tolls (implied hourly value: **€${hourlyRate}/hr**).

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
      "name": "string",
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
        model:      'claude-sonnet-4-20250514',
        max_tokens: 1500,
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

  // Route title
  html += `<div class="result-route-title">
    ${origin} <span class="arrow">→</span> ${destination}
    <span style="font-weight:400;font-size:0.65rem;color:rgba(255,255,255,0.4);margin-left:4px">~${data.total_distance_km || '?'} km</span>
  </div>`;

  // Summary bar
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

  // Toll cards
  html += `<div class="toll-results-list">`;
  for (const toll of (data.tolls || [])) {
    const bypassText = toll.has_bypass
      ? `bypass +${toll.bypass_extra_minutes ?? '?'} min`
      : 'no bypass';
    html += `<div class="result-card verdict-${toll.verdict}">
      <div class="rc-name">${toll.name}</div>
      <div class="rc-verdict">${toll.verdict === 'PAY' ? 'Pay' : toll.verdict === 'AVOID' ? 'Avoid' : 'Marginal'}</div>
      <div class="rc-meta">
        <strong>€${toll.cost_eur}</strong> · ${toll.highway} · ${bypassText}
      </div>
      <div class="rc-reason">${toll.reasoning || ''}</div>
    </div>`;
  }
  html += `</div>`;

  // Overall advice
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
