/**
 * DIODIO — calculator.js
 * Pure pre-computed bypass logic — no AI for verdicts.
 * bypass_directions in TOLL_DATA now contains real exit/entry
 * names and coordinates from the 2026 bypass guide.
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
  btnText.textContent = t(on ? 'bar.analysing' : 'bar.analyse');
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
  if (window.clearActiveRouteLayer) window.clearActiveRouteLayer();
}

// ── Geocode via Nominatim ─────────────────────────────────
async function geocode(name) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(name + ', Greece')}&format=json&limit=1`;
  const r = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  const d = await r.json();
  if (!d.length) throw new Error(`Could not find "${name}" on the map`);
  return { lat: parseFloat(d[0].lat), lng: parseFloat(d[0].lon) };
}

// ── OSRM main route ───────────────────────────────────────
async function fetchOSRM(waypoints) {
  const coords = waypoints.map(w => `${w.lng},${w.lat}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
  try {
    const r = await fetch(url);
    const d = await r.json();
    if (d.code !== 'Ok') return null;
    return d.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
  } catch { return null; }
}

// ── Geometry helpers ──────────────────────────────────────
function distToSegment(p, a, b) {
  const dx = b[0]-a[0], dy = b[1]-a[1];
  if (dx===0 && dy===0) return Math.hypot(p[0]-a[0], p[1]-a[1]);
  const t = Math.max(0, Math.min(1, ((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy)));
  return Math.hypot(p[0]-(a[0]+t*dx), p[1]-(a[1]+t*dy));
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

// ── Detect travel direction from route geometry ───────────
// Returns 'north','south','east','west' based on overall movement
function detectDirection(fromCoord, toCoord) {
  const dlat = toCoord.lat - fromCoord.lat;
  const dlng = toCoord.lng - fromCoord.lng;
  if (Math.abs(dlat) > Math.abs(dlng)) {
    return dlat > 0 ? 'north' : 'south';
  } else {
    return dlng > 0 ? 'east' : 'west';
  }
}

// ── Verdict calculation (pure math) ──────────────────────
function calcVerdict(toll, catKey, timeValue, travelDirection) {
  const bd = toll.bypass_directions;
  if (!bd) {
    return { verdict: 'PAY', dir: null, reasoning: t('verdict.no.bypass') };
  }

  // Find matching direction entry
  const dir = bd[travelDirection] || Object.values(bd)[0];
  if (!dir) {
    return { verdict: 'PAY', dir: null, reasoning: t('verdict.no.bypass') };
  }

  const cost      = toll[catKey];
  const threshold = cost * timeValue;
  const extra     = dir.minutes;
  const margin    = threshold * 0.20;

  if (extra <= threshold - margin) {
    return {
      verdict: 'AVOID', dir,
      reasoning: `Exit at ${dir.exit_name}, rejoin at ${dir.entry_name}. +${extra} min saves €${cost.toFixed(2)}.`,
    };
  } else if (extra <= threshold + margin) {
    return {
      verdict: 'MARGINAL', dir,
      reasoning: t('verdict.marginal.reason', {exit: dir.exit_name, min: extra}),
    };
  } else {
    return {
      verdict: 'PAY', dir,
      reasoning: t('verdict.pay.reason', {min: extra}),
    };
  }
}

// ── Draw bypass line — uses real OSRM route if exit/entry available,
//    falls back to legacy `via` waypoints for tolls not yet upgraded ──
function drawBypassLine(dir, label) {
  if (!dir) return;

  // Use exit/entry if both present; otherwise fall back to via waypoints
  let initialCoords;
  if (dir.exit && dir.entry) {
    // Start with placeholder straight line (will be replaced by real route)
    initialCoords = [[dir.exit.lat, dir.exit.lng], [dir.entry.lat, dir.entry.lng]];
  } else if (dir.via?.length) {
    initialCoords = dir.via.map(p => [p.lat, p.lng]);
  } else {
    return;
  }

  const layer = L.polyline(initialCoords, {
    color:     '#2e7a4a',
    weight:    4,
    opacity:   dir.exit && dir.entry ? 0.5 : 0.85,
    dashArray: dir.exit && dir.entry ? '8 6' : null,
    lineCap:   'round',
    lineJoin:  'round',
  }).addTo(map);

  layer.bindTooltip(
    `🟢 ${t('bypass.tooltip', {exit: dir.exit_name, entry: dir.entry_name, min: dir.minutes})}`,
    { sticky: true, className: 'bypass-tooltip' }
  );

  bypassLayers.push(layer);

  // If we have real ramps, fetch the OSRM driving route and replace the placeholder
  if (dir.exit && dir.entry && typeof window.fetchBypassRoute === 'function') {
    window.fetchBypassRoute(dir.exit, dir.entry, dir.bypass_via).then(routeCoords => {
      if (routeCoords && routeCoords.length > 1) {
        layer.setLatLngs(routeCoords);
        layer.setStyle({ opacity: 0.9, dashArray: null });
      }
    });
  }

  // Exit marker (red)
  if (dir.exit) {
    const ei = L.divIcon({
      className: '',
      html: `<div style="width:13px;height:13px;background:#b8502d;border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:7px;color:white;font-weight:700;font-family:sans-serif;">↙</div>`,
      iconSize: [13,13], iconAnchor: [6.5,6.5],
    });
    const em = L.marker([dir.exit.lat, dir.exit.lng], { icon: ei, zIndexOffset: 600 });
    em.bindTooltip(t('ramp.exit.tooltip', {name: dir.exit_name}), { className: 'bypass-tooltip' });
    em.addTo(map);
    bypassLayers.push(em);
  }

  // Entry marker (green)
  if (dir.entry) {
    const ni = L.divIcon({
      className: '',
      html: `<div style="width:13px;height:13px;background:#2e7a4a;border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:7px;color:white;font-weight:700;font-family:sans-serif;">↗</div>`,
      iconSize: [13,13], iconAnchor: [6.5,6.5],
    });
    const nm = L.marker([dir.entry.lat, dir.entry.lng], { icon: ni, zIndexOffset: 600 });
    nm.bindTooltip(t('ramp.entry.tooltip', {name: dir.entry_name}), { className: 'bypass-tooltip' });
    nm.addTo(map);
    bypassLayers.push(nm);
  }
}

// ── AI overall summary (async, optional) ─────────────────
function fetchAISummary(origin, dest, results, catKeyLabel, savings, extraMin) {
  const avoidList = results.filter(r => r.verdict === 'AVOID').map(r => r.toll.name_en).join(', ') || 'none';
  const payList   = results.filter(r => r.verdict === 'PAY').map(r => r.toll.name_en).join(', ') || 'none';

  fetch('https://diodio-proxy.stergiosgousios.workers.dev', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model:      'claude-sonnet-4-6',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Route ${origin} → ${dest} for a ${catKeyLabel}. Language: ${getCurrentLang() === 'el' ? 'Greek' : 'English'}.
Tolls to AVOID: ${avoidList}. Tolls to PAY: ${payList}.
Saving €${savings.toFixed(2)} at cost of ${extraMin} extra minutes.
Write 1-2 concise sentences of practical advice in the specified language.`,
      }],
    }),
  })
  .then(r => r.json())
  .then(d => {
    const text = d.content?.map(b => b.text||'').join('').trim();
    if (text) {
      const el = document.getElementById('rp-advice-el');
      if (el) el.textContent = '💡 ' + text;
    }
  })
  .catch(() => {});
}

// ── Main analyze ──────────────────────────────────────────
async function analyze() {
  const origin    = document.getElementById('origin').value.trim();
  const dest      = document.getElementById('dest').value.trim();
  const vehicle   = document.getElementById('vehicle').value;
  const timeValue = parseInt(slider.value);

  if (!origin || !dest) { showError(t('err.missing')); return; }

  clearError();
  clearRoute();
  resultsPanel.classList.remove('open');
  setLoading(true);

  try {
    // 1. Geocode
    const [fromCoord, toCoord] = await Promise.all([geocode(origin), geocode(dest)]);

    // 2. Detect overall travel direction
    const travelDir = detectDirection(fromCoord, toCoord);

    // 3. Main motorway route
    const routeCoords = await fetchOSRM([fromCoord, toCoord]);
    if (!routeCoords) throw new Error(t('err.route'));

    // 4. Draw blue main route
    routeLayer = L.polyline(routeCoords, {
      color: '#2a6b9e', weight: 4, opacity: 0.6,
    }).addTo(map);
    if (window.setActiveRouteLayer) window.setActiveRouteLayer(routeCoords);

    map.fitBounds(routeLayer.getBounds().pad(0.15));

    // 5. Snap tolls to route
    const matchedTolls = tollsOnRoute(routeCoords);
    if (matchedTolls.length === 0) {
      showError(t('err.no.tolls'));
      setLoading(false);
      return;
    }

    // 6. Calculate verdicts using pre-computed bypass data
    const catKey = {
      motorcycle: 'cat1', car: 'cat2', lighttruck: 'cat3', heavytruck: 'cat4',
    }[vehicle];

    const results = matchedTolls.map(toll => ({
      toll,
      ...calcVerdict(toll, catKey, timeValue, travelDir),
    }));

    // 7. Draw verdict markers
    const verdictColors = { PAY: '#b8502d', AVOID: '#2e7a4a', MARGINAL: '#c49320' };
    results.forEach(r => {
      const color = verdictColors[r.verdict] || '#555';
      const icon  = L.divIcon({
        className: '',
        html: `<div style="width:22px;height:22px;background:${color};border:2.5px solid white;border-radius:50%;box-shadow:0 1px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:white;font-family:Inter,sans-serif;letter-spacing:-0.02em;">${r.verdict==='PAY'?'€':r.verdict==='AVOID'?'✕':'~'}</div>`,
        iconSize: [20,20], iconAnchor: [10,10],
      });
      const m = L.marker([r.toll.lat, r.toll.lng], { icon, zIndexOffset: 1000 });
      const popupLang = (typeof getCurrentLang === 'function') ? getCurrentLang() : 'en';
      const popupName = popupLang === 'el' ? r.toll.name_gr : r.toll.name_en;
      const popupVerdict = t(`verdict.${r.verdict.toLowerCase()}`);
      m.bindPopup(`
        <div class="map-popup">
          <div class="map-popup-name">${popupName}</div>
          <div class="map-popup-verdict ${r.verdict}">${popupVerdict} · €${r.toll[catKey].toFixed(2)}</div>
          <div class="map-popup-reason">${r.reasoning}</div>
        </div>`, { maxWidth: 220 });
      m.addTo(map);
      routeMarkers.push(m);
    });

    // 8. Draw green bypass lines for AVOID tolls
    results.forEach(r => {
      if (r.verdict === 'AVOID' && r.dir) {
        drawBypassLine(r.dir, r.toll.name_en);
      }
    });

    // 9. Stats
    const totalCost = results.reduce((s, r) => s + r.toll[catKey], 0);
    const savings   = results.filter(r => r.verdict === 'AVOID').reduce((s, r) => s + r.toll[catKey], 0);
    const extraMin  = results.filter(r => r.verdict === 'AVOID' && r.dir).reduce((s, r) => s + r.dir.minutes, 0);

    // 10. Render results panel
    rpTitle.textContent = `${origin} → ${dest}`;
    const avoidCount = results.filter(r => r.verdict === 'AVOID').length;
    const payCount   = results.filter(r => r.verdict === 'PAY').length;
    rpStats.innerHTML = `
      <span class="rp-stat"><span class="rp-stat-label">${t('rp.total')}</span><strong>€${totalCost.toFixed(2)}</strong></span>
      <span class="rp-stat green"><span class="rp-stat-label">${t('rp.save')}</span><strong>€${savings.toFixed(2)}</strong></span>
      <span class="rp-stat red"><span class="rp-stat-label">${t('rp.extra')}</span><strong>+${extraMin} ${t('bar.time.label2')}</strong></span>
      <span class="rp-stat-divider"></span>
      <span class="rp-stat sm"><span class="rp-stat-label">${t('rp.tolls')}</span><strong>${results.length}</strong></span>
      <span class="rp-stat sm"><span class="rp-stat-label">${t('verdict.avoid')}</span><strong>${avoidCount}</strong></span>
      <span class="rp-stat sm"><span class="rp-stat-label">${t('verdict.pay')}</span><strong>${payCount}</strong></span>`;

    // AI advice goes FIRST, then chips
    let html = `<div class="rp-advice" id="rp-advice-el">${t('rp.advice.loading')}</div>`;
    html += '<div class="rp-chips">';
    results.forEach(r => {
      const bypassInfo = r.dir
        ? `${t('sp.exit.tag').replace('↙ ', '')}${r.dir.exit_name} · ${t('sp.entry.tag').replace('↗ ', '')}${r.dir.entry_name} · +${r.dir.minutes} ${t('bar.time.label2')}`
        : t('verdict.no.bypass.short');
      const verdictKey = `verdict.${r.verdict.toLowerCase()}`;
      const verdictLabel = t(verdictKey);
      const lang = (typeof getCurrentLang === 'function') ? getCurrentLang() : 'en';
      const tollName = stripTollPrefix(lang === 'el' ? r.toll.name_gr : r.toll.name_en);
      html += `
        <div class="toll-chip verdict-${r.verdict}"
          onclick="const el=this.querySelector('.chip-reason');el.style.display=el.style.display==='block'?'none':'block'">
          <span class="chip-name">${tollName}</span>
          <span class="chip-price">€${r.toll[catKey].toFixed(2)}</span>
          <span class="chip-verdict">${verdictLabel}</span>
          <span class="chip-reason">${r.reasoning}<br><small style="opacity:0.7">${bypassInfo}</small></span>
        </div>`;
    });
    html += '</div>';
    rpBody.innerHTML = html;
    resultsPanel.classList.add('open');

    // 11. AI summary (async, non-blocking)
    const catKeyLabel = { cat1: t('bar.moto').replace('🏍 ','').trim(), cat2: t('bar.car').replace('🚗 ','').trim(), cat3: t('bar.van').replace('🚐 ','').trim(), cat4: t('bar.truck').replace('🚛 ','').trim() }[catKey];
    fetchAISummary(origin, dest, results, catKeyLabel, savings, extraMin);

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
