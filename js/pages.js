/* ════════════════════════════════════════════════════════════════
   mydiodia — Multi-page hash router
   Pages: #map (default), #routes, #tolls
   ════════════════════════════════════════════════════════════════ */

const VALID_PAGES = ['map', 'routes', 'tolls'];

function getCurrentPage() {
  const hash = window.location.hash.replace('#', '').trim();
  return VALID_PAGES.includes(hash) ? hash : 'map';
}

function navigateTo(page) {
  if (!VALID_PAGES.includes(page)) page = 'map';
  if (window.location.hash === `#${page}`) {
    applyPage(page);
  } else {
    window.location.hash = `#${page}`;
  }
}

function applyPage(page) {
  document.querySelectorAll('.page').forEach(el => {
    el.classList.toggle('page-active', el.id === `page-${page}`);
  });
  document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });
  if (page === 'routes') {
    populateRoutesFilter();
    initRoutesFilterControls();
    buildRoutesGrid();
  }
  if (page === 'tolls')  buildTollsTable();

  // The map needs to know it's been resized when re-entering map view
  if (page === 'map' && typeof window._dmap !== 'undefined') {
    setTimeout(() => window._dmap.invalidateSize(), 50);
  }
}

window.addEventListener('hashchange', () => applyPage(getCurrentPage()));
window.addEventListener('DOMContentLoaded', () => {
  applyPage(getCurrentPage());
  // Wire nav links
  document.querySelectorAll('.nav-link').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      navigateTo(a.dataset.page);
    });
  });
  // Re-render on lang change so labels update
  window.addEventListener('langchange', () => {
    if (getCurrentPage() === 'routes') {
      populateRoutesFilter();
      buildRoutesGrid();
    }
    if (getCurrentPage() === 'tolls')  buildTollsTable();
  });
});

/* ════════════════════════════════════════════════════════════════
   ROUTES PAGE — 16 cities × 16 cities matrix
   Cells are heatmap-colored by toll cost per kilometer, on a fixed
   5-tier scale. The fixed scale (rather than data-relative) keeps
   the legend stable as prices change year-over-year and lets users
   build intuition: "Olympia Odos is always orange".
   Tier breakpoints (€/km, cat2 reference):
     tier-free   = 0           (no tolls on this route)
     tier-low    = (0, 0.03]   (~PATHE long-haul averages)
     tier-mid    = (0.03, 0.06]
     tier-high   = (0.06, 0.09]
     tier-peak   = > 0.09      (Olympia Odos, Rio bridge stretches)
   These thresholds fit 96% of the 238 valid pairs across all 4
   vehicle categories. cat3/cat4 routes shift toward higher tiers,
   which is the desired behaviour — heavy-vehicle pricing IS more
   punitive per km, and the heatmap should show it.
   ════════════════════════════════════════════════════════════════ */
function tierForPerKm(perKm) {
  if (perKm <= 0)    return 'tier-free';
  if (perKm <= 0.03) return 'tier-low';
  if (perKm <= 0.06) return 'tier-mid';
  if (perKm <= 0.09) return 'tier-high';
  return 'tier-peak';
}

function buildRoutesGrid() {
  const grid = document.getElementById('routes-grid');
  if (!grid) return;
  const lang = (typeof getCurrentLang === 'function') ? getCurrentLang() : 'el';
  // Vehicle is a global UI mode (not a per-page filter). Read the current
  // value from the shared accessor; updates arrive via `vehiclechange`.
  const catKey = (typeof window !== 'undefined' && window.getVehicleCat)
    ? window.getVehicleCat()
    : 'cat2';
  const cityName = c => lang === 'el' ? c.name_gr : c.name_en;

  const tollById = {};
  TOLL_DATA.forEach(t => tollById[t.id] = t);

  function computeCell(fromCity, toCity) {
    if (fromCity.id === toCity.id) return { type: 'self' };
    const route = getRoute(fromCity.id, toCity.id);
    if (!route) return { type: 'na' };

    let cost = 0;
    let validTolls = 0;
    route.tolls.forEach(id => {
      const tll = tollById[id];
      if (!tll) return;
      // Per-direction price: derived from the toll's axis and the city
      // coordinates (NS-axis tolls get northbound/southbound based on
      // whether the destination latitude is greater; EW-axis tolls use
      // eastbound/westbound based on longitude). Falls back to flat
      // cat fields when direction can't be inferred or no per-direction
      // value is set. Today this is identical to flat for all tolls,
      // but it's the right primitive once data diverges.
      const dir = (typeof window.directionFromCityPair === 'function')
        ? window.directionFromCityPair(tll, fromCity, toCity)
        : undefined;
      const price = (typeof window.getTollPrice === 'function')
        ? window.getTollPrice(tll, catKey, dir)
        : tll[catKey];
      if (typeof price === 'number') {
        cost += price;
        validTolls++;
      }
    });

    return {
      type: 'cell',
      cost,
      tollCount: validTolls,
      km: route.km,
      min: route.min,
    };
  }

  const cities = CITIES;
  let html = `<table class="routes-grid-table"><thead><tr><th class="routes-corner"></th>`;
  cities.forEach(c => {
    html += `<th>${cityName(c)}</th>`;
  });
  html += `</tr></thead><tbody>`;

  cities.forEach(fromCity => {
    html += `<tr><th>${cityName(fromCity)}</th>`;
    cities.forEach(toCity => {
      const cell = computeCell(fromCity, toCity);
      if (cell.type === 'self') {
        html += `<td class="routes-cell-self">·</td>`;
      } else if (cell.type === 'na') {
        html += `<td class="routes-cell-empty"></td>`;
      } else if (cell.tollCount === 0) {
        html += `<td class="routes-cell tier-free" data-from="${fromCity.id}" data-to="${toCity.id}" data-perkm="0">
          <div class="rc-price">€0</div>
          <div class="rc-meta">${cell.km}${t('routes.km')}</div>
          <div class="rc-perkm">€0/${t('routes.km')}</div>
        </td>`;
      } else {
        const perKm = cell.km > 0 ? (cell.cost / cell.km) : 0;
        const tier = tierForPerKm(perKm);
        html += `<td class="routes-cell ${tier}" data-from="${fromCity.id}" data-to="${toCity.id}" data-perkm="${perKm.toFixed(4)}">
          <div class="rc-price">€${cell.cost.toFixed(2)}</div>
          <div class="rc-meta">${cell.tollCount} ${cell.tollCount === 1 ? t('routes.toll') : t('routes.tolls')} · ${cell.km}${t('routes.km')}</div>
          <div class="rc-perkm">€${perKm.toFixed(3)}/${t('routes.km')}</div>
        </td>`;
      }
    });
    html += `</tr>`;
  });
  html += `</tbody></table>`;

  grid.innerHTML = html;

  // Wire cell clicks: jump to map page with origin/destination prefilled
  grid.querySelectorAll('.routes-cell[data-from]').forEach(cell => {
    cell.addEventListener('click', () => {
      const fromCity = cities.find(c => c.id === cell.dataset.from);
      const toCity   = cities.find(c => c.id === cell.dataset.to);
      if (!fromCity || !toCity) return;
      const fromInput = document.getElementById('origin');
      const toInput   = document.getElementById('dest');
      if (fromInput) fromInput.value = cityName(fromCity);
      if (toInput)   toInput.value   = cityName(toCity);
      navigateTo('map');
    });
  });

  // Re-apply the active filter (if any) after a re-render. The filter state
  // lives on the page wrapper, not in the table, so it survives renders.
  applyRoutesFilter();
}

/* ── Routes filter ────────────────────────────────────────────────
   Two <select> dropdowns + a clear button at the top of the routes
   page. When both are picked, the matching cell gets a "is-focus"
   class and a summary card is shown above the matrix. Other cells
   fade so the eye lands on the answer quickly.
   Native <select> is the right call here: 16 cities, no need to
   debug autocomplete, accessible by default, and works on mobile
   without any extra mobile keyboard logic.
   ─────────────────────────────────────────────────────────────── */
function populateRoutesFilter() {
  const fromSel = document.getElementById('routes-filter-from');
  const toSel   = document.getElementById('routes-filter-to');
  if (!fromSel || !toSel) return;
  const lang = (typeof getCurrentLang === 'function') ? getCurrentLang() : 'el';
  const cityName = c => lang === 'el' ? c.name_gr : c.name_en;

  // Preserve current selections across re-population (language switch etc.)
  const prevFrom = fromSel.value;
  const prevTo   = toSel.value;

  const placeholder = lang === 'el' ? '— επίλεξε —' : '— select —';
  const optsHtml = `<option value="">${placeholder}</option>` +
    CITIES.map(c => `<option value="${c.id}">${cityName(c)}</option>`).join('');

  fromSel.innerHTML = optsHtml;
  toSel.innerHTML   = optsHtml;
  if (prevFrom) fromSel.value = prevFrom;
  if (prevTo)   toSel.value   = prevTo;
}

function applyRoutesFilter() {
  const grid = document.getElementById('routes-grid');
  const summary = document.getElementById('routes-filter-summary');
  const fromSel = document.getElementById('routes-filter-from');
  const toSel   = document.getElementById('routes-filter-to');
  if (!grid || !fromSel || !toSel) return;

  const fromId = fromSel.value;
  const toId   = toSel.value;
  const hasBoth = !!fromId && !!toId;

  grid.classList.toggle('is-filtered', hasBoth);

  // Clear previous focus highlight
  grid.querySelectorAll('.routes-cell.is-focus').forEach(el => el.classList.remove('is-focus'));

  if (!hasBoth) {
    if (summary) summary.hidden = true;
    return;
  }

  // Find the matching cell and decorate it
  const cell = grid.querySelector(`.routes-cell[data-from="${fromId}"][data-to="${toId}"]`);
  if (cell) {
    cell.classList.add('is-focus');
    // Scroll the cell into view horizontally — the row header is sticky on
    // the left, so we only need to nudge horizontally.
    if (cell.scrollIntoView) {
      cell.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }

  // Render the summary card
  if (summary) {
    const lang = (typeof getCurrentLang === 'function') ? getCurrentLang() : 'el';
    const cityName = c => lang === 'el' ? c.name_gr : c.name_en;
    const fromCity = CITIES.find(c => c.id === fromId);
    const toCity   = CITIES.find(c => c.id === toId);
    if (fromCity && toCity && fromCity.id !== toCity.id) {
      const route = getRoute(fromCity.id, toCity.id);
      const catKey = (typeof window !== 'undefined' && window.getVehicleCat)
        ? window.getVehicleCat()
        : 'cat2';
      const tollById = {};
      TOLL_DATA.forEach(x => tollById[x.id] = x);

      let cost = 0, n = 0;
      if (route) {
        route.tolls.forEach(id => {
          const x = tollById[id];
          if (x && typeof x[catKey] === 'number') { cost += x[catKey]; n++; }
        });
      }

      const km   = route ? route.km : 0;
      const min  = route ? route.min : 0;
      const perKm = (km > 0 && n > 0) ? cost / km : 0;
      const tier = route ? tierForPerKm(perKm) : 'tier-free';
      const arrow = '→';
      const noTolls = route && n === 0;
      const noRoute = !route;

      let priceLine;
      if (noRoute) {
        priceLine = `<span class="rfs-price-na">${lang === 'el' ? 'Δεν υπάρχει διαδρομή' : 'No route available'}</span>`;
      } else if (noTolls) {
        priceLine = `<span class="rfs-price">€0</span>
                     <span class="rfs-price-sub">${lang === 'el' ? '· χωρίς διόδια' : '· no tolls'}</span>`;
      } else {
        priceLine = `<span class="rfs-price">€${cost.toFixed(2)}</span>
                     <span class="rfs-price-sub">· €${perKm.toFixed(3)}/${t('routes.km')}</span>`;
      }

      const metaParts = [];
      if (n > 0) metaParts.push(`${n} ${n === 1 ? t('routes.toll') : t('routes.tolls')}`);
      if (km > 0) metaParts.push(`${km}${t('routes.km')}`);
      if (min > 0) {
        const h = Math.floor(min / 60), m = min % 60;
        metaParts.push(h > 0 ? `${h}h ${m}m` : `${m}m`);
      }

      const ctaLabel = lang === 'el' ? 'Άνοιγμα στον χάρτη' : 'Open on map';

      summary.innerHTML = `
        <div class="rfs-row">
          <div class="rfs-pair">
            <span class="rfs-from">${cityName(fromCity)}</span>
            <span class="rfs-arrow">${arrow}</span>
            <span class="rfs-to">${cityName(toCity)}</span>
          </div>
          <div class="rfs-tier ${tier}" aria-hidden="true"></div>
          <div class="rfs-price-block">${priceLine}</div>
          <div class="rfs-meta">${metaParts.join(' · ')}</div>
          <button class="rfs-cta" type="button" id="routes-filter-cta">${ctaLabel} →</button>
        </div>
      `;
      summary.hidden = false;

      // Wire CTA button to the same nav-with-prefill path as cell clicks
      const cta = document.getElementById('routes-filter-cta');
      if (cta) {
        cta.addEventListener('click', () => {
          const fromInput = document.getElementById('origin');
          const toInput   = document.getElementById('dest');
          if (fromInput) fromInput.value = cityName(fromCity);
          if (toInput)   toInput.value   = cityName(toCity);
          navigateTo('map');
        });
      }
    } else {
      summary.hidden = true;
    }
  }
}

function initRoutesFilterControls() {
  const fromSel = document.getElementById('routes-filter-from');
  const toSel   = document.getElementById('routes-filter-to');
  const swapBtn = document.getElementById('routes-filter-swap');
  const clearBtn = document.getElementById('routes-filter-clear');
  if (!fromSel || !toSel) return;

  // Idempotent: only attach handlers once per element. The page-active
  // handler can call this multiple times (re-entry into the routes page).
  if (!fromSel.dataset.wired) {
    fromSel.dataset.wired = '1';
    fromSel.addEventListener('change', applyRoutesFilter);
  }
  if (!toSel.dataset.wired) {
    toSel.dataset.wired = '1';
    toSel.addEventListener('change', applyRoutesFilter);
  }
  if (swapBtn && !swapBtn.dataset.wired) {
    swapBtn.dataset.wired = '1';
    swapBtn.addEventListener('click', () => {
      const a = fromSel.value, b = toSel.value;
      fromSel.value = b;
      toSel.value = a;
      applyRoutesFilter();
    });
  }
  if (clearBtn && !clearBtn.dataset.wired) {
    clearBtn.dataset.wired = '1';
    clearBtn.addEventListener('click', () => {
      fromSel.value = '';
      toSel.value = '';
      applyRoutesFilter();
    });
  }
}

// Re-render the routes grid when the global vehicle changes (from any
// .veh-toggle on the page — topbar or page header).
window.addEventListener('vehiclechange', () => {
  if (document.getElementById('page-routes')?.classList.contains('page-active')) {
    buildRoutesGrid();
  }
});

/* ════════════════════════════════════════════════════════════════
   TOLLS PAGE — sortable, filterable table with bypass advisor
   ════════════════════════════════════════════════════════════════ */
let tollsSortColumn = 'name';
let tollsSortDir    = 'asc';

// Verdict ranking for sort-by-verdict: AVOID first, then leans, then PAY,
// then "no bypass" tolls last.
const VERDICT_RANK = { AVOID: 0, MARGINAL_AVOID: 1, MARGINAL_PAY: 2, PAY: 3 };

function buildTollsTable() {
  const tbody = document.getElementById('tolls-tbody');
  if (!tbody) return;
  const lang   = (typeof getCurrentLang === 'function') ? getCurrentLang() : 'el';
  const search = (document.getElementById('tolls-search')?.value || '').toLowerCase().trim();
  const hwyFilter  = document.getElementById('tolls-highway-filter')?.value || '';
  // Vehicle is global UI mode — read from the shared accessor, updates via
  // `vehiclechange`. Same pattern as the routes grid.
  const catKey     = (typeof window !== 'undefined' && window.getVehicleCat)
    ? window.getVehicleCat()
    : 'cat2';
  const timeValue  = parseInt(document.getElementById('tolls-time-slider')?.value || '5', 10);
  const avoidOnly  = !!document.getElementById('tolls-avoid-only')?.checked;

  // Sync the slider's numeric readout and gradient fill
  const timeNum = document.getElementById('tolls-time-num');
  if (timeNum) timeNum.textContent = timeValue;
  const timeSliderEl = document.getElementById('tolls-time-slider');
  if (timeSliderEl) {
    const min = parseFloat(timeSliderEl.min) || 0;
    const max = parseFloat(timeSliderEl.max) || 100;
    timeSliderEl.style.setProperty('--fill', (((timeValue - min) / (max - min)) * 100) + '%');
  }

  // Populate (or re-populate) the highway filter dropdown with full
  // i18n'd names in the current language. Re-runs every buildTollsTable
  // invocation so language switches update labels — preserves the
  // currently-selected value across the rebuild.
  const hwySel = document.getElementById('tolls-highway-filter');
  if (hwySel) {
    const prevValue = hwySel.value;
    const seen = new Set();
    TOLL_DATA.forEach(t => seen.add(t.highway));
    // Sort by translated label so the dropdown reads in alphabetical
    // order in whichever language the user is viewing.
    const hwys = [...seen].map(hwy => ({ code: hwy, label: t('hwy.' + hwy) }))
                          .sort((a, b) => a.label.localeCompare(b.label, lang));
    // Keep the leading "all" option that's already in the static markup;
    // remove any existing data-driven options below it before re-adding.
    while (hwySel.options.length > 1) hwySel.remove(1);
    hwys.forEach(({ code, label }) => {
      const opt = document.createElement('option');
      opt.value = code;
      opt.textContent = label;
      hwySel.appendChild(opt);
    });
    // Restore previous selection if it's still valid.
    if (prevValue && [...hwySel.options].some(o => o.value === prevValue)) {
      hwySel.value = prevValue;
    }
  }

  // Compute per-direction verdicts. A toll has 1, 2, or 3 directions in
  // bypass_directions; we evaluate each separately so the table can show
  // e.g. "AVOID northbound · PAY southbound" instead of collapsing into one.
  const computeVerdicts = (toll) => {
    if (typeof window.calcTollVerdictsByDirection !== 'function') return {};
    return window.calcTollVerdictsByDirection(toll, catKey, timeValue);
  };

  // Best (lowest-rank) verdict across all directions — used for the
  // "verdict" column sort and for the avoidOnly filter.
  const bestVerdict = (verdicts) => {
    const list = Object.values(verdicts);
    if (!list.length) return null;
    return list.reduce((best, v) => {
      const r = VERDICT_RANK[v.verdict] ?? 99;
      const br = VERDICT_RANK[best?.verdict] ?? 99;
      return r < br ? v : best;
    }, list[0]);
  };

  let rows = TOLL_DATA.map(toll => {
    const verdicts = computeVerdicts(toll);
    return { toll, verdicts, best: bestVerdict(verdicts) };
  });
  const totalCount = rows.length;

  if (search) {
    rows = rows.filter(({ toll: t }) =>
      (t.name_gr || '').toLowerCase().includes(search) ||
      (t.name_en || '').toLowerCase().includes(search) ||
      (t.operator || '').toLowerCase().includes(search) ||
      (t.highway || '').toLowerCase().includes(search)
    );
  }
  if (hwyFilter) {
    rows = rows.filter(r => r.toll.highway === hwyFilter);
  }
  if (avoidOnly) {
    // Keep tolls where at least ONE direction is worth bypassing.
    rows = rows.filter(r => Object.values(r.verdicts).some(v => v.verdict === 'AVOID'));
  }

  // Sort
  rows.sort((a, b) => {
    let av, bv;
    if (tollsSortColumn === 'name') {
      av = lang === 'el' ? (a.toll.name_gr || a.toll.name_en || '') : (a.toll.name_en || a.toll.name_gr || '');
      bv = lang === 'el' ? (b.toll.name_gr || b.toll.name_en || '') : (b.toll.name_en || b.toll.name_gr || '');
      return tollsSortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    }
    if (tollsSortColumn === 'highway') {
      av = a.toll.highway; bv = b.toll.highway;
      return tollsSortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    }
    if (tollsSortColumn === 'bypass') {
      const minOf = (toll) => {
        const bd = toll.bypass_directions;
        if (!bd) return Infinity;
        const mins = Object.values(bd).map(d => d?.minutes ?? Infinity);
        return mins.length ? Math.min(...mins) : Infinity;
      };
      av = minOf(a.toll); bv = minOf(b.toll);
      return tollsSortDir === 'asc' ? av - bv : bv - av;
    }
    if (tollsSortColumn === 'verdict') {
      // Sort by the best (lowest-rank) verdict per toll: AVOID first, then
      // MARGINAL, then PAY, then "no bypass" tolls last.
      av = VERDICT_RANK[a.best?.verdict] ?? 99;
      bv = VERDICT_RANK[b.best?.verdict] ?? 99;
      return tollsSortDir === 'asc' ? av - bv : bv - av;
    }
    // Numeric (cat1..cat4)
    av = a.toll[tollsSortColumn] ?? 0;
    bv = b.toll[tollsSortColumn] ?? 0;
    return tollsSortDir === 'asc' ? av - bv : bv - av;
  });

  // Update result count
  const countEl = document.getElementById('tolls-count');
  if (countEl) {
    countEl.textContent = t('tolls.advisor.count', { n: rows.length, total: totalCount });
  }

  // Render rows
  const dirArrow = (key) =>
    key === 'northbound' ? '↑' :
    key === 'southbound' ? '↓' :
    key === 'eastbound'  ? '→' :
    key === 'westbound'  ? '←' : key;

  let html = '';
  rows.forEach(({ toll, verdicts }) => {
    const primary = stripTollPrefix(lang === 'el' ? toll.name_gr : toll.name_en);
    const hwyColor = HIGHWAY_COLORS[toll.highway] || '#888';

    let bypassHtml = '';
    if (!toll.bypass_directions) {
      bypassHtml = `<span class="tolls-bypass-na">${t('tolls.bypass.none')}</span>`;
    } else {
      const lines = Object.entries(toll.bypass_directions).map(([key, d]) => {
        // Small confidence dot before each line. Verified = none (clean state),
        // auto = subtle blue dot, approximate = amber warning dot.
        let conf = '';
        if (d.confidence === 'auto') {
          conf = `<span class="tolls-bypass-conf tbc-auto" title="${t('sp.confidence.tooltip.auto')}"></span>`;
        } else if (d.confidence === 'approximate') {
          conf = `<span class="tolls-bypass-conf tbc-approx" title="${t('sp.confidence.tooltip.approximate')}">⚠</span>`;
        }
        return `<span class="tolls-bypass-line" title="${d.label || ''}">${conf}${dirArrow(key)} +${d.minutes ?? '?'}${t('routes.min')}</span>`;
      });
      bypassHtml = `<span class="tolls-bypass-stack">${lines.join('')}</span>`;
    }

    // Verdict cell: one stacked row per direction. The "+X min" subtitle
    // only appears for the bypass-side verdicts (AVOID / MARGINAL_AVOID),
    // since the bypass column already shows the same number for every
    // direction — repeating it on the PAY side just clutters.
    let verdictHtml;
    if (!toll.bypass_directions || Object.keys(verdicts).length === 0) {
      verdictHtml = `<span class="tolls-verdict tolls-verdict-none">${t('verdict.no.bypass.short')}</span>`;
    } else {
      const lines = Object.entries(verdicts).map(([key, { verdict, dir }]) => {
        const icon  = verdict === 'AVOID' ? '✕'
                    : verdict === 'PAY'   ? '€'
                    : '~';
        // i18n key: 'MARGINAL_AVOID' -> 'verdict.marginal.avoid'
        const label = t(`verdict.${verdict.toLowerCase().replace('_', '.')}`);
        const showSub = (verdict === 'AVOID' || verdict === 'MARGINAL_AVOID') && dir;
        const sub   = showSub ? `+${dir.minutes}${t('routes.min')}` : '';
        return `<span class="tolls-verdict tolls-verdict-${verdict}" title="${dir?.label || ''}">
          <span class="tv-arrow">${dirArrow(key)}</span>
          <span class="tv-icon">${icon}</span>
          <span class="tv-label">${label}</span>
          ${sub ? `<span class="tv-sub">${sub}</span>` : ''}
        </span>`;
      });
      verdictHtml = `<span class="tolls-verdict-stack">${lines.join('')}</span>`;
    }

    html += `<tr>
      <td>
        <div class="tolls-name" data-toll-id="${toll.id}">${primary}</div>
      </td>
      <td><span class="tolls-hwy-chip"><span class="tolls-hwy-dot" style="background:${hwyColor}"></span>${toll.highway}</span></td>
      <td><span class="tolls-price${catKey === 'cat1' ? ' active' : ''}">€${(toll.cat1 ?? 0).toFixed(2)}</span></td>
      <td><span class="tolls-price${catKey === 'cat2' ? ' active' : ''}">€${(toll.cat2 ?? 0).toFixed(2)}</span></td>
      <td><span class="tolls-price${catKey === 'cat3' ? ' active' : ''}">€${(toll.cat3 ?? 0).toFixed(2)}</span></td>
      <td><span class="tolls-price${catKey === 'cat4' ? ' active' : ''}">€${(toll.cat4 ?? 0).toFixed(2)}</span></td>
      <td>${bypassHtml}</td>
      <td>${verdictHtml}</td>
    </tr>`;
  });
  tbody.innerHTML = html;

  // Mark sorted column
  document.querySelectorAll('#tolls-table thead th').forEach(th => {
    th.classList.remove('sorted-asc', 'sorted-desc');
    if (th.dataset.sort === tollsSortColumn) {
      th.classList.add(tollsSortDir === 'asc' ? 'sorted-asc' : 'sorted-desc');
    }
    // Mark the active vehicle's column header so CSS tints the
    // column-strip top-to-bottom (header + data cells). The data
    // cells use :has(.tolls-price.active); the header is data-driven
    // so it stays in sync without :has() across browsers.
    if (th.dataset.sort === catKey) {
      th.setAttribute('data-active', 'true');
    } else {
      th.removeAttribute('data-active');
    }
  });

  // Wire name clicks: jump to map and open that toll's side panel
  tbody.querySelectorAll('.tolls-name[data-toll-id]').forEach(nameEl => {
    nameEl.addEventListener('click', () => {
      const id = nameEl.dataset.tollId;
      const toll = TOLL_DATA.find(t => t.id === id);
      if (!toll) return;
      navigateTo('map');
      // Wait for map page to be visible, then center and open
      setTimeout(() => {
        if (typeof window._dmap !== 'undefined' && typeof window.openSidePanelById === 'function') {
          window._dmap.setView([toll.lat, toll.lng], 12, { animate: true });
          window.openSidePanelById(id);
        }
      }, 300);
    });
  });
}

// Wire all tolls-page inputs through event delegation
document.addEventListener('input', e => {
  const id = e.target?.id;
  if (id === 'tolls-search' || id === 'tolls-time-slider') buildTollsTable();
});
document.addEventListener('change', e => {
  const id = e.target?.id;
  if (id === 'tolls-highway-filter' || id === 'tolls-avoid-only') buildTollsTable();
});
// Re-render the tolls table when global vehicle changes (and we're on it).
window.addEventListener('vehiclechange', () => {
  if (document.getElementById('page-tolls')?.classList.contains('page-active')) {
    buildTollsTable();
  }
});
document.addEventListener('click', e => {
  const th = e.target.closest('#tolls-table thead th');
  if (!th || !th.dataset.sort) return;
  const col = th.dataset.sort;
  if (tollsSortColumn === col) {
    tollsSortDir = tollsSortDir === 'asc' ? 'desc' : 'asc';
  } else {
    tollsSortColumn = col;
    tollsSortDir = 'asc';
  }
  buildTollsTable();
});

/* ════════════════════════════════════════════════════════════════
   MOBILE HAMBURGER DRAWER
   ════════════════════════════════════════════════════════════════ */
(function() {
  const btn      = document.getElementById('hamburger-btn');
  const drawer   = document.getElementById('mobile-drawer');
  const overlay  = document.getElementById('mobile-drawer-overlay');
  const closeBtn = document.getElementById('mobile-drawer-close');
  if (!btn || !drawer) return;

  function open()  { drawer.classList.add('open');  document.body.style.overflow = 'hidden'; }
  function close() { drawer.classList.remove('open'); document.body.style.overflow = ''; }

  btn.addEventListener('click', open);
  closeBtn?.addEventListener('click', close);
  overlay?.addEventListener('click', close);

  // Drawer nav links → navigate + close drawer
  drawer.querySelectorAll('.mobile-nav-link').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      navigateTo(a.dataset.page);
      close();
    });
  });

  // Help button inside drawer → open help popover. We position it under
  // the hamburger-btn since on mobile the overflow trigger is hidden and
  // the hamburger is what's visually adjacent.
  const mobileHelpBtn = document.getElementById('mobile-help-btn');
  if (mobileHelpBtn) {
    mobileHelpBtn.addEventListener('click', () => {
      close();
      const anchor = document.getElementById('hamburger-btn') || document.body;
      if (typeof window.openHelpPopover === 'function') {
        // Defer so the drawer's close transition runs first; otherwise
        // the popover and the closing drawer overlap visually.
        setTimeout(() => window.openHelpPopover(anchor), 100);
      }
    });
  }
})();
