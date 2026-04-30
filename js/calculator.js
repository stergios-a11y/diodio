/**
 * mydiodia — calculator.js
 * Pure pre-computed bypass logic — no AI for verdicts.
 * bypass_directions in TOLL_DATA now contains real exit/entry
 * names and coordinates from the 2026 bypass guide.
 */

// ── Slider ────────────────────────────────────────────────
const slider = document.getElementById('tv-slider');
const tvVal  = document.getElementById('tv-val');
const tvTier = document.getElementById('tv-tier');

// Map slider value (2..15) to a semantic tier so users can see the meaning
// of the number, not just the number itself.
function sliderTierKey(n) {
  if (n <= 3)  return 'bar.time.tier.hurry';
  if (n <= 6)  return 'bar.time.tier.balanced';
  if (n <= 11) return 'bar.time.tier.thrifty';
  return 'bar.time.tier.frugal';
}
function updateSliderUI() {
  const v = parseInt(slider.value);
  tvVal.textContent = slider.value;
  if (tvTier) tvTier.textContent = t(sliderTierKey(v));
  // Drive the CSS gradient stop so the "filled" portion of the track tracks
  // the current value. Without this the track would always show 50% fill.
  const min = parseFloat(slider.min) || 0;
  const max = parseFloat(slider.max) || 100;
  const pct = ((v - min) / (max - min)) * 100;
  slider.style.setProperty('--fill', pct + '%');
}
slider.addEventListener('input', updateSliderUI);
window.addEventListener('langchange', updateSliderUI);
updateSliderUI();

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

// Cache the inputs from the most recent analyze() so we can re-render the
// results panel when the language changes (verdict reasoning strings are
// language-dependent and pre-computed, so they need regeneration).
let lastAnalysis = null;

document.getElementById('rp-close').addEventListener('click', () => {
  resultsPanel.classList.remove('open');
  clearRoute();
  lastAnalysis = null;
});

// Re-render results in the new language whenever the user toggles el ⇄ en.
window.addEventListener('langchange', () => {
  if (lastAnalysis && resultsPanel.classList.contains('open')) {
    renderResults(lastAnalysis);
  }
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
// On failure, try to suggest a known city from the CITIES list before
// surfacing the raw error. Most failures are typos on city names that
// already appear in the routes matrix.
function suggestCity(name) {
  if (typeof CITIES === 'undefined' || !name) return null;
  const lower = name.toLowerCase().trim();
  if (!lower) return null;

  // Exact substring match first (handles partial names like "θεσσαλον")
  for (const c of CITIES) {
    const gr = (c.name_gr || '').toLowerCase();
    const en = (c.name_en || '').toLowerCase();
    if (gr.startsWith(lower) || en.startsWith(lower)) return c;
    if (gr.includes(lower) || en.includes(lower))   return c;
  }

  // Single-edit-distance fallback (one wrong, missing, or extra letter)
  // Cheap and good enough at this dataset size.
  const within1 = (a, b) => {
    if (a === b) return true;
    if (Math.abs(a.length - b.length) > 1) return false;
    let i = 0, j = 0, edits = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) { i++; j++; continue; }
      if (++edits > 1) return false;
      if (a.length > b.length) i++;
      else if (b.length > a.length) j++;
      else { i++; j++; }
    }
    return edits + (a.length - i) + (b.length - j) <= 1;
  };
  for (const c of CITIES) {
    if (within1((c.name_gr || '').toLowerCase(), lower)) return c;
    if (within1((c.name_en || '').toLowerCase(), lower)) return c;
  }
  return null;
}

async function geocode(name) {
  const lang = (typeof getCurrentLang === 'function') ? getCurrentLang() : 'el';
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(name + ', Greece')}&format=json&limit=1`;
  const r = await fetch(url, { headers: { 'Accept-Language': lang === 'el' ? 'el,en' : 'en' } });
  const d = await r.json();
  if (!d.length) {
    // Before giving up, try to map the typed name to a known city.
    const hit = suggestCity(name);
    if (hit) return { lat: hit.lat, lng: hit.lng };
    throw new Error(t('err.geocode', { name }));
  }
  return { lat: parseFloat(d[0].lat), lng: parseFloat(d[0].lon) };
}

// ── Geometry helpers ──────────────────────────────────────
function distToSegment(p, a, b) {
  const dx = b[0]-a[0], dy = b[1]-a[1];
  if (dx===0 && dy===0) return Math.hypot(p[0]-a[0], p[1]-a[1]);
  const t = Math.max(0, Math.min(1, ((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy)));
  return Math.hypot(p[0]-(a[0]+t*dx), p[1]-(a[1]+t*dy));
}

function tollsOnRoute(coords, threshold = 0.025) {
  // First pass: collect ALL spatially-matched tolls (frontal, bridge, AND side).
  // Side tolls cluster within the threshold of frontals at interchanges; we keep
  // them initially and decide in a second pass whether each one is actually
  // billable based on its position in the trip.
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

  // Second pass: apply the entry/transit/exit rule.
  //
  // A real motorway journey can pay at most one side toll on entry, then any
  // number of frontals while in transit, then at most one side toll on exit.
  // So a side toll is billable only if:
  //   - it's the FIRST toll on the route AND its role is "entry", OR
  //   - it's the LAST toll on the route AND its role is "exit"
  // Any side toll in the middle of the route reflects a polyline brushing past
  // an interchange the driver passed through — they paid the surrounding
  // frontals, not the side ramp. Drop those.
  //
  // Side tolls with the "wrong" role at first/last position (e.g. an "exit"
  // toll appearing first, which would mean the driver exited before entering)
  // are also dropped — that's a Mapbox geometry artifact, not a real charge.
  const lastIdx = found.length - 1;
  const billable = found.filter((entry, i) => {
    const t = entry.toll;
    if (t.type !== 'side') return true;          // frontals + bridges always count
    if (i === 0       && t.role === 'entry') return true;  // first-position entry ramp
    if (i === lastIdx && t.role === 'exit')  return true;  // last-position exit ramp
    return false;                                 // transit-position side tolls drop
  });

  return billable.map(x => x.toll);
}

// ── Side tolls payable on a bypass ────────────────────────
// When a bypass exits the motorway at one junction and re-enters at another,
// the driver may pay side tolls AT THOSE TWO ENDPOINTS:
//   - off_ramp  + side toll with role="exit"  in the same direction → paid
//   - on_ramp   + side toll with role="entry" in the same direction → paid
// Side tolls along the local-roads middle of the bypass are NOT paid because
// the driver is not on the motorway there. Side tolls in the wrong direction
// are also not paid.
//
// Returns:
//   {
//     items: [{toll, role}, ...],          // contributing side tolls
//     totals: { cat1, cat2, cat3, cat4 },  // sum per vehicle category
//     anyAtRamps: bool                     // whether there are any matches
//   }
//
// Threshold matches tollsOnRoute (0.025 ≈ 2.5 km), tight enough to avoid
// false positives at unrelated junctions and loose enough to catch ramp
// coordinates a few hundred meters off the side toll booth.
function bypassSideTollCost(toll, dirKey, dir) {
  const empty = { items: [], totals: { cat1: 0, cat2: 0, cat3: 0, cat4: 0 }, anyAtRamps: false };
  if (!dir || !dir.off_ramp || !dir.on_ramp) return empty;
  const THRESHOLD = 0.025;
  const items = [];
  TOLL_DATA.forEach(s => {
    if (s.type !== 'side') return;
    if (s.direction !== dirKey) return;
    const dOff = Math.hypot(s.lat - dir.off_ramp.lat, s.lng - dir.off_ramp.lng);
    const dOn  = Math.hypot(s.lat - dir.on_ramp.lat,  s.lng - dir.on_ramp.lng);
    if (dOff < THRESHOLD && s.role === 'exit')  items.push({ toll: s, role: 'exit' });
    else if (dOn < THRESHOLD && s.role === 'entry') items.push({ toll: s, role: 'entry' });
  });
  const totals = { cat1: 0, cat2: 0, cat3: 0, cat4: 0 };
  items.forEach(({ toll: s }) => {
    totals.cat1 += s.cat1 || 0;
    totals.cat2 += s.cat2 || 0;
    totals.cat3 += s.cat3 || 0;
    totals.cat4 += s.cat4 || 0;
  });
  return { items, totals, anyAtRamps: items.length > 0 };
}
window.bypassSideTollCost = bypassSideTollCost;

// Returns 'northbound','southbound','eastbound','westbound' based on overall movement.
// Must match the bypass_directions key naming in data/tolls.js.
function detectDirection(fromCoord, toCoord) {
  const dlat = toCoord.lat - fromCoord.lat;
  const dlng = toCoord.lng - fromCoord.lng;
  if (Math.abs(dlat) > Math.abs(dlng)) {
    return dlat > 0 ? 'northbound' : 'southbound';
  } else {
    return dlng > 0 ? 'eastbound' : 'westbound';
  }
}

// ── Verdict calculation (pure math) ──────────────────────
// Now also incorporates side tolls payable on the bypass: net savings =
// frontal price − (sum of side tolls billable at off_ramp/on_ramp). If the
// net is zero or negative, bypassing saves no money and we PAY regardless
// of the time tradeoff.
function calcVerdict(toll, catKey, timeValue, travelDirection) {
  const bd = toll.bypass_directions;
  if (!bd) {
    return { verdict: 'PAY', dir: null, reasoning: t('verdict.no.bypass') };
  }

  // Find matching direction entry. Fall back to any direction if the detected
  // travel direction has no entry (e.g., a one-direction bypass on a route
  // going the other way — caller may want to handle this differently).
  const dirKey = bd[travelDirection] ? travelDirection : Object.keys(bd)[0];
  const dir = bd[dirKey];
  if (!dir) {
    return { verdict: 'PAY', dir: null, reasoning: t('verdict.no.bypass') };
  }

  const frontalCost = toll[catKey];
  // Ferry mode (Rio-Antirrio bridge): the alternative cost is the ferry fare,
  // not a side-toll sum. Side tolls don't apply at sea piers.
  const isFerry  = dir.mode === 'ferry' && dir.fare;
  const sideInfo = isFerry
    ? { items: [], totals: dir.fare, anyAtRamps: false }
    : bypassSideTollCost(toll, dirKey, dir);
  const sideCost    = sideInfo.totals[catKey] || 0;
  const netSavings  = frontalCost - sideCost;

  // Bypass costs as much or more than the frontal — never worth bypassing.
  if (netSavings <= 0) {
    return {
      verdict: 'PAY', dir,
      reasoning: t('verdict.bypass.expensive', {
        frontal: frontalCost.toFixed(2),
        side:    sideCost.toFixed(2),
      }),
      sideInfo,
    };
  }

  const threshold = netSavings * timeValue;
  const extra     = dir.minutes;
  const margin    = threshold * 0.20;
  const sideHint  = sideInfo.anyAtRamps
    ? ' ' + t('verdict.bypass.side.suffix', { side: sideCost.toFixed(2) })
    : '';

  if (extra <= threshold - margin) {
    return {
      verdict: 'AVOID', dir,
      reasoning: t('verdict.avoid.reason', {
        exit:  dir.exit_name,
        entry: dir.entry_name,
        min:   extra,
        cost:  netSavings.toFixed(2),
      }) + sideHint,
      sideInfo,
    };
  } else if (extra <= threshold) {
    return {
      verdict: 'MARGINAL_AVOID', dir,
      reasoning: t('verdict.marginal.avoid.reason', {
        exit:  dir.exit_name,
        entry: dir.entry_name,
        min:   extra,
        cost:  netSavings.toFixed(2),
      }) + sideHint,
      sideInfo,
    };
  } else if (extra <= threshold + margin) {
    return {
      verdict: 'MARGINAL_PAY', dir,
      reasoning: t('verdict.marginal.pay.reason', {
        min:  extra,
        cost: netSavings.toFixed(2),
      }) + sideHint,
      sideInfo,
    };
  } else {
    return {
      verdict: 'PAY', dir,
      reasoning: t('verdict.pay.reason', { min: extra }) + sideHint,
      sideInfo,
    };
  }
}

// ── Verdict for a single toll, route-agnostic ─────────────
// Used by the All Tolls page advisor: picks the shortest bypass direction
// (most generous case — if even the shortest is "PAY," no direction is
// worth bypassing) and runs the standard verdict math.
//
// Exposed on window so pages.js can call it without re-importing.
window.calcTollVerdict = function(toll, catKey, timeValue) {
  const bd = toll.bypass_directions;
  if (!bd) {
    return { verdict: 'PAY', dir: null, reasoning: t('verdict.no.bypass') };
  }
  // Pick the direction with the fewest extra minutes
  let bestKey = null, bestMin = Infinity;
  Object.entries(bd).forEach(([key, d]) => {
    const m = d?.minutes ?? Infinity;
    if (m < bestMin) { bestMin = m; bestKey = key; }
  });
  if (!bestKey) {
    return { verdict: 'PAY', dir: null, reasoning: t('verdict.no.bypass') };
  }
  return calcVerdict(toll, catKey, timeValue, bestKey);
};

// ── Per-direction verdicts ────────────────────────────────
// Returns one verdict per direction in the toll's bypass_directions, so the
// All Tolls page can show e.g. "AVOID northbound · PAY southbound" instead
// of collapsing both directions into a single recommendation.
//
// Returns { directionKey: { verdict, dir } } — empty object for tolls with
// no bypass data. The dir object includes minutes, exit_name, entry_name etc.
window.calcTollVerdictsByDirection = function(toll, catKey, timeValue) {
  const bd = toll.bypass_directions;
  if (!bd) return {};
  const frontalCost = toll[catKey];
  const out         = {};
  Object.entries(bd).forEach(([key, d]) => {
    if (!d) return;
    const sideInfo   = bypassSideTollCost(toll, key, d);
    const sideCost   = sideInfo.totals[catKey] || 0;
    const netSavings = frontalCost - sideCost;
    if (netSavings <= 0) {
      out[key] = { verdict: 'PAY', dir: d, sideInfo };
      return;
    }
    const extra     = d.minutes;
    const threshold = netSavings * timeValue;
    const margin    = threshold * 0.20;
    let verdict;
    if      (extra <= threshold - margin) verdict = 'AVOID';
    else if (extra <= threshold)          verdict = 'MARGINAL_AVOID';
    else if (extra <= threshold + margin) verdict = 'MARGINAL_PAY';
    else                                  verdict = 'PAY';
    out[key] = { verdict, dir: d, sideInfo };
  });
  return out;
};

// ── Draw bypass line — the local-roads portion of an AVOID toll's bypass.
//    The motorway portions on either side are already part of the main
//    route polyline, so we only draw the deviation here. ──
function drawBypassLine(dir, label) {
  if (!dir) return;

  // Use off_ramp/on_ramp if both present; otherwise fall back to via waypoints
  let initialCoords;
  if (dir.off_ramp && dir.on_ramp) {
    // Start with placeholder straight line (will be replaced by real route)
    initialCoords = [[dir.off_ramp.lat, dir.off_ramp.lng], [dir.on_ramp.lat, dir.on_ramp.lng]];
  } else if (dir.via?.length) {
    initialCoords = dir.via.map(p => [p.lat, p.lng]);
  } else {
    return;
  }

  const layer = L.polyline(initialCoords, {
    color:     '#2a6b9e', // blue: bypass = local/free road (Greek convention)
    weight:    4,
    opacity:   dir.off_ramp && dir.on_ramp ? 0.5 : 0.85,
    dashArray: dir.off_ramp && dir.on_ramp ? '8 6' : null,
    lineCap:   'round',
    lineJoin:  'round',
  }).addTo(map);

  layer.bindTooltip(
    `🔵 ${t('bypass.tooltip', {exit: dir.exit_name, entry: dir.entry_name, min: dir.minutes})}`,
    { sticky: true, className: 'bypass-tooltip' }
  );

  bypassLayers.push(layer);

  // If we have real ramps, fetch the bypass driving route and replace the placeholder
  if (dir.off_ramp && dir.on_ramp && typeof window.fetchBypassRoute === 'function') {
    window.fetchBypassRoute(dir.off_ramp, dir.on_ramp, dir.bypass_via).then(routeCoords => {
      if (routeCoords && routeCoords.length > 1) {
        layer.setLatLngs(routeCoords);
        layer.setStyle({ opacity: 0.9, dashArray: null });
      }
    });
  }

  // Exit marker (red) — anchored on the off-ramp
  if (dir.off_ramp) {
    const ei = L.divIcon({
      className: '',
      html: `<div style="width:13px;height:13px;background:#b8502d;border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:7px;color:white;font-weight:700;font-family:sans-serif;">↙</div>`,
      iconSize: [13,13], iconAnchor: [6.5,6.5],
    });
    const em = L.marker([dir.off_ramp.lat, dir.off_ramp.lng], { icon: ei, zIndexOffset: 600 });
    em.bindTooltip(t('ramp.exit.tooltip', {name: dir.exit_name}), { className: 'bypass-tooltip' });
    em.addTo(map);
    bypassLayers.push(em);
  }

  // Entry marker (green) — anchored on the on-ramp
  if (dir.on_ramp) {
    const ni = L.divIcon({
      className: '',
      html: `<div style="width:13px;height:13px;background:#2e7a4a;border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:7px;color:white;font-weight:700;font-family:sans-serif;">↗</div>`,
      iconSize: [13,13], iconAnchor: [6.5,6.5],
    });
    const nm = L.marker([dir.on_ramp.lat, dir.on_ramp.lng], { icon: ni, zIndexOffset: 600 });
    nm.bindTooltip(t('ramp.entry.tooltip', {name: dir.entry_name}), { className: 'bypass-tooltip' });
    nm.addTo(map);
    bypassLayers.push(nm);
  }
}

// ── AI overall summary (async, optional) ─────────────────
function fetchAISummary(origin, dest, results, catKeyLabel, savings, extraMin) {
  const avoidList = results.filter(r => r.verdict === 'AVOID' || r.verdict === 'MARGINAL_AVOID').map(r => r.toll.name_en).join(', ') || 'none';
  const payList   = results.filter(r => r.verdict === 'PAY'   || r.verdict === 'MARGINAL_PAY').map(r => r.toll.name_en).join(', ') || 'none';

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

// ── Render: everything that depends on language goes here ─────
// Called from analyze() on first run, and from the langchange listener
// when the user toggles el ⇄ en after results are already on screen.
function renderResults(a) {
  // Recompute verdicts so reasoning strings are in the current language.
  // calcVerdict is pure local math + t() lookups; cheap to re-run.
  const results = a.matchedTolls.map(toll => ({
    toll,
    ...calcVerdict(toll, a.catKey, a.timeValue, a.travelDir),
  }));

  // Clear and redraw map markers + bypass lines (their popups and tooltips
  // contain language-dependent strings).
  routeMarkers.forEach(m => map.removeLayer(m));
  routeMarkers = [];
  bypassLayers.forEach(l => map.removeLayer(l));
  bypassLayers = [];

  const verdictColors = {
    PAY:            '#b8502d',
    AVOID:          '#2e7a4a',
    MARGINAL_AVOID: '#c49320',
    MARGINAL_PAY:   '#c49320',
  };
  const lang = (typeof getCurrentLang === 'function') ? getCurrentLang() : 'en';
  results.forEach(r => {
    const color = verdictColors[r.verdict] || '#555';
    const isMarginal = r.verdict === 'MARGINAL_AVOID' || r.verdict === 'MARGINAL_PAY';
    const iconChar   = r.verdict === 'PAY'   ? '€'
                     : r.verdict === 'AVOID' ? '✕'
                     : isMarginal            ? '~'
                     : '?';
    const icon  = L.divIcon({
      className: '',
      html: `<div style="width:22px;height:22px;background:${color};border:2.5px solid white;border-radius:50%;box-shadow:0 1px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:white;font-family:Inter,sans-serif;letter-spacing:-0.02em;">${iconChar}</div>`,
      iconSize: [20,20], iconAnchor: [10,10],
    });
    const m = L.marker([r.toll.lat, r.toll.lng], { icon, zIndexOffset: 1000 });
    const popupName = lang === 'el' ? r.toll.name_gr : r.toll.name_en;
    // i18n key replacement: 'MARGINAL_AVOID' -> 'verdict.marginal.avoid'
    const verdictKey = `verdict.${r.verdict.toLowerCase().replace('_', '.')}`;
    const popupVerdict = t(verdictKey);
    m.bindPopup(`
      <div class="map-popup">
        <div class="map-popup-name">${popupName}</div>
        <div class="map-popup-verdict ${r.verdict}">${popupVerdict} · €${r.toll[a.catKey].toFixed(2)}</div>
        <div class="map-popup-reason">${r.reasoning}</div>
      </div>`, { maxWidth: 220 });
    m.addTo(map);
    routeMarkers.push(m);
  });

  results.forEach(r => {
    if ((r.verdict === 'AVOID' || r.verdict === 'MARGINAL_AVOID') && r.dir) {
      drawBypassLine(r.dir, r.toll.name_en);
    }
  });

  // Stats. MARGINAL_AVOID counts as "would bypass" (AVOID side); MARGINAL_PAY
  // counts as "would pay" (PAY side). The user sees a binary decision summary
  // even when individual tolls are borderline.
  const isAvoidSide = r => r.verdict === 'AVOID' || r.verdict === 'MARGINAL_AVOID';
  const isPaySide   = r => r.verdict === 'PAY'   || r.verdict === 'MARGINAL_PAY';

  const totalCost  = results.reduce((s, r) => s + r.toll[a.catKey], 0);
  const savings    = results.filter(isAvoidSide).reduce((s, r) => s + r.toll[a.catKey], 0);
  const extraMin   = results.filter(r => isAvoidSide(r) && r.dir).reduce((s, r) => s + r.dir.minutes, 0);
  const avoidCount = results.filter(isAvoidSide).length;
  const payCount   = results.filter(isPaySide).length;

  rpTitle.textContent = `${a.origin} → ${a.dest}`;
  rpStats.innerHTML = `
    <span class="rp-stat"><span class="rp-stat-label">${t('rp.total')}</span><strong>€${totalCost.toFixed(2)}</strong></span>
    <span class="rp-stat green"><span class="rp-stat-label">${t('rp.save')}</span><strong>€${savings.toFixed(2)}</strong></span>
    <span class="rp-stat red"><span class="rp-stat-label">${t('rp.extra')}</span><strong>+${extraMin} ${t('bar.time.label2')}</strong></span>
    <span class="rp-stat-divider"></span>
    <span class="rp-stat sm"><span class="rp-stat-label">${t('rp.tolls')}</span><strong>${results.length}</strong></span>
    <span class="rp-stat sm"><span class="rp-stat-label">${t('verdict.avoid')}</span><strong>${avoidCount}</strong></span>
    <span class="rp-stat sm"><span class="rp-stat-label">${t('verdict.pay')}</span><strong>${payCount}</strong></span>`;

  let html = `<div class="rp-advice" id="rp-advice-el">${t('rp.advice.loading')}</div>`;
  html += '<div class="rp-chips">';
  results.forEach(r => {
    const bypassInfo = r.dir
      ? `${t('sp.exit.tag')}${r.dir.exit_name} · ${t('sp.entry.tag')}${r.dir.entry_name} · +${r.dir.minutes} ${t('bar.time.label2')}`
      : t('verdict.no.bypass.short');
    const verdictLabel = t(`verdict.${r.verdict.toLowerCase().replace('_', '.')}`);
    const tollName = stripTollPrefix(lang === 'el' ? r.toll.name_gr : r.toll.name_en);
    html += `
      <div class="toll-chip verdict-${r.verdict}"
        onclick="const el=this.querySelector('.chip-reason');el.style.display=el.style.display==='block'?'none':'block'">
        <span class="chip-name">${tollName}</span>
        <span class="chip-price">€${r.toll[a.catKey].toFixed(2)}</span>
        <span class="chip-verdict">${verdictLabel}</span>
        <span class="chip-reason">${r.reasoning}<br><small style="opacity:0.7">${bypassInfo}</small></span>
      </div>`;
  });
  html += '</div>';
  rpBody.innerHTML = html;
  resultsPanel.classList.add('open');

  // Re-fire AI summary in the new language. The previous fetch's then() may
  // still resolve and overwrite this one, but renderResults() resets the
  // loading text first, so worst case the user briefly sees the old summary.
  const catKeyLabel = {
    cat1: t('bar.moto').replace('🏍 ','').trim(),
    cat2: t('bar.car').replace('🚗 ','').trim(),
    cat3: t('bar.van').replace('🚐 ','').trim(),
    cat4: t('bar.truck').replace('🚛 ','').trim(),
  }[a.catKey];
  fetchAISummary(a.origin, a.dest, results, catKeyLabel, savings, extraMin);
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
  lastAnalysis = null;
  setLoading(true);

  try {
    // 1. Geocode
    const [fromCoord, toCoord] = await Promise.all([geocode(origin), geocode(dest)]);

    // 2. Detect overall travel direction
    const travelDir = detectDirection(fromCoord, toCoord);

    // 3. Main motorway route (Mapbox via map.js, with caching)
    const mainRoute = await window.fetchMainRoute(fromCoord, toCoord);
    if (!mainRoute || !mainRoute.coords?.length) throw new Error(t('err.route'));
    const routeCoords = mainRoute.coords;

    // 4. Draw main route in green (motorway = green per Greek convention)
    routeLayer = L.polyline(routeCoords, {
      color: '#2e7a4a', weight: 4, opacity: 0.6,
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

    // 6. Resolve vehicle category and stash inputs for re-render on lang toggle
    const catKey = {
      motorcycle: 'cat1', car: 'cat2', lighttruck: 'cat3', heavytruck: 'cat4',
    }[vehicle];

    lastAnalysis = { origin, dest, matchedTolls, catKey, timeValue, travelDir };

    // 7. Render everything (markers, bypass lines, panel, AI summary)
    renderResults(lastAnalysis);

  } catch (err) {
    showError(err.message);
  } finally {
    setLoading(false);
  }
}

// ── Enter key ─────────────────────────────────────────────
// Skip analyze when the city autocomplete is open with a highlighted
// suggestion — that keystroke selects the suggestion instead.
['origin', 'dest'].forEach(id => {
  document.getElementById(id).addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const dropdown = document.querySelector('.city-ac-dropdown');
    if (dropdown && !dropdown.hidden && dropdown.querySelector('.is-active')) return;
    analyze();
  });
});

// ── City autocomplete ─────────────────────────────────────
// Attaches a dropdown to #origin and #dest that suggests one of the 16
// CITIES as the user types. Match logic: case-insensitive prefix +
// substring on Greek (with tonos folded) and English names. Nothing
// here breaks existing free-text entry — Nominatim still handles
// queries for cities outside the matrix.
//
// Keyboard: ↓/↑ navigate, Enter selects highlighted (or runs analyze
// if no highlight), Esc closes, Tab closes naturally on blur.
// Mobile: dropdown opens upward (above the input) since the bottom bar
// pins to the screen bottom — opening downward would extend off-screen.
(function initCityAutocomplete() {
  if (typeof CITIES === 'undefined') return;

  // Fold Greek diacritics + lowercase. Used on both query and targets.
  function fold(s) {
    return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }

  // Pre-build a lightweight index: for each city, store folded gr/en names.
  const INDEX = CITIES.map(c => ({
    city: c,
    gr_fold: fold(c.name_gr),
    en_fold: fold(c.name_en),
  }));

  // Return up to `limit` cities matching `query`, scored:
  //   3 = prefix match, 2 = substring match, 1 = within-1-edit fuzzy.
  // Empty/whitespace query returns ALL cities (so focusing an empty
  // input reveals the full list — useful as a quick-pick).
  function findCityMatches(query, limit = 8) {
    const q = fold(query);
    if (!q) {
      return INDEX.map(({ city }) => ({ city, score: 0 })).slice(0, limit);
    }
    const out = [];
    for (const { city, gr_fold, en_fold } of INDEX) {
      let score = 0;
      if (gr_fold.startsWith(q) || en_fold.startsWith(q)) score = 3;
      else if (gr_fold.includes(q) || en_fold.includes(q)) score = 2;
      else if (within1(gr_fold, q) || within1(en_fold, q)) score = 1;
      if (score > 0) out.push({ city, score });
    }
    out.sort((a, b) => b.score - a.score);
    return out.slice(0, limit);
  }

  // Single-edit distance (insert/delete/substitute), copied semantically
  // from suggestCity above so the matcher behaves identically.
  function within1(a, b) {
    if (a === b) return true;
    if (Math.abs(a.length - b.length) > 1) return false;
    let i = 0, j = 0, edits = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) { i++; j++; continue; }
      if (++edits > 1) return false;
      if (a.length > b.length) i++;
      else if (b.length > a.length) j++;
      else { i++; j++; }
    }
    return edits + (a.length - i) + (b.length - j) <= 1;
  }

  // Build the dropdown DOM once, append to body. Repositioned per input.
  const dropdown = document.createElement('div');
  dropdown.className = 'city-ac-dropdown';
  dropdown.setAttribute('role', 'listbox');
  dropdown.hidden = true;
  document.body.appendChild(dropdown);

  // Active state: which input the dropdown is currently bound to.
  let activeInput = null;
  let activeIndex = -1;
  let currentMatches = [];
  let suppressNextOpen = false;  // set right after a selection so the synthesized 'input' doesn't re-open

  function positionDropdown() {
    if (!activeInput || dropdown.hidden) return;
    const rect = activeInput.getBoundingClientRect();
    // Open upward: bottom of dropdown sits 4px above top of input.
    dropdown.style.left = `${Math.round(rect.left)}px`;
    dropdown.style.minWidth = `${Math.round(rect.width)}px`;
    dropdown.style.bottom = `${Math.round(window.innerHeight - rect.top + 4)}px`;
    dropdown.style.top = 'auto';
  }

  function renderDropdown() {
    const lang = (typeof getCurrentLang === 'function') ? getCurrentLang() : 'el';
    if (!currentMatches.length) {
      dropdown.hidden = true;
      return;
    }
    const html = currentMatches.map(({ city }, i) => {
      const primary = lang === 'el' ? city.name_gr : city.name_en;
      const secondary = lang === 'el' ? city.name_en : city.name_gr;
      const cls = i === activeIndex ? 'city-ac-row is-active' : 'city-ac-row';
      return `<div class="${cls}" role="option" data-idx="${i}">
        <span class="city-ac-primary">${primary}</span>
        <span class="city-ac-secondary">${secondary}</span>
      </div>`;
    }).join('');
    dropdown.innerHTML = html;
    dropdown.hidden = false;
    positionDropdown();
  }

  function open(input) {
    activeInput = input;
    activeIndex = -1;
    currentMatches = findCityMatches(input.value, 8);
    renderDropdown();
  }

  function close() {
    activeInput = null;
    activeIndex = -1;
    currentMatches = [];
    dropdown.hidden = true;
  }

  function select(index) {
    const m = currentMatches[index];
    if (!m || !activeInput) return;
    const lang = (typeof getCurrentLang === 'function') ? getCurrentLang() : 'el';
    activeInput.value = lang === 'el' ? m.city.name_gr : m.city.name_en;
    suppressNextOpen = true;
    close();
    activeInput && activeInput.focus();
  }

  function moveActive(delta) {
    if (!currentMatches.length) return;
    activeIndex = (activeIndex + delta + currentMatches.length) % currentMatches.length;
    renderDropdown();
  }

  // Wire up both inputs.
  ['origin', 'dest'].forEach(id => {
    const input = document.getElementById(id);
    if (!input) return;

    input.addEventListener('focus', () => {
      if (suppressNextOpen) { suppressNextOpen = false; return; }
      open(input);
    });

    input.addEventListener('input', () => {
      if (document.activeElement !== input) return;
      open(input);
    });

    input.addEventListener('blur', () => {
      // Delay close so a click on a row registers before blur kills it.
      setTimeout(() => {
        if (activeInput === input) close();
      }, 120);
    });

    input.addEventListener('keydown', (e) => {
      if (dropdown.hidden) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); moveActive(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); moveActive(-1); }
      else if (e.key === 'Enter' && activeIndex >= 0) {
        // The analyze-on-Enter handler checks the dropdown state directly
        // and bails out when a suggestion is highlighted — so we just
        // preventDefault and run the selection.
        e.preventDefault();
        select(activeIndex);
      }
      else if (e.key === 'Escape') { e.preventDefault(); close(); input.blur(); }
    });
  });

  // Click-to-select on dropdown rows. Use mousedown so it fires before
  // the input's blur (which would close the dropdown).
  dropdown.addEventListener('mousedown', (e) => {
    const row = e.target.closest('.city-ac-row');
    if (!row) return;
    e.preventDefault();
    select(parseInt(row.dataset.idx, 10));
  });

  // Hover updates highlight.
  dropdown.addEventListener('mousemove', (e) => {
    const row = e.target.closest('.city-ac-row');
    if (!row) return;
    const idx = parseInt(row.dataset.idx, 10);
    if (idx !== activeIndex) {
      activeIndex = idx;
      // Lightweight repaint — toggle is-active classes without rebuilding HTML
      dropdown.querySelectorAll('.city-ac-row').forEach((el, i) => {
        el.classList.toggle('is-active', i === activeIndex);
      });
    }
  });

  // Click anywhere else closes the dropdown.
  document.addEventListener('mousedown', (e) => {
    if (dropdown.hidden) return;
    if (e.target === activeInput) return;
    if (dropdown.contains(e.target)) return;
    close();
  });

  // Reposition on resize / orientation change / scroll.
  window.addEventListener('resize', positionDropdown);
  window.addEventListener('orientationchange', positionDropdown);
  // Re-render on language change so labels switch live.
  window.addEventListener('langchange', () => {
    if (!dropdown.hidden) renderDropdown();
  });
})();
