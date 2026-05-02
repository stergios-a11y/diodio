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

// Pill mode references — present whether or not pill mode is active. We
// always update them so swapping between modes is a pure CSS toggle.
const tvControl    = document.getElementById('tv-control');
const tvPill       = document.getElementById('tv-pill');
const tvPillNum    = document.getElementById('tv-pill-num');
const tvPopover    = document.getElementById('tv-popover');
const tvPopoverSlot= document.getElementById('tv-popover-slot');
const tvPopoverVal = document.getElementById('tv-popover-val');
const tvPopoverTier= document.getElementById('tv-popover-tier');
const tvCompact    = document.querySelector('.tv-compact');   // prose-mode home for the slider

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

  // Pill-mode mirrors: the pill always shows the current number, and when
  // the popover is open its value pill + tier line are kept in sync too.
  if (tvPillNum)     tvPillNum.textContent     = slider.value;
  if (tvPopoverVal)  tvPopoverVal.textContent  = slider.value;
  if (tvPopoverTier) tvPopoverTier.textContent = t(sliderTierKey(v));

  // Drive the CSS gradient stop so the "filled" portion of the track tracks
  // the current value. Without this the track would always show 50% fill.
  const min = parseFloat(slider.min) || 0;
  const max = parseFloat(slider.max) || 100;
  const pct = ((v - min) / (max - min)) * 100;
  slider.style.setProperty('--fill', pct + '%');
  // Color the fill: green at the left (time-sensitive / "hurry"), shifting
  // through amber to red as the user slides right ("frugal"). The hue ramp
  // visually communicates "you're tolerating more delay for cost savings."
  // 120° = green, 60° = yellow, 30° = orange, 10° = red. Stop at 10° (not 0°)
  // so the color stays warm-red instead of going pure red which can feel
  // alarming. Saturation/lightness held constant for a smooth ramp.
  const hue = 120 - (pct / 100) * 110;   // 120 → 10 across 0-100%
  const fillColor = `hsl(${hue.toFixed(0)}, 65%, 45%)`;
  // Set on the parent so both the slider track AND the value pill (sibling
  // elements within .tv-compact) can read the same CSS variable. Also set
  // on .tv-control so pill mode's icon + popover val pill use the same hue.
  const compactParent = slider.closest('.tv-compact') || slider;
  compactParent.style.setProperty('--fill-color', fillColor);
  if (tvControl) tvControl.style.setProperty('--fill-color', fillColor);
  slider.style.setProperty('--fill-color', fillColor);  // also on slider for the gradient
}
slider.addEventListener('input', updateSliderUI);
window.addEventListener('langchange', updateSliderUI);
updateSliderUI();

// ── Tolerance prose ⇄ pill mode ──────────────────────────────────────
// On first visit, the bottom-bar shows the full prose explanation of the
// tolerance setting. After the user changes the slider once, we switch
// the bar to pill mode (a small button + number that opens a popover)
// and persist that choice in localStorage so returning visitors skip
// straight to the compact UI. The slider element itself moves between
// .tv-compact (prose mode) and .tv-popover-slot (pill mode) via
// appendChild — this keeps it as a single DOM element with a single
// set of event listeners. See style.css for the visual rules.
const TOLERANCE_TIP_KEY = 'mydiodia.tip.tolerance.v1';

function setPillMode(on) {
  if (!tvControl) return;
  tvControl.classList.toggle('is-pill-mode', !!on);
  if (on) {
    // Slider's home in pill mode is the popover slot. We don't actually
    // mount it there until the popover opens (see openPopover) — until
    // then the slider sits in the popover slot but invisible because
    // the popover container is [hidden]. This keeps event listeners
    // attached and CSS variables flowing during the transition.
    if (tvPopoverSlot && slider.parentElement !== tvPopoverSlot) {
      tvPopoverSlot.appendChild(slider);
    }
  } else {
    // Move slider back to the prose home.
    if (tvCompact && slider.parentElement !== tvCompact) {
      tvCompact.appendChild(slider);
    }
  }
}

function openPopover() {
  if (!tvPopover || !tvPill) return;
  tvPopover.hidden = false;
  tvPill.setAttribute('aria-expanded', 'true');
  // Defer outside-click handler attach by one tick so the click that
  // opened the popover doesn't immediately close it.
  setTimeout(() => {
    document.addEventListener('click', onOutsideClick);
    document.addEventListener('keydown', onPopoverKey);
  }, 0);
}
function closePopover() {
  if (!tvPopover || !tvPill) return;
  tvPopover.hidden = true;
  tvPill.setAttribute('aria-expanded', 'false');
  document.removeEventListener('click', onOutsideClick);
  document.removeEventListener('keydown', onPopoverKey);
}
function onOutsideClick(ev) {
  if (!tvControl) return;
  if (!tvControl.contains(ev.target)) closePopover();
}
function onPopoverKey(ev) {
  if (ev.key === 'Escape') {
    closePopover();
    if (tvPill) tvPill.focus();
  }
}

if (tvPill) {
  tvPill.addEventListener('click', () => {
    if (tvPopover && tvPopover.hidden) openPopover();
    else closePopover();
  });
}

// Initial mode: pill if the user has already discovered the slider, prose
// otherwise. We read the key in a try/catch because Safari private mode
// throws on localStorage access in some configurations.
let toleranceTipSeen = false;
try { toleranceTipSeen = !!localStorage.getItem(TOLERANCE_TIP_KEY); }
catch (e) { /* localStorage unavailable — stay in prose mode forever, fine */ }
if (toleranceTipSeen) setPillMode(true);

// First time the user changes the slider, mark them as having seen the
// tolerance UI and switch to pill mode. Use 'change' (not 'input') so the
// transition only fires after the user lets go of the thumb — sliding
// back and forth wouldn't shrink the bar mid-drag.
slider.addEventListener('change', () => {
  if (!toleranceTipSeen) {
    toleranceTipSeen = true;
    try { localStorage.setItem(TOLERANCE_TIP_KEY, '1'); } catch (e) { /* ignore */ }
    setPillMode(true);
  }
}, { once: false });

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

// Re-render results when the user picks a different vehicle.
// We update lastAnalysis.catKey to the newly-selected category so the
// summary reflects the new totals immediately.
window.addEventListener('vehiclechange', () => {
  if (lastAnalysis && resultsPanel.classList.contains('open')) {
    lastAnalysis.catKey = window.getVehicleCat();
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
// routeLayers is an array — when the route is split into toll/non-toll
// segments we render each segment as its own polyline so they can be
// colored independently (green = on toll road, blue = off toll road).
let routeLayers = [];
let bypassLayers = [];
let routeMarkers = [];

function clearRoute() {
  routeLayers.forEach(l => map.removeLayer(l));
  routeLayers = [];
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

  const frontalCost = (typeof window.getTollPrice === 'function')
    ? window.getTollPrice(toll, catKey, dirKey)
    : toll[catKey];
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
  const out         = {};
  Object.entries(bd).forEach(([key, d]) => {
    if (!d) return;
    // Per-direction frontal cost: same as flat today, but lets future
    // asymmetric pricing flow through automatically once the data has it.
    const frontalCost = (typeof window.getTollPrice === 'function')
      ? window.getTollPrice(toll, catKey, key)
      : toll[catKey];
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
    window.fetchBypassRoute(dir.off_ramp, dir.on_ramp, dir.via).then(routeCoords => {
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
        <div class="map-popup-verdict ${r.verdict}">${popupVerdict} · €${(window.getTollPrice ? window.getTollPrice(r.toll, a.catKey, a.travelDir) : r.toll[a.catKey]).toFixed(2)}</div>
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

  const allTollCost = results.reduce((s, r) => s + r.toll[a.catKey], 0);
  const savings     = results.filter(isAvoidSide).reduce((s, r) => s + r.toll[a.catKey], 0);
  const recCost     = allTollCost - savings;
  const extraMin    = results.filter(r => isAvoidSide(r) && r.dir).reduce((s, r) => s + r.dir.minutes, 0);
  const avoidCount  = results.filter(isAvoidSide).length;
  const payCount    = results.filter(isPaySide).length;

  // Estimate initial extra km from straight-line off_ramp↔on_ramp × 0.25
  // (typical sinuosity gap between local-road bypass and motorway segment).
  // This is a rough placeholder shown immediately while we fetch real routes.
  // Once fetches resolve, the refinement below recomputes from actual Mapbox
  // distances and also tracks how much of the original highway is "replaced"
  // by each avoided bypass (so we can show "of which X on motorway").
  const hav = window.haversineKm || ((a, b) => 0);
  let extraKm = results
    .filter(r => isAvoidSide(r) && r.dir && r.dir.off_ramp && r.dir.on_ramp)
    .reduce((s, r) => s + hav(r.dir.off_ramp, r.dir.on_ramp) * 0.25, 0);
  let replacedHwyKm = results
    .filter(r => isAvoidSide(r) && r.dir && r.dir.pre_exit && r.dir.post_merge)
    .reduce((s, r) => s + hav(r.dir.pre_exit, r.dir.post_merge) * 1.05, 0);

  // Format helpers — absolute distance (just km, integer for >=10),
  // absolute duration (Xh Ym for >= 60min, else N λεπ), delta sign.
  const fmtKmAbs = km => km >= 100 ? `${Math.round(km)}` : km >= 10 ? `${km.toFixed(0)}` : `${km.toFixed(1)}`;
  const fmtMinAbs = min => {
    const m = Math.round(min);
    if (m < 60) return `${m} ${t('bar.time.label2')}`;
    const h = Math.floor(m / 60), mm = m % 60;
    return mm === 0 ? `${h}h` : `${h}h ${mm.toString().padStart(2,'0')}m`;
  };

  const mainKm  = a.mainRouteKm  || 0;
  const mainMin = (typeof a.mainRouteDurationMin === 'number') ? a.mainRouteDurationMin : 0;

  rpTitle.textContent = `${a.origin} → ${a.dest}`;
  // Table renderer — 3 rows × 5 cols (label / money / dist / time / tag).
  // First two rows show ABSOLUTE totals so the user sees the actual distance
  // they'll drive in each scenario. Diff row stays delta-formatted.
  const renderStats = (kmValue, replacedKm) => {
    const bypKm   = mainKm + kmValue;            // total km if we take the recommended bypasses
    const bypMin  = mainMin + extraMin;          // total min likewise
    const onHwyKm = Math.max(0, mainKm - replacedKm);  // of bypass scenario, how much still on motorway
    const subLine = onHwyKm > 0 && replacedKm > 0
      ? `<span class="rp-cmp-dist-sub">${t('rp.of.which.on.hw', {km: fmtKmAbs(onHwyKm)})}</span>`
      : '';
    rpStats.innerHTML = `
      <div class="rp-cmp">
        <div class="rp-cmp-row">
          <span class="rp-cmp-label">${t('rp.all.tolls')}</span>
          <span class="rp-cmp-money">€${allTollCost.toFixed(2)}</span>
          <span class="rp-cmp-dist">${fmtKmAbs(mainKm)} ${t('unit.km')}</span>
          <span class="rp-cmp-time">${fmtMinAbs(mainMin)}</span>
          <span class="rp-cmp-tag rp-cmp-tag-total"><strong>${results.length}</strong> ${t('rp.frontal.tolls')}</span>
        </div>
        <div class="rp-cmp-row">
          <span class="rp-cmp-label">${t('rp.with.bypass')}</span>
          <span class="rp-cmp-money">€${recCost.toFixed(2)}</span>
          <span class="rp-cmp-dist">${fmtKmAbs(bypKm)} ${t('unit.km')}${subLine}</span>
          <span class="rp-cmp-time">${fmtMinAbs(bypMin)}</span>
          <span class="rp-cmp-tag">
            <span><strong>${payCount}</strong> ${t('verdict.pay')}</span>
            <span><strong>${avoidCount}</strong> ${t('verdict.avoid')}</span>
          </span>
        </div>
        <div class="rp-cmp-row diff">
          <span class="rp-cmp-label">${t('rp.diff')}</span>
          <span class="rp-cmp-money savings">−€${savings.toFixed(2)}</span>
          <span class="rp-cmp-dist cost">+${fmtKmAbs(Math.max(0, kmValue))} ${t('unit.km')}</span>
          <span class="rp-cmp-time cost">+${extraMin} ${t('bar.time.label2')}</span>
          <span class="rp-cmp-tag"></span>
        </div>
      </div>`;
  };
  renderStats(extraKm, replacedHwyKm);

  // After bypass routes resolve, recompute extra km from REAL Mapbox distances
  // for both the panel-level stats and each individual chip. Also recompute
  // the "replaced highway km" sum using each bypass's actual highway-segment
  // straight-line distance × 1.05.
  // R28: also pass steps:true so the response includes turn-by-turn
  // instructions, which we stash on the analysis for the printed/downloaded
  // take-away document.
  if (typeof window.fetchRoute === 'function') {
    const fetchable = results.filter(r => r.dir && r.dir.off_ramp && r.dir.on_ramp);
    Promise.all(fetchable.map(r =>
      window.fetchRoute(r.dir.off_ramp, r.dir.on_ramp, 'bypass', r.dir.via, { steps: true }).catch(() => null)
    )).then(routes => {
      let panelExtraKm = 0;
      let panelReplacedHwy = 0;
      // Build a tollId → instructions[] map; the print view renderer reads
      // this lazily off the analysis object.
      // R32: also capture the bypass route's coords for use in the per-toll
      // printed map. Stored on a separate map so the steps lookup stays clean.
      a.bypassSteps = a.bypassSteps || {};
      a.bypassCoords = a.bypassCoords || {};
      fetchable.forEach((r, i) => {
        const route = routes[i];
        if (!route) return;
        const bypassKm  = route.distanceKm;
        const highwayKm = (r.dir.pre_exit && r.dir.post_merge)
          ? hav(r.dir.pre_exit, r.dir.post_merge) * 1.05
          : hav(r.dir.off_ramp, r.dir.on_ramp) * 1.05;
        const addedKm = Math.max(0, bypassKm - highwayKm);
        if (isAvoidSide(r)) {
          panelExtraKm += addedKm;
          panelReplacedHwy += highwayKm;
        }
        // Stash steps for the print view (rendered only for AVOID-side; the
        // tollLine renderer gates on verdict). We store for ALL fetched tolls
        // anyway because the user could change tolerance and flip a PAY into
        // an AVOID without us refetching.
        if (Array.isArray(route.instructions)) {
          a.bypassSteps[r.toll.id] = route.instructions;
        }
        if (Array.isArray(route.coords)) {
          a.bypassCoords[r.toll.id] = route.coords;
        }
        // Update this chip's km cells in place. Now that motorway is row 0 and
        // bypass is row 1, write km into distCells[1] (bypass) and distCells[2] (diff).
        // Headers indicate the unit, so we write just the signed number.
        const cmpEl = document.querySelector(`.chip-cmp[data-toll-id="${r.toll.id}"]`);
        if (cmpEl) {
          const kmStr = `+${addedKm.toFixed(1)}`;
          const distCells = cmpEl.querySelectorAll('.chip-cmp-dist');
          if (distCells[1]) distCells[1].textContent = kmStr;
          if (distCells[2]) distCells[2].textContent = kmStr;
        }
      });
      renderStats(panelExtraKm, panelReplacedHwy);
      // Rebuild the print view now that bypass steps are available.
      // buildPrintView reads from a.bypassSteps, so this picks them up.
      buildPrintView(a, results, { savings, extraMin, allTollCost, recCost, avoidCount, payCount });
    });
  }

  let html = `<div class="rp-advice" id="rp-advice-el">${t('rp.advice.loading')}</div>`;
  html += '<div class="rp-chips">';
  results.forEach(r => {
    const verdictLabel = t(`verdict.${r.verdict.toLowerCase().replace('_', '.')}`);
    const tollName = stripTollPrefix(lang === 'el' ? r.toll.name_gr : r.toll.name_en);
    const frontal  = (typeof window.getTollPrice === 'function')
      ? window.getTollPrice(r.toll, a.catKey, a.travelDir)
      : r.toll[a.catKey];
    let cmpHtml = '';
    if (r.dir) {
      // Compute bypass cost: ferry fare for ferry mode, else side-toll sum on bypass.
      const isFerry = r.dir.mode === 'ferry' && r.dir.fare;
      const bypassMoney = isFerry
        ? (r.dir.fare[a.catKey] || 0)
        : ((r.sideInfo && r.sideInfo.totals && r.sideInfo.totals[a.catKey]) || 0);
      // Bypass extra km — quick haversine estimate while we wait for fetched
      // routes to refine. Refined per-chip after Promise.all completes.
      const bypassKm = (r.dir.off_ramp && r.dir.on_ramp)
        ? hav(r.dir.off_ramp, r.dir.on_ramp) * 0.25
        : 0;
      const bypassMin   = r.dir.minutes || 0;
      const moneyDiff   = frontal - bypassMoney;   // positive = bypass cheaper
      const moneySign   = moneyDiff >= 0 ? '−' : '+';
      const moneyClass  = Math.abs(moneyDiff) < 0.005 ? 'zero' : (moneyDiff > 0 ? 'savings' : 'cost');
      const kmStr       = bypassKm >= 0.1 ? `+${bypassKm.toFixed(1)}` : '+0.0';
      // Inline exit→entry into the bypass label, e.g. "Παράκαμψη Μαλγάρων → Χαλάστρας"
      const bypassLabel = r.dir.exit_name && r.dir.entry_name
        ? `${t('compare.bypass')} <span class="chip-cmp-route">${r.dir.exit_name} → ${r.dir.entry_name}</span>`
        : t('compare.bypass');
      cmpHtml = `
        <div class="chip-cmp" data-toll-id="${r.toll.id}">
          <div class="chip-cmp-row chip-cmp-head">
            <span class="chip-cmp-h-blank"></span>
            <span class="chip-cmp-h">€</span>
            <span class="chip-cmp-h">${t('unit.km')}</span>
            <span class="chip-cmp-h">${t('bar.time.label2')}</span>
          </div>
          <div class="chip-cmp-row">
            <span class="chip-cmp-label">${t('compare.highway')}</span>
            <span class="chip-cmp-money">€${frontal.toFixed(2)}</span>
            <span class="chip-cmp-dist zero">—</span>
            <span class="chip-cmp-time zero">—</span>
          </div>
          <div class="chip-cmp-row">
            <span class="chip-cmp-label">${bypassLabel}</span>
            <span class="chip-cmp-money">€${bypassMoney.toFixed(2)}</span>
            <span class="chip-cmp-dist">${kmStr}</span>
            <span class="chip-cmp-time">+${bypassMin}</span>
          </div>
          <div class="chip-cmp-row diff">
            <span class="chip-cmp-label">${t('rp.diff')}</span>
            <span class="chip-cmp-money ${moneyClass}">${moneySign}€${Math.abs(moneyDiff).toFixed(2)}</span>
            <span class="chip-cmp-dist cost">${kmStr}</span>
            <span class="chip-cmp-time cost">+${bypassMin}</span>
          </div>
        </div>`;
    } else {
      // No bypass available — keep the original short reasoning as a single tag.
      cmpHtml = `<div class="chip-tags chip-tags-noby">${t('verdict.no.bypass.short')}</div>`;
    }
    html += `
      <div class="toll-chip verdict-${r.verdict}"
        onclick="const el=this.querySelector('.chip-reason');el.style.display=el.style.display==='block'?'none':'block'">
        <span class="chip-name">${tollName}</span>
        <span class="chip-price">€${frontal.toFixed(2)}</span>
        <span class="chip-verdict">${verdictLabel}</span>
        <div class="chip-reason">${cmpHtml}</div>
      </div>`;
  });
  html += '</div>';
  rpBody.innerHTML = html;
  resultsPanel.classList.add('open');

  // Build the printable / downloadable view from the same results.
  // Stored on the analysis object so the print/download handlers can rebuild
  // it on click without re-running the analyze pipeline. Includes a snapshot
  // of stats AT THE TIME OF RENDER — the user clicking Print after a refined
  // bypass-km recalculation will see the refined numbers because we read
  // those off the live #rp-stats DOM at print time (see buildPrintView).
  buildPrintView(a, results, { savings, extraMin, allTollCost, recCost, avoidCount, payCount });

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

/* ──────────────────────────────────────────────────────────────────
   Printable / downloadable take-away view.

   Populated each time renderResults runs. The DOM lives in #print-view
   (off-screen by default). Two ways out:

   1. PRINT button → window.print(). The print stylesheet hides everything
      except #print-view, so the user gets a clean document. The browser's
      native dialog gives them "Save as PDF" for free on every modern OS.

   2. DOWNLOAD button → walk the same DOM as plain text, serve as a Blob
      download. Useful for offline phone reference, sharing via messaging
      apps, or pasting into other tools.

   Both paths share one source of truth (the DOM in #print-view) so the
   formats can never drift apart.
   ────────────────────────────────────────────────────────────────── */

// Tiny HTML escape — toll names occasionally contain ampersands or quotes
// in the source data, and bypass-step instructions from Mapbox can include
// any character. Keeps rendered output safe and prevents accidental tag
// injection if data ever surfaces user-supplied text.
function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ──────────────────────────────────────────────────────────────────
   Static-map thumbnail for the printout (R31)
   ────────────────────────────────────────────────────────────────── */

// Google Encoded Polyline Algorithm — converts a [[lat,lng], ...] array into
// the compact ASCII string that Mapbox Static Images accepts as a path
// overlay. Spec: developers.google.com/maps/documentation/utilities/polylinealgorithm
function encodePolyline(points) {
  let result = '';
  let prevLat = 0, prevLng = 0;
  for (const [lat, lng] of points) {
    const eLat = Math.round(lat * 1e5);
    const eLng = Math.round(lng * 1e5);
    result += encodeNum(eLat - prevLat) + encodeNum(eLng - prevLng);
    prevLat = eLat;
    prevLng = eLng;
  }
  return result;
}
function encodeNum(num) {
  num = num < 0 ? ~(num << 1) : (num << 1);
  let out = '';
  while (num >= 0x20) {
    out += String.fromCharCode((0x20 | (num & 0x1f)) + 63);
    num >>= 5;
  }
  out += String.fromCharCode(num + 63);
  return out;
}

// Decimate a polyline to roughly `targetPoints` points by uniform sampling.
// Not Douglas-Peucker — this is a thumbnail, not a navigational chart, and
// 60mm-wide rendering doesn't notice the difference. Always preserves the
// first and last points so the path stays anchored to origin/destination.
function decimatePolyline(coords, targetPoints) {
  if (!coords || coords.length <= targetPoints) return coords || [];
  const step = (coords.length - 1) / (targetPoints - 1);
  const out = [];
  for (let i = 0; i < targetPoints - 1; i++) {
    out.push(coords[Math.round(i * step)]);
  }
  out.push(coords[coords.length - 1]);
  return out;
}

// Build a Mapbox Static Images API URL for the printable thumbnail.
// Inputs:
//   coords      — full route [[lat,lng], ...]
//   from, to    — endpoint {lat,lng} objects
//   tollMarkers — [{lat,lng,verdict,index}, ...] for verdict-colored numbered pins
// Returns a URL string, or null if route data is missing.
//
// Mapbox URL length is capped around 8KB. With ~80 polyline points + ~12 pins
// we land around 1.5KB, comfortable. The Mapbox token is the same one used
// elsewhere in the app — referrer restriction works because the popup window
// inherits document.referrer from the opener (mydiodia.gr).
function buildStaticMapUrl(coords, from, to, tollMarkers) {
  if (!coords || coords.length < 2 || !from || !to) return null;
  const token = (typeof MAPBOX_TOKEN !== 'undefined' && MAPBOX_TOKEN)
    || (typeof window !== 'undefined' && window.MAPBOX_TOKEN);
  if (!token) return null;

  const decimated = decimatePolyline(coords, 80);
  const polyline  = encodePolyline(decimated);
  // path-{strokeWidth}+{color}-{opacity}({polyline}) — Mapbox path overlay.
  // Aegean blue from the design tokens. Prints clean on b/w too — comes out
  // as a medium grey line with good contrast against the basemap.
  const path = `path-4+2a6b9e-0.85(${encodeURIComponent(polyline)})`;

  // Endpoint pins. Mapbox URL uses lng,lat order. pin-l (large) for endpoints
  // so they're visually distinct from the toll pins below.
  const fromPin = `pin-l-a+2e7a4a(${from.lng.toFixed(5)},${from.lat.toFixed(5)})`;
  const toPin   = `pin-l-b+b8502d(${to.lng.toFixed(5)},${to.lat.toFixed(5)})`;

  // Toll pins. pin-s (small) with numeric labels matching the printed list
  // — driver can match "pin labeled 3 on the map" to "item 3 in the toll list"
  // at a glance. Mapbox supports numeric labels 0-99; routes today max out
  // around 11 tolls so this is safely in range.
  // Color by verdict using the same palette as the screen UI.
  const verdictColor = {
    AVOID: '2e7a4a',
    MARGINAL_AVOID: 'c49320',
    PAY: 'b8502d',
    MARGINAL_PAY: 'c49320',
  };
  const tollPins = (tollMarkers || []).map(m => {
    const color = verdictColor[m.verdict] || '5e6578';
    const label = (m.index >= 0 && m.index <= 99) ? m.index : '';
    return `pin-s-${label}+${color}(${m.lng.toFixed(5)},${m.lat.toFixed(5)})`;
  }).join(',');

  // Compose overlays in z-order (path first, then markers on top).
  const overlays = [path, fromPin, toPin, tollPins].filter(Boolean).join(',');

  // 'auto' centers/zooms to fit overlays. 600x600@2x = 1200×1200 actual pixels;
  // at 60mm print width that's ~250 DPI, sharp on any printer.
  return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${overlays}/auto/600x600@2x?access_token=${token}`;
}

// Build a Mapbox Static Images URL for a SINGLE TOLL'S BYPASS — small map
// embedded in each toll's printed section showing the local bypass detour.
//
// Inputs:
//   toll        — the toll record (uses lat/lng for the toll's own pin)
//   dir         — the bypass_directions entry (off_ramp, on_ramp, etc.)
//   bypassCoords — the actual local-road polyline from the Mapbox bypass route
//                  fetch, [[lat,lng], ...]. Optional — when missing, we draw
//                  straight lines between off_ramp / via / on_ramp anchors as
//                  a fallback (less accurate but conveys the gist).
// Returns a URL string, or null if essential data is missing.
//
// What's drawn:
//   - Toll location: red pin labeled € (the thing being skipped)
//   - Bypass polyline: green path (the route the driver actually takes)
//   - Off-ramp: small green pin labeled "1" (where to leave the highway)
//   - On-ramp: small green pin labeled "2" (where to rejoin)
//
// We don't draw the highway segment as a separate path — the toll pin
// shows the user where they'd exit/skip; redundant geometry crowds the
// thumbnail.
function buildBypassMapUrl(toll, dir, bypassCoords) {
  if (!toll || !dir || !dir.off_ramp || !dir.on_ramp) return null;
  const token = (typeof MAPBOX_TOKEN !== 'undefined' && MAPBOX_TOKEN)
    || (typeof window !== 'undefined' && window.MAPBOX_TOKEN);
  if (!token) return null;

  // Bypass polyline. Prefer the real Mapbox geometry; fall back to straight
  // lines between anchor points if the route fetch hadn't completed by print
  // time. The fallback is ugly but at least shows the spatial relationship.
  let coords;
  if (Array.isArray(bypassCoords) && bypassCoords.length >= 2) {
    coords = decimatePolyline(bypassCoords, 50);
  } else {
    coords = [
      [dir.off_ramp.lat, dir.off_ramp.lng],
      ...((dir.via || []).map(p => [p.lat, p.lng])),
      [dir.on_ramp.lat, dir.on_ramp.lng],
    ];
  }
  const polyline = encodePolyline(coords);
  // Path: --go (green), opacity 0.85, stroke 4. Reads as "this is the path
  // you'll take" — green being the verdict color for AVOID.
  const path = `path-4+2e7a4a-0.85(${encodeURIComponent(polyline)})`;

  // Toll pin: red (--stop), no label needed — color signals "the thing
  // you're skipping". pin-l (large) so it visually outweighs the small
  // numbered ramp pins; helps the eye land on "what gets avoided" first.
  // (Mapbox Static Images supports only pin-s and pin-l — there is no
  // pin-m. An invalid pin token causes the whole image request to 422,
  // which is how this got missed in R32.)
  const tollPin = `pin-l+b8502d(${toll.lng.toFixed(5)},${toll.lat.toFixed(5)})`;

  // Off-ramp ("1") and on-ramp ("2") pins, small green to match the path.
  const offPin = `pin-s-1+2e7a4a(${dir.off_ramp.lng.toFixed(5)},${dir.off_ramp.lat.toFixed(5)})`;
  const onPin  = `pin-s-2+2e7a4a(${dir.on_ramp.lng.toFixed(5)},${dir.on_ramp.lat.toFixed(5)})`;

  const overlays = [path, tollPin, offPin, onPin].join(',');

  // 450×350@2x = 900×700 actual; at 45mm × 35mm print width that's ~500 DPI.
  // Slightly landscape because most bypasses are wider than tall.
  return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${overlays}/auto/450x350@2x?access_token=${token}`;
}

function buildPrintView(a, results, stats) {
  const view = document.getElementById('print-view');
  if (!view) return;
  const lang = (typeof getCurrentLang === 'function') ? getCurrentLang() : 'el';
  const veh = (window.getVehicleMeta && window.getVehicleMeta()) || {};
  const catLabel = veh.fullKey ? t(veh.fullKey) : a.catKey;

  // Format helpers — same conventions as the panel.
  const fmtKm = km => km >= 100 ? `${Math.round(km)}` : km >= 10 ? `${km.toFixed(0)}` : `${km.toFixed(1)}`;
  const fmtMin = m => {
    m = Math.round(m);
    if (m < 60) return `${m} ${t('bar.time.label2')}`;
    const h = Math.floor(m / 60), mm = m % 60;
    return mm === 0 ? `${h}h` : `${h}h ${mm.toString().padStart(2,'0')}m`;
  };

  // Generation timestamp — locale-formatted so EL users see Greek date.
  const now = new Date();
  const dateStr = now.toLocaleString(lang === 'el' ? 'el-GR' : 'en-GB', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  // Per-toll instruction line. Includes the actionable bypass detail
  // whenever exit/entry interchange names are known — irrespective of
  // verdict — so the printed document is a complete reference (the user
  // might reverse a PAY decision on the road if traffic conditions change,
  // and even AVOID-shaped bypasses should explain why each toll is what
  // it is). Verdict still drives the body-text labels: AVOIDed tolls show
  // savings; PAID tolls explain why bypassing isn't recommended.
  const tollLine = (r, idx) => {
    const name = (lang === 'el' ? r.toll.name_gr : r.toll.name_en) || r.toll.id;
    const verdictText = t(`verdict.${r.verdict.toLowerCase().replace('_', '.')}`);
    const price = (typeof window !== 'undefined' && window.getTollPrice)
      ? window.getTollPrice(r.toll, a.catKey, a.travelDir)
      : (r.toll[a.catKey] || 0);

    // Exit/entry interchange names. Three sources, in priority order:
    //   1. r.dir.exit_name / entry_name      — explicit data labels (best)
    //   2. derived from bypass step instructions (fallback for the 20 tolls
    //      from R17–R22 that lack explicit labels in tolls.js)
    //   3. nothing                            — toll has no bypass at all
    let exit  = r.dir?.exit_name  || '';
    let entry = r.dir?.entry_name || '';
    const min = r.dir?.minutes    || 0;

    // Source 2: derive from Mapbox directions response. Each step has
    // type ('off ramp', 'on ramp', 'turn', 'merge', etc.) and a roadName.
    // - First "off ramp" or first turn AFTER prelude → exit road name
    // - Last "on ramp" or "merge" → entry road name
    // We ALSO walk the instruction text for "toward X" / "προς X" patterns,
    // which are usually more user-friendly (named destinations) than raw
    // road names like "EO 1".
    if ((!exit || !entry) && a.bypassSteps && a.bypassSteps[r.toll.id]) {
      const steps = a.bypassSteps[r.toll.id];
      // First step after the prelude (already trimmed in fetchRoute) is
      // typically the off-ramp. Look for an "off ramp" maneuver type, or
      // fall back to the first step's road name.
      const firstOff = steps.find(s => s.type === 'off ramp') || steps[0];
      const lastOn = [...steps].reverse().find(s =>
        s.type === 'on ramp' || s.type === 'merge'
      ) || steps[steps.length - 1];

      // Try to extract "toward X" / "προς X" destination from instruction
      const towardRe = lang === 'el' ? /προς\s+([^,.()]+)/i : /toward\s+([^,.()]+)/i;
      const tryToward = (s) => {
        if (!s) return '';
        const m = s.text.match(towardRe);
        return m ? m[1].trim() : '';
      };

      if (!exit) {
        exit = tryToward(firstOff) || firstOff?.roadName || '';
      }
      if (!entry) {
        entry = tryToward(lastOn) || lastOn?.roadName || '';
      }
    }

    let routeLine = '';
    if (exit && entry) {
      const minSuffix = min > 0 ? ` (+${min} ${t('bar.time.label2')})` : '';
      routeLine = `${t('print.exit_at')} ${exit}, ${t('print.enter_at')} ${entry}${minSuffix}`;
    } else if (exit) {
      // Derived only one — still useful, render it solo
      routeLine = `${t('print.exit_at')} ${exit}`;
    }

    // Verdict-specific body. AVOID-side: emphasise savings. PAY-side:
    // explain why bypassing isn't worth it. Marginal verdicts share the
    // body text of their definite siblings; the verdict badge already
    // signals the "borderline" nature.
    let body = '';
    if (r.verdict === 'AVOID' || r.verdict === 'MARGINAL_AVOID') {
      const isFerry = r.dir?.mode === 'ferry' && r.dir?.fare;
      const sideCost = isFerry
        ? (r.dir.fare[a.catKey] || 0)
        : ((r.sideInfo?.totals?.[a.catKey]) || 0);
      const saved = Math.max(0, price - sideCost);
      if (saved > 0.005) body = `${t('print.saves')} €${saved.toFixed(2)}`;
    } else if (r.verdict === 'PAY' && !r.dir) {
      body = t('print.no_bypass');
    } else if (r.verdict === 'PAY' && r.dir) {
      body = t('print.bypass_more');
    } else if (r.verdict === 'MARGINAL_PAY' && r.dir) {
      body = t('print.bypass_more');
    }

    // Step-by-step bypass directions (Mapbox-derived). Stored on the analysis
    // object once the bypass routes resolve (see refineBypassDirections).
    // Only AVOID/MARGINAL_AVOID get them — those are the ones the user is
    // actually expected to drive.
    //
    // R30: rewrite the first and last steps to use the toll's named exit /
    // entry interchanges instead of Mapbox's raw road-network phrasing. The
    // route prelude header above ("Exit at X, re-enter at Y") and the steps
    // list now reference the same names — internally consistent for the
    // driver. Mapbox's distance metric is preserved (still describes the
    // ramp / merge length). Middle steps are kept verbatim.
    //
    // If exit/entry names aren't available (toll has neither explicit data
    // nor derivable Mapbox info), the original Mapbox text stays — better
    // raw text than nothing.
    let stepsHtml = '';
    const tollSteps = a.bypassSteps && a.bypassSteps[r.toll.id];
    const showSteps = (r.verdict === 'AVOID' || r.verdict === 'MARGINAL_AVOID') && Array.isArray(tollSteps) && tollSteps.length;
    if (showSteps) {
      // Build a presentation copy so we don't mutate the cached step array.
      // Maps each step to {text, km} for rendering.
      const renderSteps = tollSteps.map(s => ({ text: s.text, km: s.km }));

      // Capitalize first letter for use as a standalone step. Header line
      // uses lowercase ("..., re-enter at Y") but step list reads better
      // capitalized ("3. Re-enter at Y" / "3. Επανείσοδος στον κόμβο Y").
      // Both Greek and Latin scripts handle .toUpperCase() correctly for
      // the simple lowercase→uppercase mapping here.
      const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

      // Replace step 0 with "Exit at <name>" if we have an exit name.
      if (exit && renderSteps.length >= 1) {
        renderSteps[0].text = `${cap(t('print.exit_at'))} ${exit}`;
      }
      // Replace last step with "Re-enter at <name>" if we have an entry name.
      // Skip if there's only one step (would overwrite the same step twice
      // with conflicting labels — keep the exit-replacement in that case).
      if (entry && renderSteps.length >= 2) {
        renderSteps[renderSteps.length - 1].text = `${cap(t('print.enter_at'))} ${entry}`;
      }

      stepsHtml = `
        <div class="pv-toll-steps-label">${t('print.directions')}:</div>
        <ol class="pv-toll-steps">
          ${renderSteps.map(s => `<li>${escapeHtml(s.text)}<span class="pv-step-dist"> · ${s.km}</span></li>`).join('')}
        </ol>`;
    }

    // R32: per-toll bypass map. Only shown for AVOID-side tolls — the user
    // is going to drive the bypass, so a localized map of it is useful.
    // PAY tolls don't get a map (they're staying on the highway, no bypass
    // to visualize). Falls back gracefully if the toll has no bypass info
    // or if the route fetch hasn't completed.
    //
    // R35: when the image fails to load (404, 401, CORS, etc), show the URL
    // and HTTP status as diagnostic text inside the map slot, so we can see
    // what's actually going wrong instead of looking at a blank box. The
    // onerror handler hides the broken image and reveals the fallback div.
    // If the image loads successfully, the fallback stays hidden — user
    // sees the map as intended.
    const isAvoidSide = (r.verdict === 'AVOID' || r.verdict === 'MARGINAL_AVOID');
    const bypassMapUrl = isAvoidSide
      ? buildBypassMapUrl(r.toll, r.dir, a.bypassCoords?.[r.toll.id])
      : null;
    const bypassMapHtml = bypassMapUrl
      ? `<aside class="pv-toll-map">
           <img src="${escapeHtml(bypassMapUrl)}" alt="" data-print-asset="bypass-map"
                referrerpolicy="origin"
                onerror="this.style.display='none';this.nextElementSibling.style.display='block';" />
           <div class="pv-toll-map-fallback" style="display:none;">
             <strong>Map failed to load.</strong><br>
             URL: <a href="${escapeHtml(bypassMapUrl)}" target="_blank" rel="noopener">open in new tab</a><br>
             <small style="word-break:break-all;font-family:monospace;font-size:6pt;">${escapeHtml(bypassMapUrl)}</small>
           </div>
         </aside>`
      : '';

    return `
      <div class="pv-toll pv-toll--${r.verdict.toLowerCase()}">
        ${bypassMapHtml}
        <div class="pv-toll-head">
          <span class="pv-toll-num">${idx + 1}.</span>
          <span class="pv-toll-name">${escapeHtml(name)}</span>
          <span class="pv-toll-verdict pv-toll-verdict--${r.verdict.toLowerCase()}">${verdictText}</span>
          <span class="pv-toll-price">€${price.toFixed(2)}</span>
        </div>
        ${routeLine ? `<div class="pv-toll-route">${escapeHtml(routeLine)}</div>` : ''}
        ${body     ? `<div class="pv-toll-detail">${escapeHtml(body)}</div>` : ''}
        ${stepsHtml}
      </div>`;
  };

  // Read live stats off the panel DOM so refined-bypass-km updates flow
  // through automatically (rp-stats is recomputed once the bypass routes
  // resolve via Mapbox; no point duplicating that logic here).
  const liveStats = document.getElementById('rp-stats');
  const statsClone = liveStats ? liveStats.innerHTML : '';

  // Read live AI advice text the same way; falls back to a placeholder
  // dash if the AI summary hasn't resolved yet.
  const adviceEl = document.getElementById('rp-advice-el');
  const adviceText = adviceEl ? adviceEl.textContent.trim() : '';
  const adviceForPrint = (adviceText && !adviceText.includes(t('rp.advice.loading')))
    ? adviceText.replace(/^💡\s*/, '')
    : '—';

  view.innerHTML = `
    <header class="pv-head">
      <div class="pv-brand">mydiodia.gr</div>
      <h1 class="pv-h1">${t('print.title')}</h1>
      <div class="pv-route">${a.origin} → ${a.dest}</div>
      <div class="pv-meta">
        <span><strong>${t('print.generated')}:</strong> ${dateStr}</span>
        <span><strong>${t('print.vehicle')}:</strong> ${catLabel}</span>
        <span><strong>${t('print.tolerance')}:</strong> ${t('print.tolerance.unit', { n: a.timeValue })}</span>
      </div>
    </header>

    <section class="pv-summary">
      <h2>${t('print.summary')}</h2>
      <div class="pv-stats">${statsClone}</div>
    </section>

    <section class="pv-advice">
      <h2>${t('print.advice')}</h2>
      <p>${adviceForPrint}</p>
    </section>

    <section class="pv-tolls">
      <h2>${t('print.tolls')} (${results.length})</h2>
      ${results.map(tollLine).join('')}
    </section>

    <footer class="pv-foot">${t('print.footer')}</footer>
  `;
}

// Walk #print-view DOM and produce a plain-text version. The structure is
// stable (sections + tolls), so a few class-based hooks let us format it
// nicely with line breaks, indentation, and underlines for headings.
function printViewToText() {
  const view = document.getElementById('print-view');
  if (!view) return '';
  const lines = [];
  const push = (s) => lines.push(s);
  const rule = (ch = '─', n = 60) => push(ch.repeat(n));

  // Header
  const brand = view.querySelector('.pv-brand')?.textContent.trim() || '';
  const h1    = view.querySelector('.pv-h1')?.textContent.trim() || '';
  const route = view.querySelector('.pv-route')?.textContent.trim() || '';
  push(brand); rule(); push(h1); push(route); push('');

  // Meta lines
  view.querySelectorAll('.pv-meta span').forEach(s => push('  ' + s.textContent.replace(/\s+/g, ' ').trim()));
  push('');

  // Summary table — read 3 rows × cells
  push(view.querySelector('.pv-summary h2')?.textContent.trim() || ''); rule();
  view.querySelectorAll('.pv-summary .rp-cmp-row').forEach(row => {
    const cells = [...row.children].map(c => c.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean);
    push('  ' + cells.join('  ·  '));
  });
  push('');

  // Advice
  push(view.querySelector('.pv-advice h2')?.textContent.trim() || ''); rule();
  push('  ' + (view.querySelector('.pv-advice p')?.textContent.trim() || ''));
  push('');

  // Tolls
  push(view.querySelector('.pv-tolls h2')?.textContent.trim() || ''); rule();
  view.querySelectorAll('.pv-toll').forEach(t => {
    const head = [...t.querySelector('.pv-toll-head').children]
      .map(c => c.textContent.replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .join('  ');
    push(head);
    // Bypass route prelude: "Exit at X, re-enter at Y (+N min)"
    const route = t.querySelector('.pv-toll-route');
    if (route) push('     ' + route.textContent.replace(/\s+/g, ' ').trim());
    // Verdict body line: "saves €X" / "no bypass available" / etc.
    const detail = t.querySelector('.pv-toll-detail');
    if (detail) push('     ' + detail.textContent.replace(/\s+/g, ' ').trim());
    // Step-by-step bypass directions (AVOID-side only — gated in renderer).
    const stepsLabel = t.querySelector('.pv-toll-steps-label');
    const steps = t.querySelectorAll('.pv-toll-steps li');
    if (steps.length) {
      push('     ' + (stepsLabel ? stepsLabel.textContent.trim() : 'Directions:'));
      steps.forEach((li, idx) => {
        // Each <li> is "instruction text · X km" — keep the structure but
        // re-format with index for plain text.
        const distEl = li.querySelector('.pv-step-dist');
        const dist = distEl ? distEl.textContent.replace(/^\s*·\s*/, '').trim() : '';
        // Strip the dist span from the instruction text by cloning + removing
        const clone = li.cloneNode(true);
        const cloneDist = clone.querySelector('.pv-step-dist');
        if (cloneDist) cloneDist.remove();
        const instr = clone.textContent.replace(/\s+/g, ' ').trim();
        push(`       ${idx + 1}. ${instr}${dist ? ` (${dist})` : ''}`);
      });
    }
    push('');
  });

  rule();
  push(view.querySelector('.pv-foot')?.textContent.trim() || '');
  return lines.join('\n');
}

function downloadPrintViewAsText(filenameStem) {
  const text = printViewToText();
  if (!text) return;
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  // Normalize filename: ascii-only, lowercase, hyphenated. Fallback if
  // the route contains characters that don't transliterate cleanly.
  const stem = (filenameStem || 'route')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')   // strip diacritics (Greek too via NFD)
    .replace(/[^\w]+/g, '-').replace(/^-+|-+$/g, '');
  const today = new Date().toISOString().slice(0, 10);
  a.download = `mydiodia-${stem || 'route'}-${today}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Defer URL revoke so iOS Safari has a chance to fire the download
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

// Print the take-away document.
//
// HISTORY:
// - R27/R28: window.print() with @media print stylesheet on main page.
//   Fragile due to display:none + cascade interactions.
// - R29-R36: opened a popup (about:blank) and wrote a self-contained HTML
//   document into it. Worked for text but maps consistently failed because
//   about:blank popups don't reliably send a referrer header that Mapbox's
//   URL-restricted token accepts.
// - R37 (current): back to native window.print() with @media print, but
//   this time with proper off-screen positioning that survives the print
//   cascade. Maps load in the main window where mydiodia.gr referrer is
//   sent correctly, and they're already cached by print time. The print
//   stylesheet just shows them.
//
// The download button still walks #print-view's DOM as plain text — that
// part hasn't changed.
function triggerNativePrint() {
  const view = document.getElementById('print-view');
  if (!view || !view.innerHTML.trim()) {
    // Nothing to print yet — analysis hasn't populated the view.
    return;
  }
  // The maps are already loaded in the main window (via the <img> tags in
  // #print-view, which load eagerly even though the parent has display:none
  // because it's actually positioned off-screen, not display:none — see
  // style.css). Just call print() and let @media print handle the rest.
  //
  // We give a tiny tick before print so any in-flight image load can
  // finish painting before the snapshot is taken.
  setTimeout(() => window.print(), 50);
}

// Wire up the two action buttons. Idempotent — safe if calculator.js is
// loaded multiple times during dev.
(function wireResultsActions() {
  const printBtn    = document.getElementById('rp-action-print');
  const downloadBtn = document.getElementById('rp-action-download');
  if (printBtn && !printBtn.dataset.wired) {
    printBtn.dataset.wired = '1';
    printBtn.addEventListener('click', triggerNativePrint);
  }
  if (downloadBtn && !downloadBtn.dataset.wired) {
    downloadBtn.dataset.wired = '1';
    downloadBtn.addEventListener('click', () => {
      const stem = lastAnalysis
        ? `${lastAnalysis.origin}-${lastAnalysis.dest}`
        : 'route';
      downloadPrintViewAsText(stem);
    });
  }
})();


// ── Main analyze ──────────────────────────────────────────
async function analyze() {
  const origin    = document.getElementById('origin').value.trim();
  const dest      = document.getElementById('dest').value.trim();
  const vehicle   = window.getVehicleCat ? window.getVehicleCat() : 'cat2';
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

    // 4. Draw main route — if Mapbox returned segment classes, color each
    //    segment by its toll status (green = on toll road, blue = off).
    //    Falls back to a single-color polyline when segment data isn't available.
    const drawSegment = (coords, isToll) => L.polyline(coords, {
      color:   isToll ? '#2e7a4a' : '#2a6b9e',
      weight:  4,
      opacity: 0.7,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);

    if (mainRoute.segments && mainRoute.segments.length) {
      mainRoute.segments.forEach(s => routeLayers.push(drawSegment(s.coords, s.isToll)));
    } else {
      // Legacy single-color fallback (also used by routes without intersection data).
      routeLayers.push(drawSegment(routeCoords, true));
    }
    if (window.setActiveRouteLayer) window.setActiveRouteLayer(routeCoords);

    const allBounds = L.latLngBounds(routeCoords);
    map.fitBounds(allBounds.pad(0.15));

    // 5. Snap tolls to route
    const matchedTolls = tollsOnRoute(routeCoords);
    if (matchedTolls.length === 0) {
      showError(t('err.no.tolls'));
      setLoading(false);
      return;
    }

    // 6. Stash inputs for re-render on lang toggle. `vehicle` is already a catKey
    //    ('cat1'..'cat4') as returned by window.getVehicleCat().
    const catKey = vehicle;

    lastAnalysis = {
      origin, dest, matchedTolls, catKey, timeValue, travelDir,
      mainRouteKm: mainRoute.distanceKm,
      mainRouteDurationMin: mainRoute.durationMin,
      mainRouteTollKm: mainRoute.tollKm || 0,
      mainRouteNonTollKm: mainRoute.nonTollKm || 0,
      // R31: stash route geometry + endpoint coords so the print view can
      // build a static map URL from them. routeCoords is [[lat,lng], ...]
      // matching what fetchMainRoute returns. Decimated at print time.
      routeCoords,
      fromCoord,
      toCoord,
    };

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
  // Set to the input we just selected from, so its synthesized re-focus doesn't
  // re-open the dropdown. Scoped per-input — a different input focusing always
  // opens. Cleared on focus or after one suppressed focus.
  let suppressOpenFor = null;

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
    const input = activeInput;  // capture before close() nulls it
    input.value = lang === 'el' ? m.city.name_gr : m.city.name_en;
    suppressOpenFor = input;
    close();
    // Re-focus the captured input (close() set activeInput to null, so we
    // can't read it from there). The focus handler will see suppressOpenFor
    // matches and bail without re-opening — but only for *this* input.
    input.focus();
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
      // Only suppress reopen for the input that was just selected from.
      // Any other input focus opens normally — that fixes the bug where
      // selecting from #origin was killing the next #dest dropdown.
      if (suppressOpenFor === input) { suppressOpenFor = null; return; }
      suppressOpenFor = null;
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
