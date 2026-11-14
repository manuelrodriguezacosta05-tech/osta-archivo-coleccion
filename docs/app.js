'use strict';
/* Osta · Archivo de la colección — web estática que lee data.json (generado por pipeline/update.py). */
const $ = id => document.getElementById(id);
const E = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const N = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const num = n => Number(n || 0).toLocaleString('es-ES');
const cmp = (a, b) => String(a ?? '').localeCompare(String(b ?? ''), 'es', {numeric: true});

const VIEWS = {overview: 'Vista general', collection: 'Mi colección', buildable: 'Puedes montar', missing: 'Me falta',
  catalogue: 'Catálogo del juego', workshop: 'Pendientes', photos: 'Fotos y dudas', updates: 'Datos y actualizaciones'};
const STATES = {complete: 'Ya completo', buildable: 'Puedes montarlo', repair: 'Pendiente de reparar', incomplete: 'Incompleto', missing: 'Por conseguir'};
const STATE_COLOR = {complete: '', buildable: 'blue', repair: 'red', incomplete: 'amber', missing: 'gray'};
const SLOTS = {Liner: 'Interior', Stock: 'Culata', Magazine: 'Cargador', Bolt: 'Cerrojo', Handguard: 'Guardamanos', Grips: 'Cachas',
  PistolGrip: 'Empuñadura', Visor: 'Visor', Shell: 'Calota', Scope: 'Óptica', GasTube: 'Tubo de gases', Barrel: 'Cañón',
  Part1: 'Pieza 1', Part2: 'Pieza 2', Part3: 'Pieza 3'};
const HOUSES = [
  ['Estonia', 'Rusia imperial, URSS, Báltico y bloque oriental. Caza y transformaciones civiles en una sección propia.'],
  ['Francia', 'Alemania, Reino Unido, Estados Unidos, Francia y Bélgica. Cada sección ordenada por tipo y año del modelo.'],
  ['Afganistán', 'Armamento oriental de la Guerra Fría, material occidental moderno y tradición regional.']];
// Revisiones fotográficas ya hechas (imágenes en media/).
const REVIEWED = [
  ['pickelhaube-1891', 'M1891 Pickelhaube', 'Configuración visible de 1897 o posterior por la escarapela imperial. Nombre del juego conservado.', 'EE-1030'],
  ['pickelhaube-1915', 'M1915 Pickelhaube', 'Herrajes grises compatibles con el patrón de 1915. No se atribuye regimiento ni fabricante.', 'EE-1029'],
  ['gas-mask-canister', 'Bote antigás alemán', 'Equipo de campaña y protección antigás. 1938 procede de la denominación del juego.', 'EE-466'],
  ['charge-1kg', 'Carga alemana de 1 kg', 'Ingenieros y demolición. Atribución probable a Sprengbüchse 24; sin marcajes que confirmen el modelo.', 'EE-9'],
  ['mk108-round', 'Cartucho de 30 mm MK 108', 'Munición de aviación alemana. Familia identificada; carga exacta del proyectil sin confirmar.', 'EE-22'],
  ['german-88mm', '88 mm · conjunto montado', 'Vaina y German 88mm Shell. No se asigna a un cañón concreto ni se trata como vaina vacía.', 'EE-178'],
  ['german-77mm-gas', '7,7 cm · variante química del juego', 'Lleva 7,7cm Mustard Gas Shell. El archivo 77mmBlueCross no confirma su categoría química histórica.', 'EE-385'],
  ['german-77mm-shrapnel', '7,7 cm · metralla patrón 1896', 'Lleva 7,7cm 1896 Shrapnel Shell. Objetivo distinto y completo, separado de la variante química.', 'EE-384'],
  ['sd70', 'SD 70 · bomba aérea', 'Luftwaffe, Segunda Guerra Mundial. Cola de aletas visible; subtipo y espoleta sin atribuir.', 'EE-23'],
  ['french-37x149r', '37×149R · familia SA38', 'Francia. Referencia 1938 del sistema de carro; proyectil y fabricación concretos sin confirmar.', 'EE-395'],
  ['french-37x94r', '37×94R · familia antigua', 'Francia como origen de familia. Referencia francesa 1885; patrón exacto del proyectil sin confirmar.', 'EE-397'],
  ['french-75mm-shrapnel', '75 mm · probable familia 1897', 'Francia. Rasgos compatibles con metralla Mle 1897; fecha del patrón probable, no de fabricación.', 'EE-54'],
  ['french-25x194r', '25×194R · Hotchkiss anticarro', 'Francia. Referencia 1934 del sistema anticarro; año del cartucho y fabricante sin confirmar.', 'EE-1080'],
  ['us-m49a2-60mm', 'M49A2 · mortero de 60 mm', 'Estados Unidos · Segunda Guerra Mundial. Documentado en octubre de 1944; adopción y fabricación del ejemplar sin confirmar.', 'EE-34'],
  ['us-m43-81mm', 'M43 · mortero de 81 mm', 'Estados Unidos · Segunda Guerra Mundial. Documentado en abril de 1943; subvariante exacta y fabricación sin confirmar.', 'EE-45']];
const REPO_URL = 'https://github.com/manuelrodriguezacosta05-tech/osta-archivo-coleccion';
const PAGE_SIZE = 30;

let D = null, view = 'overview', page = 1, rows = [], workshop = 'repair', filters = baseFilters();
let byRef = new Map();

function baseFilters() { return {q: '', house: '', nation: '', category: '', section: '', state: '', sort: 'year', original: true, exhibit: false, completed: false}; }
const pill = (s, c = '') => '<span class="pill ' + c + '">' + E(s) + '</span>';
const badge = s => pill(STATES[s] || s, STATE_COLOR[s]);
const fmtDate = s => { if (!s) return 'pendiente'; const d = new Date(String(s).slice(0, 10) + 'T12:00:00Z'); return isNaN(d) ? s : new Intl.DateTimeFormat('es-ES', {day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'}).format(d); };
const fmtDateTime = s => { const d = new Date(s); return isNaN(d) ? (s || '') : new Intl.DateTimeFormat('es-ES', {dateStyle: 'long', timeStyle: 'short'}).format(d); };
const slotName = s => SLOTS[s] || s;
const doubts = () => (D.meta.doubts || []);

function toast(t) { const el = $('toast'); el.textContent = t; el.style.display = 'block'; clearTimeout(toast.t); toast.t = setTimeout(() => el.style.display = 'none', 4500); }
function closeNav() { document.body.classList.remove('nav-open'); $('menu').setAttribute('aria-expanded', 'false'); }

function navigate(v, query) {
  view = VIEWS[v] ? v : 'overview'; filters = baseFilters(); if (query) filters.q = query; page = 1;
  history.replaceState(null, '', '#' + view); closeNav(); render(); window.scrollTo({top: 0}); $('main').focus({preventScroll: true});
}
function heading(title, subtitle, actions = '') {
  return '<div class="page-heading"><div><div class="eyebrow">Archivo personal / ' + E(VIEWS[view]) + '</div><h1>' + E(title) + '</h1><p class="subtitle">' + E(subtitle) + '</p></div>' + actions + '</div>';
}
function buildableCount() { return D.variants.filter(v => v.state === 'buildable' && v.original_option !== false).length; }

function render() {
  document.querySelectorAll('#nav a').forEach(a => a.classList.toggle('active', a.dataset.view === view));
  $('breadcrumb').textContent = 'Archivo / ' + VIEWS[view];
  document.title = VIEWS[view] + ' · Osta · Archivo de la colección';
  $('sidebar-revision').textContent = D.meta.revision;
  $('nav-good').textContent = num(D.meta.good_count);
  $('nav-workshop').textContent = num(D.meta.repair_count + D.meta.incomplete_count);
  $('nav-buildable').textContent = num(buildableCount());
  $('nav-doubts').textContent = num(D.meta.photos_pending + doubts().length);
  $('alerts').innerHTML = (D.meta.alerts || []).map(a => '<div class="notice alert"><b>' + E(a.tipo) + '.</b> ' + E(a.detalle) + '</div>').join('');
  if (view === 'overview') renderOverview(); else if (view === 'photos') renderPhotos(); else if (view === 'updates') renderUpdates(); else renderList();
}

/* ---------- Vista general ---------- */
function variantExamples() {
  // Modelos con dos o más opciones completas (culata, interior, proyectil…): muestran por qué importa el montaje.
  const groups = new Map();
  for (const v of D.variants) if (v.state === 'complete' && v.target && v.original_option !== false) {
    const k = v.name + '|' + v.axis; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(v);
  }
  return [...groups.values()].filter(g => g.length > 1).sort((a, b) => b.length - a.length || cmp(a[0].name, b[0].name)).slice(0, 2);
}
function renderOverview() {
  const m = D.meta, original = D.variants.filter(v => v.original_option !== false), achieved = original.filter(v => v.state === 'complete').length;
  const ex = variantExamples();
  $('main').innerHTML =
    '<section class="hero"><div class="hero-copy"><div class="eyebrow">Tres casas. Una colección.</div><h1>Tu colección,<br>pieza por pieza.</h1><p class="subtitle">Cada arma con su montaje. Cada casco con su interior. Un archivo para saber qué tienes, dónde exponerlo y qué te falta.</p><div class="actions"><button class="btn primary" data-go="collection">Explorar mi colección →</button><button class="btn" data-go="missing">Ver lo que me falta</button></div></div>' +
    '<div class="hero-art"><img src="media/pickelhaube-1891.webp" alt="M1891 Pickelhaube de la colección en Osta"><div class="hero-caption"><small>DE TU COLECCIÓN</small><p>Una pieza. Su historia. Su lugar.</p></div></div></section>' +
    '<div class="stats">' +
    stat('La colección', num(m.inventory_count), 'objetos inventariados', 'Guardados de tus tres casas') +
    stat('Para exponer', num(m.display_count), 'seleccionados en buen estado', 'Sin dañados ni incompletos') +
    stat('Objetivos cubiertos', num(achieved) + ' <span>/ ' + num(original.length) + '</span>', 'modelos y opciones originales completos', 'Un objeto puede cubrir varios objetivos') +
    stat('El siguiente paso', num(buildableCount()), 'objetivos que puedes montar', 'Con bases y repuestos de tus guardados', '<button class="row-title text-link" data-go="buildable">Ver qué puedo montar →</button>') +
    '</div>' +
    '<div class="section-heading"><h2>Un lugar para cada historia</h2><span class="timeline-note">Propuesta de exposición · no se han movido objetos</span></div><div class="house-grid">' +
    HOUSES.map(([h, t]) => { const n = D.inventory.filter(r => r.display_house === h && r.display_selected && r.health_group === 'good').length;
      return '<article class="house"><div class="house-strip"></div><div class="house-inner"><div class="eyebrow">Casa recomendada</div><h3>' + h + '</h3><p>' + t + '</p><div class="house-footer"><b>' + num(n) + ' piezas para exposición</b><button class="row-title text-link" data-house="' + h + '">Ver piezas →</button></div></div></article>'; }).join('') +
    '</div><div class="two-col"><section class="panel"><div class="eyebrow">Variantes que importan</div><h2>El montaje cambia la ficha</h2>' +
    (ex.length ? ex.map(g => '<div class="example"><strong>' + E(g[0].name) + ' · ' + g.length + ' opciones de ' + E(slotName(g[0].axis).toLowerCase()) + '</strong><p>' +
      g.slice(0, 3).map(v => E(v.refs.slice(0, 2).join(', ')) + ' lleva ' + E(v.target.name)).join('. ') + '. Cada opción cuenta como un objetivo distinto.</p><button class="row-title text-link" data-query="' + E(g[0].name) + '" data-target="missing" data-completed="1">Comparar variantes →</button></div>').join('')
      : '<p class="subtitle">Aún no hay modelos con varias opciones completas.</p>') +
    '</section><section class="panel"><div class="eyebrow">Trabajo por hacer</div><h2>La exposición y el taller, separados</h2>' +
    '<div class="example"><strong>' + num(m.repair_count) + ' pendientes de reparar</strong><p>Incluye los dañados que también necesitan piezas.</p><button class="row-title text-link" data-workshop="repair">Abrir pendientes de reparar →</button></div>' +
    '<div class="example"><strong>' + num(m.incomplete_count) + ' incompletos</strong><p>Sin daño marcado, pero con montaje pendiente.</p><button class="row-title text-link" data-workshop="incomplete">Consultar faltantes →</button></div>' +
    '<div class="example"><strong>' + m.photos_pending + ' grupos con fotos pendientes' + (doubts().length ? ' · ' + doubts().length + ' dudas del lector' : '') + '</strong><p>Identificaciones por confirmar y casos que el lector no decide solo.</p><button class="row-title text-link" data-go="photos">Continuar las identificaciones →</button></div></section></div>' +
    '<div class="notice"><b>Estado de los datos.</b> ' + HOUSES.map(([h]) => h + ': ' + E(fmtDate(m.snapshot_dates[h]))).join('. ') + '. ' + E(m.scope) + '</div>';
}
function stat(label, value, text, small, extra = '') {
  return '<div class="stat"><div class="eyebrow">' + E(label) + '</div><strong>' + value + '</strong><span>' + E(text) + '</span><small>' + E(small) + '</small>' + extra + '</div>';
}

/* ---------- Listas ---------- */
const isObjectives = () => view === 'missing' || view === 'buildable';
function dataForView() {
  if (view === 'buildable') return D.variants.filter(v => v.state === 'buildable');
  if (view === 'collection') return D.inventory.filter(r => r.health_group === 'good');
  if (view === 'workshop') return D.inventory.filter(r => r.health_group === workshop);
  if (view === 'catalogue') return D.catalogue;
  return D.variants.filter(v => filters.completed || v.state !== 'complete');
}
const fieldCategory = r => r.category || r.group || r.piece_type;
function selectFilter(data, id, label, key, first = 'Todos') {
  const opts = [...new Set(data.map(key).filter(Boolean))].sort(cmp);
  return '<label>' + label + '<select id="filter-' + id + '"><option value="">' + first + '</option>' + opts.map(s => '<option value="' + E(s) + '"' + (filters[id] === s ? ' selected' : '') + '>' + E(s) + '</option>').join('') + '</select></label>';
}
function renderList() {
  const texts = {
    collection: ['Mi colección', 'Sólo objetos sin daño marcado ni montajes incompletos. Cada ficha conserva sus piezas exactas.'],
    buildable: ['Puedes montar con tus piezas', 'Conjuntos que puedes completar con una base y repuestos sueltos que ya tienes. Abre una ficha para ver nombres exactos y referencias.'],
    missing: ['Qué me falta', 'Objetivos sin completar: modelos, culatas, interiores y otras opciones dentro de conjuntos completos. Una pieza suelta no cuenta como un arma o casco completo.'],
    catalogue: ['Catálogo del juego', D.meta.catalogue_count + ' modelos y objetos confirmados en la instalación analizada. Distingue lo que posees de lo que aún no aparece en tus guardados.'],
    workshop: ['Pendientes', 'Objetos fuera de la lista principal, separados según necesiten reparación o piezas para terminar su montaje.']}[view];
  const data = dataForView();
  let f = '<div class="filters"><label class="search">Buscar objeto, pieza o referencia<input id="filter-q" type="search" value="' + E(filters.q) + '" placeholder="M1 Carbine, SSh-36, M17 Liner, EE-778…" autocomplete="off"></label>' +
    selectFilter(data, 'house', 'Casa recomendada', r => r.display_house, 'Todas') + selectFilter(data, 'nation', 'País / nación', r => r.nation) +
    selectFilter(data, 'category', 'Categoría', fieldCategory) + selectFilter(data, 'section', 'Sección de exposición', r => r.section, 'Todas');
  f += isObjectives() ? selectFilter(data, 'state', 'Estado del objetivo', r => STATES[r.state])
    : '<label>Ordenar<select id="filter-sort">' + [['year', 'Año del modelo'], ['name', 'Nombre · A–Z'], ['house', 'Casa y sección'], ['nation', 'País / nación']].map(([v, l]) => '<option value="' + v + '"' + (filters.sort === v ? ' selected' : '') + '>' + l + '</option>').join('') + '</select></label>';
  f += '</div>';
  const extras = isObjectives()
    ? '<label class="check"><input id="compatible" type="checkbox"' + (!filters.original ? ' checked' : '') + '> Incluir montajes compatibles no originales</label>' + (view === 'missing' ? '<label class="check"><input id="completed" type="checkbox"' + (filters.completed ? ' checked' : '') + '> Mostrar también completos</label>' : '')
    : view === 'collection' ? '<label class="check"><input id="exhibit" type="checkbox"' + (filters.exhibit ? ' checked' : '') + '> Sólo selección para exposición</label>' : '';
  $('main').innerHTML = heading(texts[0], texts[1], '<button class="btn" id="export">↓ Exportar esta lista</button>') +
    (view === 'workshop' ? '<div class="chips"><button class="chip ' + (workshop === 'repair' ? 'active' : '') + '" data-workshop="repair">Irrecuperables / pendientes de reparar · ' + num(D.meta.repair_count) + '</button><button class="chip ' + (workshop === 'incomplete' ? 'active' : '') + '" data-workshop="incomplete">Incompletos · ' + num(D.meta.incomplete_count) + '</button></div><p class="timeline-note">Si está dañado e incompleto, aparece sólo en pendientes de reparar. La ficha conserva todos sus faltantes.</p>' : '') +
    (isObjectives() ? '<div class="notice"><b>Objetivos de montaje.</b> Se comprueba cada opción dentro de un conjunto completo. Por defecto se muestran las piezas originales del juego; los montajes compatibles no originales se pueden incluir aparte.</div>' : '') +
    f + '<div class="filter-extras"><span id="result-count" aria-live="polite"></span><div>' + extras + '<button class="btn" id="reset-filters">Limpiar filtros</button></div></div>' +
    '<div class="table-wrap"><table><thead id="table-head"></thead><tbody id="table-body"></tbody></table></div>' +
    '<div class="pager"><span id="page-info"></span><div><button class="btn" id="prev">← Anterior</button><button class="btn" id="next">Siguiente →</button></div></div>' +
    (isObjectives() ? '<p class="timeline-note">«Puedes montarlo» usa repuestos sueltos sin daño y no desmonta otras armas. Los repuestos no se reservan entre objetivos: varios pueden necesitar la misma pieza.</p>' : '');
  for (const id of ['q', 'house', 'nation', 'category', 'section', 'state', 'sort']) {
    const el = $('filter-' + id); if (el) el.addEventListener(id === 'q' ? 'input' : 'change', e => { filters[id] = e.target.value; page = 1; applyFilters(); });
  }
  const bind = (id, fn) => { if ($(id)) $(id).onchange = e => { fn(e.target.checked); page = 1; applyFilters(); }; };
  bind('compatible', c => filters.original = !c); bind('exhibit', c => filters.exhibit = c);
  if ($('completed')) $('completed').onchange = e => { filters.completed = e.target.checked; page = 1; renderList(); };
  $('reset-filters').onclick = () => { filters = baseFilters(); page = 1; renderList(); };
  $('prev').onclick = () => { page--; drawRows(); }; $('next').onclick = () => { page++; drawRows(); };
  $('export').onclick = exportRows;
  applyFilters();
}
function searchable(r) {
  return N([r.name, r.title, r.ref, r.family, r.identification, r.target?.name, ...(r.mounted || []).map(p => p.name),
    ...(r.refs || []), ...(r.base_refs || []), ...(r.plan ? r.plan.missing.flatMap(g => g.options.map(o => o.name)) : [])].join(' '));
}
function applyFilters() {
  const f = filters, q = N(f.q);
  rows = dataForView().filter(r => (!f.house || r.display_house === f.house) && (!f.nation || r.nation === f.nation) &&
    (!f.category || fieldCategory(r) === f.category) && (!f.section || r.section === f.section) && (!f.state || STATES[r.state] === f.state) &&
    (!isObjectives() || !f.original || r.original_option !== false) && (view !== 'collection' || !f.exhibit || r.display_selected) &&
    (!q || searchable(r).includes(q)));
  rows.sort((a, b) => f.sort === 'name' ? cmp(a.name, b.name) : f.sort === 'nation' ? cmp(a.nation, b.nation) || cmp(a.name, b.name)
    : f.sort === 'house' ? cmp(a.display_house, b.display_house) || cmp(a.section, b.section) || cmp(a.name, b.name)
      : (a.year || 9999) - (b.year || 9999) || cmp(a.name, b.name));
  drawRows();
}
function variantHint(r) {
  const parts = r.mounted || [], interesting = parts.filter(p => /stock|liner|visor|handguard/i.test(p.name) || (/\/UXO\/Casings\//.test(r.class || '') && p.slot === 'Shell'));
  if (interesting.length) return interesting.map(p => p.name).join(' · ');
  if (r.complete === false && /Helmets\//.test(r.class) && !parts.length) return 'Sin interior / piezas montadas';
  return r.piece_type;
}
const mountedSlot = (p, r) => p.slot === 'Shell' && /\/UXO\//.test(r.class || '') ? 'Proyectil' : slotName(p.slot);
const gapText = g => slotName(g.slot) + ': ' + g.options.map(o => o.name + (g.options.filter(x => x.name === o.name).length > 1 ? ' [' + o.asset + ']' : '')).join(' / ');
function healthPill(r) {
  if (r.doubt) return pill('Duda: ' + r.doubt, 'amber');
  return pill(r.health_group === 'repair' ? 'Pendiente de reparar' : r.complete === false ? 'Incompleto' : r.complete === true ? 'Completo' : 'Objeto independiente',
    r.health_group === 'repair' ? 'red' : r.complete === false ? 'amber' : '');
}
function drawRows() {
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE)); page = Math.min(Math.max(page, 1), pages);
  const kind = isObjectives() ? 'variant' : view === 'catalogue' ? 'catalogue' : 'inventory';
  $('result-count').textContent = num(rows.length) + (view === 'buildable' ? ' montajes disponibles' : isObjectives() ? (filters.completed ? ' objetivos de colección' : ' objetivos pendientes') : kind === 'catalogue' ? ' modelos del catálogo' : ' objetos');
  $('page-info').textContent = 'Página ' + page + ' de ' + pages + ' · ' + (rows.length ? ((page - 1) * PAGE_SIZE + 1) + '–' + Math.min(page * PAGE_SIZE, rows.length) : '0') + ' de ' + num(rows.length);
  $('prev').disabled = page === 1; $('next').disabled = page === pages;
  $('table-head').innerHTML = '<tr><th>' + (kind === 'variant' ? 'OBJETIVO COMPLETO' : 'OBJETO / MODELO') + '</th><th>PAÍS / CASA</th><th>' + (kind === 'variant' ? 'QUÉ FALTA / QUÉ TIENES' : kind === 'catalogue' ? 'PRESENCIA EN EL GUARDADO' : 'MONTAJE / ESTADO') + '</th><th>' + (kind === 'variant' ? 'ESTADO' : 'FECHA DEL MODELO') + '</th></tr>';
  $('table-body').innerHTML = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(r => {
    const key = kind === 'inventory' ? r.ref : r.id; let content, last;
    if (kind === 'variant') {
      const gaps = r.plan.missing;
      if (view === 'buildable') content = '<div class="subparts">' + r.plan.available.flatMap(g => g.available.map(p => '<div><b>' + E(p.name) + '</b><small>' + E(p.refs.join(', ')) + '</small></div>')).join('') + '</div><small>Base propuesta: ' + E(r.plan.ref) + '</small>';
      else content = '<div class="subparts">' + (gaps.length ? gaps.slice(0, 3).map(g => '<div>' + E(gapText(g)) + '</div>').join('') + (gaps.length > 3 ? '<div>+' + (gaps.length - 3) + ' necesidades · ver ficha</div>' : '') : 'Las piezas necesarias están disponibles.') + '</div>' +
        (r.plan.available.length ? '<small>Repuestos disponibles: ' + r.plan.available.map(g => E(slotName(g.slot))).join(', ') + '</small>' : '') + (r.plan.ref ? '<small>Base propuesta: ' + E(r.plan.ref) + '</small>' : '');
      last = badge(r.state);
    } else if (kind === 'catalogue') {
      content = '<strong>' + num(r.good) + ' en buen estado</strong><small>' + num(r.owned) + ' objetos en total · ' + E(r.category) + '</small>'; last = E(r.date || 'Sin fecha contrastada');
    } else {
      content = '<div class="subparts">' + E(variantHint(r)) + '</div>' + healthPill(r) + (r.original === false ? ' ' + pill('Montaje no original', 'amber') : ''); last = E(r.date || 'Sin fecha contrastada');
    }
    const sub = kind === 'inventory' ? r.ref : kind === 'variant' ? slotName(r.axis) : r.category;
    return '<tr><td><button class="row-title" data-detail="' + kind + '" data-key="' + E(key) + '"><strong>' + E(r.title || r.name) + '</strong></button><div class="ref">' + E(sub) + '</div>' +
      (kind === 'inventory' ? '<small>Guardado en: ' + E(r.origin) + '</small>' : kind === 'variant' && r.original_option === false ? '<small>Compatible en el juego · no original</small>' : '') +
      '</td><td>' + pill(r.nation, 'gray') + '<small>' + E(r.display_house) + '</small><small>' + E(r.section) + '</small></td><td>' + content + '</td><td>' + last + '</td></tr>';
  }).join('') || '<tr><td colspan="4" class="empty">No hay resultados con estos filtros. Prueba a limpiar la búsqueda.</td></tr>';
}

/* ---------- Fichas ---------- */
const field = (k, v) => v ? '<div class="detail-field"><small>' + E(k) + '</small><p>' + E(v) + '</p></div>' : '';
function historical(r) {
  if (!r.historical_origin) return '';
  return '<h3>Revisión histórica</h3><div class="detail-grid">' + field('Origen histórico', r.historical_origin) + field('Qué fecha estamos usando', r.date_basis) +
    field('Grado de identificación', r.historical_status) + field('Datos contrastados', r.confirmed_details) + field('Lo que sigue sin confirmar', r.uncertain_details) +
    '</div><ul class="part-list">' + (r.historical_sources || []).map(s => '<li><a class="text-link" target="_blank" rel="noopener" href="' + E(s.url) + '">' + E(s.title) + ' ↗</a></li>').join('') + '</ul>';
}
function openDetail(kind, key) {
  const r = kind === 'inventory' ? byRef.get(key) : kind === 'variant' ? D.variants.find(x => x.id === key) : D.catalogue.find(x => x.id === key);
  if (!r) return;
  let h = '<h2 id="detail-title">' + E(r.title || r.name) + '</h2>' + pill(r.nation, 'gray') + ' ' + pill(r.display_house) +
    '<div class="detail-grid">' + field('Categoría', r.category || r.piece_type) + field('Sección', r.section) + field('Fecha del modelo', r.date) + field('Familia', r.family) + '</div>' + historical(r);
  if (kind === 'inventory') {
    const ds = doubts().filter(d => d.ref === r.ref);
    h += (ds.length ? ds.map(d => '<div class="notice warn"><b>' + E(d.tipo) + '.</b> ' + E(d.detalle) + '</div>').join('') : '') +
      '<div class="detail-grid">' + field('Referencia / ubicación guardada', r.ref + ' · ' + r.origin) + field('Estado', r.status) + field('Identificación revisada', r.identification) +
      field('Originalidad', r.original === true ? 'Montaje original según el juego' : r.original === false ? 'Montaje no original' : 'No evaluada') + '</div>' +
      '<h3>Piezas montadas · ' + r.mounted.length + '</h3><ul class="part-list">' + (r.mounted.map(p => '<li>' + E(mountedSlot(p, r)) + ' — <b>' + E(p.name) + '</b><small>' + E(p.asset) + '</small></li>').join('') || '<li>No tiene piezas montadas registradas.</li>') + '</ul>' +
      '<div class="detail-grid">' + field('Todos los faltantes', r.missing) + field('Para ser original', r.correction) + field('Precisión de fecha', r.date_note) + field('Revisión de fotografías', r.photo_review) + field('Criterio de clasificación', r.classification_basis) + field('Notas', r.note) + '</div>' +
      (r.source_url && !(r.historical_sources || []).length ? '<a class="text-link" target="_blank" rel="noopener" href="' + E(r.source_url) + '">' + E(r.source_title || 'Fuente histórica') + ' ↗</a>' : '');
  } else if (kind === 'variant') {
    const refLinks = refs => refs.length ? refs.join(', ') : 'Ninguno registrado';
    h += badge(r.state) + '<p class="notice">' + (r.target ? 'Opción exacta: ' + E(r.target.name) + ' · ' + E(r.target.asset) : 'Objetivo: un ejemplar completo de este modelo.') + (r.original_option === false ? '<br>El juego admite el montaje, pero esta pieza no figura entre las opciones originales del modelo.' : '') + '</p>' +
      '<div class="detail-grid">' + field('Ejemplares completos', refLinks(r.refs)) + field('Ejemplares dañados con esta opción', refLinks(r.repair_refs)) + field('Incompletos con esta opción', refLinks(r.incomplete_refs)) + field('Base del plan', r.plan.ref || 'Falta una base sin daño marcado') + '</div>' +
      '<h3>Todo lo que falta conseguir</h3><ul class="part-list">' + (r.plan.missing.map(g => '<li><b>' + E(slotName(g.slot)) + '</b><br>' + g.options.map(p => E(p.name) + (p.asset ? ' <small>' + E(p.asset) + '</small>' : '')).join(' <span class="ref">o bien</span> ') + '</li>').join('') || '<li>Sin piezas adicionales por conseguir para este plan.</li>') + '</ul>' +
      '<h3>Repuestos que ya tienes</h3><ul class="part-list">' + (r.plan.available.map(g => '<li>' + E(slotName(g.slot)) + '<br>' + g.available.map(p => '<b>' + E(p.name) + '</b><small>' + E(p.refs.join(', ')) + '</small>').join('') + '</li>').join('') || '<li>Este plan no necesita repuestos sueltos.</li>') + '</ul>' +
      '<p class="timeline-note">' + E(D.meta.buildable_method) + '</p>';
  } else {
    const owned = r.refs.map(ref => byRef.get(ref)).filter(Boolean);
    h += '<h3>Ejemplares registrados · ' + owned.length + '</h3><ul class="part-list">' + (owned.map(i => '<li><button class="row-title" data-detail="inventory" data-key="' + E(i.ref) + '"><b>' + E(i.ref) + ' · ' + E(i.name) + '</b></button><small>' + E(i.health_label) + ' · ' + E(variantHint(i)) + '</small></li>').join('') || '<li>Este modelo no figura en los guardados analizados.</li>') + '</ul>';
  }
  h += '<div class="detail-actions"><button class="btn" data-query="' + E(r.name) + '" data-target="collection">Buscar en mi colección</button><button class="btn" data-query="' + E(r.name) + '" data-target="missing">Ver lo que falta</button></div>';
  $('detail-content').innerHTML = h;
  if (!$('detail-dialog').open) $('detail-dialog').showModal();
  $('detail-dialog').scrollTop = 0;
}

/* ---------- Fotos y dudas ---------- */
function renderPhotos() {
  const pending = D.photos.filter(p => !p.reviewed).sort((a, b) => a.priority - b.priority || cmp(a.id, b.id));
  const ds = doubts();
  $('main').innerHTML = heading('Fotos y dudas', 'Las fotos confirman o corrigen fechas, procedencias y variantes. Las dudas del lector son casos que no se deciden automáticamente: se muestran aquí hasta revisarlos.') +
    '<div class="section-heading"><h2>Dudas del lector · ' + ds.length + '</h2><span class="timeline-note">Lo que no cuadra no se inventa</span></div>' +
    (ds.length ? '<div class="doubts">' + ds.map(d => '<div class="doubt">' + pill(d.tipo, 'amber') + '<p>' + E(d.detalle) + '</p>' + (d.ref ? '<button class="row-title text-link" data-detail="inventory" data-key="' + E(d.ref) + '">Abrir ficha →</button>' : '') + '</div>').join('') + '</div>'
      : '<p class="subtitle">No hay dudas pendientes del lector.</p>') +
    '<div class="section-heading"><h2>' + pending.length + ' grupos de fotos pendientes</h2><span class="timeline-note">Empieza por los prioritarios</span></div>' +
    '<div class="notice">Un ejemplar por modelo suele bastar. Indica su nombre o referencia y procura que ocupe buena parte de la captura. Las fotos pueden precisar una variante; no garantizan un año de fabricación si el juego no reproduce sus marcajes.</div>' +
    '<div class="photo-grid">' + pending.map(p => '<article class="photo-card"><span class="eyebrow">' + E(p.id) + ' / ' + (p.priority === 1 ? 'Prioritaria' : p.priority === 2 ? 'Segunda tanda' : 'Opcional') + '</span><h3>' + E(p.title) + '</h3><p class="refs">' + E(p.refs.join(', ') || 'Sin ejemplares en los guardados actuales') + '</p><p>' + E(p.why) + '</p><p><b>Fotos útiles:</b> ' + E(p.views) + '</p><button class="btn" data-query="' + E(p.names[0]) + '" data-target="catalogue">Localizar modelo →</button></article>').join('') + '</div>' +
    '<div class="section-heading"><h2>Ya revisado contigo</h2></div><div class="received">' +
    REVIEWED.map(([im, n, t, ref]) => '<article><img src="media/' + im + '.webp" alt="Captura de la partida: ' + E(n) + '" loading="lazy" width="1600" height="900"><div>' + pill('Revisado') + '<h3>' + E(n) + '</h3><p>' + E(t) + '</p>' + (byRef.has(ref) ? '<button class="row-title text-link" data-detail="inventory" data-key="' + ref + '">Abrir ficha →</button>' : '') + '</div></article>').join('') + '</div>';
}

/* ---------- Datos y actualizaciones ---------- */
function renderUpdates() {
  const m = D.meta, last = m.autosync && m.autosync.last_scan;
  $('main').innerHTML = heading('Datos y actualizaciones', 'De dónde salen los datos, cuándo se actualizan y qué significa cada estado.', '<button class="btn" id="download-json">↓ Descargar datos actuales</button>') +
    '<div class="method-grid"><section class="panel"><div class="eyebrow">Revisión actual</div><h2>' + E(m.revision) + '</h2><ul>' +
    HOUSES.map(([h]) => '<li>' + h + ' · guardado del ' + E(fmtDate(m.snapshot_dates[h])) + '.</li>').join('') +
    '<li>Build del juego analizada: ' + E(m.build) + '.</li><li>' + num(m.native_validated) + ' clases del juego contrastadas; ' + num(m.catalogue_count) + ' modelos y objetos incluidos.</li>' +
    (last ? '<li>Última lectura: ' + E(fmtDateTime(last)) + '.</li>' : '') + '<li>Huella de los datos: <code>' + E(m.dataset_hash) + '</code>.</li></ul><p>' + E(m.scope) + '</p></section>' +
    '<section class="panel"><div class="eyebrow">Cómo se mantiene al día</div><h2>Al abrir y al cerrar el juego</h2><ol><li>Guarda la partida después de adquirir, reparar o cambiar piezas.</li><li>Al abrir Osta y al cerrarlo, el actualizador de tu PC lee Estonia, Francia y Afganistán.</li><li>Si los datos cambian, publica una revisión nueva aquí en uno o dos minutos. Si no cambian, no publica nada.</li></ol><p>' + E(m.update_method) + '</p><p>La página busca revisiones nuevas al volver a ella y al pulsar «Actualizar». <a class="text-link" href="' + REPO_URL + '/commits/main" target="_blank" rel="noopener">Historial de revisiones ↗</a></p></section>' +
    '<section class="panel"><div class="eyebrow">Modelos y montajes</div><h2>Qué cuenta como conseguido</h2><p>Debe existir un conjunto completo, sin daño marcado y con la opción exacta montada. Tener la pieza suelta, el cuerpo incompleto o un ejemplar dañado no lo marca como conseguido.</p><p>' + E(m.variant_method) + '</p></section>' +
    '<section class="panel"><div class="eyebrow">Piezas y originalidad</div><h2>Sin confundir disponibilidad</h2><p>' + E(m.buildable_method) + '</p><p>La originalidad procede de las comprobaciones del juego. Las fechas son referencias de modelo o configuración, no certificados de fabricación. País o nación describe la atribución de la familia, no la procedencia real de un ejemplar.</p><p>«Irrecuperable» conserva la marca del guardado: no promete que el juego permita recuperarlo.</p></section></div>' +
    '<details class="unresolved"><summary>' + m.unresolved_assets.length + ' entradas técnicas del catálogo sin confirmar · no se cuentan como faltantes</summary><p>Rutas que no resolvieron una clase utilizable durante la inspección. Incluyen nombres internos o antiguos; no se presupone que sean objetos obtenibles.</p><ul>' + m.unresolved_assets.map(a => '<li>' + E(typeof a === 'string' ? a : a.asset) + '</li>').join('') + '</ul></details>' +
    '<div class="notice"><b>Visibilidad.</b> Esta web es pública (GitHub Pages) pero no se indexa en buscadores. Sus datos son una colección dentro de un videojuego.</div>';
  $('download-json').onclick = () => download('osta-coleccion-datos.json', JSON.stringify(D, null, 2), 'application/json');
}

/* ---------- Utilidades ---------- */
function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], {type})), a = document.createElement('a');
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function exportRows() {
  const cell = s => '"' + String(s ?? '').replace(/"/g, '""') + '"';
  const header = ['Objeto / objetivo', 'Referencia', 'País / nación', 'Casa recomendada', 'Sección', 'Estado', 'Piezas / faltantes'];
  const data = [header, ...rows.map(r => [r.title || r.name, r.ref || (r.refs || []).join(', '), r.nation, r.display_house, r.section,
    r.state ? STATES[r.state] : r.health_label || (r.good + ' en buen estado'), r.plan ? r.plan.missing.map(gapText).join('; ') : (r.mounted || []).map(p => p.name).join('; ')])];
  download('osta-' + view + '.csv', '﻿' + data.map(l => l.map(cell).join(';')).join('\r\n'), 'text/csv;charset=utf-8');
}

document.addEventListener('click', e => {
  const t = e.target.closest('[data-go],[data-house],[data-query],[data-workshop],[data-detail]'); if (!t) return;
  if (t.dataset.go) navigate(t.dataset.go);
  else if (t.dataset.house) { navigate('collection'); filters.house = t.dataset.house; filters.exhibit = true; renderList(); }
  else if (t.dataset.query) { if ($('detail-dialog').open) $('detail-dialog').close(); navigate(t.dataset.target, t.dataset.query); if (t.dataset.completed) { filters.completed = true; renderList(); } }
  else if (t.dataset.workshop) { workshop = t.dataset.workshop; if (view === 'workshop') { page = 1; renderList(); } else navigate('workshop'); }
  else if (t.dataset.detail) openDetail(t.dataset.detail, t.dataset.key);
});
$('nav').addEventListener('click', e => { const a = e.target.closest('[data-view]'); if (a) { e.preventDefault(); navigate(a.dataset.view); } });
$('menu').onclick = () => { const open = document.body.classList.toggle('nav-open'); $('menu').setAttribute('aria-expanded', String(open)); };
$('scrim').onclick = closeNav;
$('close-dialog').onclick = () => $('detail-dialog').close();
$('detail-dialog').addEventListener('click', e => { if (e.target === $('detail-dialog')) { const b = e.target.getBoundingClientRect(); if (e.clientX < b.left || e.clientX > b.right || e.clientY < b.top || e.clientY > b.bottom) e.target.close(); } });
window.addEventListener('hashchange', () => { const v = location.hash.slice(1); if (D && VIEWS[v] && v !== view) navigate(v); });

let loading = false;
async function loadData(manual = false) {
  if (loading) return; loading = true;
  try {
    const res = await fetch('data.json?t=' + Date.now(), {cache: 'no-store'});
    if (!res.ok) throw Error(res.status);
    const next = await res.json();
    if (!Array.isArray(next.inventory) || !Array.isArray(next.variants)) throw Error('Formato inválido');
    const old = D; D = next; byRef = new Map(D.inventory.map(r => [r.ref, r]));
    if (!old) { const v = location.hash.slice(1); view = VIEWS[v] ? v : 'overview'; render(); }
    else if (old.meta.revision !== D.meta.revision || old.meta.dataset_hash !== D.meta.dataset_hash) { render(); toast('Nueva revisión cargada: ' + D.meta.revision); }
    else if (manual) toast('Ya tienes la última revisión publicada');
  } catch (err) {
    if (!D) $('main').innerHTML = '<div class="empty"><h1>No se pudo abrir el archivo</h1><p>Vuelve a intentarlo con el botón Actualizar.</p></div>';
    else toast('No se pudo consultar la revisión. Tus datos actuales siguen disponibles.');
  } finally { loading = false; }
}
$('refresh').onclick = () => loadData(true);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && D) loadData(false); });
setInterval(() => { if (document.visibilityState === 'visible' && D) loadData(false); }, 120000);
loadData();
