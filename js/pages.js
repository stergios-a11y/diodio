/* ════════════════════════════════════════════════════════════════
   DIODIO — Multi-page hash router
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
  document.querySelectorAll('.nav-link').forEach(el => {
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

  function fmtTime(min) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (h > 0) return `${h}${t('routes.hr')} ${m}${t('routes.min')}`;
    return `${m}${t('routes.min')}`;
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
          <div class="rc-meta">${cell.km}km · ${fmtTime(cell.min)}</div>
        </td>`;
      } else {
        html += `<td class="routes-cell" data-from="${fromCity.id}" data-to="${toCity.id}">
          <div class="rc-price">€${cell.cost.toFixed(2)}</div>
          <div class="rc-meta">${cell.tollCount} ${cell.tollCount === 1 ? t('routes.toll') : t('routes.tolls')} · ${cell.km}km · ${fmtTime(cell.min)}</div>
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
   TOLLS PAGE — sortable, filterable table
   ════════════════════════════════════════════════════════════════ */
let tollsSortColumn = 'name';
let tollsSortDir    = 'asc';

function buildTollsTable() {
  const tbody = document.getElementById('tolls-tbody');
  if (!tbody) return;
  const lang   = (typeof getCurrentLang === 'function') ? getCurrentLang() : 'el';
  const search = (document.getElementById('tolls-search')?.value || '').toLowerCase().trim();
  const hwyFilter = document.getElementById('tolls-highway-filter')?.value || '';

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

  let rows = TOLL_DATA.slice();

  if (search) {
    rows = rows.filter(t =>
      (t.name_gr || '').toLowerCase().includes(search) ||
      (t.name_en || '').toLowerCase().includes(search) ||
      (t.operator || '').toLowerCase().includes(search) ||
      (t.highway || '').toLowerCase().includes(search)
    );
  }
  if (hwyFilter) {
    rows = rows.filter(r => r.highway === hwyFilter);
  }

  // Sort
  rows.sort((a, b) => {
    let av, bv;
    if (tollsSortColumn === 'name') {
      av = lang === 'el' ? (a.name_gr || a.name_en || '') : (a.name_en || a.name_gr || '');
      bv = lang === 'el' ? (b.name_gr || b.name_en || '') : (b.name_en || b.name_gr || '');
      return tollsSortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    }
    if (tollsSortColumn === 'highway') {
      av = a.highway; bv = b.highway;
      return tollsSortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    }
    if (tollsSortColumn === 'bypass') {
      const minOf = (toll) => {
        const bd = toll.bypass_directions;
        if (!bd) return Infinity;
        const mins = Object.values(bd).map(d => d?.minutes ?? Infinity);
        return mins.length ? Math.min(...mins) : Infinity;
      };
      av = minOf(a); bv = minOf(b);
      return tollsSortDir === 'asc' ? av - bv : bv - av;
    }
    // Numeric (cat1..cat4)
    av = a[tollsSortColumn] ?? 0;
    bv = b[tollsSortColumn] ?? 0;
    return tollsSortDir === 'asc' ? av - bv : bv - av;
  });

  // Render rows
  let html = '';
  rows.forEach(toll => {
    const primary = lang === 'el' ? toll.name_gr : toll.name_en;
    const secondary = lang === 'el' ? toll.name_en : toll.name_gr;
    const hwyColor = HIGHWAY_COLORS[toll.highway] || '#888';

    let bypassHtml = '';
    if (!toll.bypass_directions) {
      bypassHtml = `<span class="tolls-bypass-na">${t('tolls.bypass.none')}</span>`;
    } else {
      const parts = Object.entries(toll.bypass_directions).map(([key, dir]) => {
        const dirShort = key === 'north' ? '↑' : key === 'south' ? '↓' : key === 'east' ? '→' : key === 'west' ? '←' : key;
        return `<span title="${dir.label || ''}">${dirShort} +${dir.minutes ?? '?'}${t('routes.min')}</span>`;
      });
      bypassHtml = `<span class="tolls-bypass">${parts.join(' · ')}</span>`;
    }

    html += `<tr>
      <td>
        <div class="tolls-name" data-toll-id="${toll.id}">${primary}</div>
        <div class="tolls-name-gr">${secondary}</div>
      </td>
      <td><span class="tolls-hwy-chip"><span class="tolls-hwy-dot" style="background:${hwyColor}"></span>${toll.highway}</span></td>
      <td><span class="tolls-price">€${(toll.cat1 ?? 0).toFixed(2)}</span></td>
      <td><span class="tolls-price">€${(toll.cat2 ?? 0).toFixed(2)}</span></td>
      <td><span class="tolls-price">€${(toll.cat3 ?? 0).toFixed(2)}</span></td>
      <td><span class="tolls-price">€${(toll.cat4 ?? 0).toFixed(2)}</span></td>
      <td>${bypassHtml}</td>
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

// Wire search and filter inputs (event delegation, runs always)
document.addEventListener('input', e => {
  if (e.target?.id === 'tolls-search') buildTollsTable();
});
document.addEventListener('change', e => {
  if (e.target?.id === 'tolls-highway-filter') buildTollsTable();
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
