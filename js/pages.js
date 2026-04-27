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
  if (page === 'routes') buildRoutesGrid();
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
    if (getCurrentPage() === 'routes') buildRoutesGrid();
    if (getCurrentPage() === 'tolls')  buildTollsTable();
  });
});

/* ════════════════════════════════════════════════════════════════
   ROUTES PAGE — 15 cities × 15 cities matrix
   ════════════════════════════════════════════════════════════════ */
function buildRoutesGrid() {
  const grid = document.getElementById('routes-grid');
  if (!grid) return;
  const lang = (typeof getCurrentLang === 'function') ? getCurrentLang() : 'el';
  const vehicleSel = document.getElementById('routes-vehicle');
  const catKey = vehicleSel?.value || 'cat2';
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
      const t = tollById[id];
      if (t && typeof t[catKey] === 'number') {
        cost += t[catKey];
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
        html += `<td class="routes-cell" data-from="${fromCity.id}" data-to="${toCity.id}">
          <div class="rc-price">€0</div>
          <div class="rc-meta">${cell.km}km</div>
          <div class="rc-perkm">€0/km</div>
        </td>`;
      } else {
        const perKm = cell.km > 0 ? (cell.cost / cell.km) : 0;
        html += `<td class="routes-cell" data-from="${fromCity.id}" data-to="${toCity.id}">
          <div class="rc-price">€${cell.cost.toFixed(2)}</div>
          <div class="rc-meta">${cell.tollCount} ${cell.tollCount === 1 ? t('routes.toll') : t('routes.tolls')} · ${cell.km}km</div>
          <div class="rc-perkm">€${perKm.toFixed(3)}/km</div>
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
}

document.addEventListener('change', e => {
  if (e.target?.id === 'routes-vehicle') buildRoutesGrid();
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
  const catKey     = document.getElementById('tolls-vehicle')?.value || 'cat2';
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

  // Populate highway filter dropdown if empty
  const hwySel = document.getElementById('tolls-highway-filter');
  if (hwySel && hwySel.options.length <= 1) {
    const seen = new Set();
    TOLL_DATA.forEach(t => seen.add(t.highway));
    [...seen].sort().forEach(hwy => {
      const opt = document.createElement('option');
      opt.value = hwy;
      opt.textContent = hwy;
      hwySel.appendChild(opt);
    });
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
    const secondary = stripTollPrefix(lang === 'el' ? toll.name_en : toll.name_gr);
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
        <div class="tolls-name-gr">${secondary}</div>
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
  if (id === 'tolls-highway-filter' || id === 'tolls-vehicle' || id === 'tolls-avoid-only') buildTollsTable();
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

  // Help button inside drawer → trigger main help modal
  const mobileHelpBtn = document.getElementById('mobile-help-btn');
  if (mobileHelpBtn) {
    mobileHelpBtn.addEventListener('click', () => {
      close();
      const mainHelpBtn = document.getElementById('help-btn');
      if (mainHelpBtn) mainHelpBtn.click();
    });
  }
})();
