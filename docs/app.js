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
const STATE_TAG = {complete: '', buildable: 'blue', repair: 'red', incomplete: 'amber', missing: 'gray'};
const SLOTS = {Liner: 'Interior', Stock: 'Culata', Magazine: 'Cargador', Bolt: 'Cerrojo', Handguard: 'Guardamanos', Grips: 'Cachas',
  PistolGrip: 'Empuñadura', Visor: 'Visor', Shell: 'Calota', Scope: 'Óptica', GasTube: 'Tubo de gases', Barrel: 'Cañón',
  Part1: 'Pieza 1', Part2: 'Pieza 2', Part3: 'Pieza 3'};
const HOUSES = [
  ['Estonia', 'Rusia imperial, URSS, Báltico y bloque oriental; caza y transformaciones civiles aparte.'],
  ['Francia', 'Alemania, Reino Unido, Estados Unidos, Francia y Bélgica, por tipo y año del modelo.'],
  ['Afganistán', 'Guerra Fría oriental, material occidental moderno y tradición regional.']];
// Revisiones fotográficas ya hechas (capturas de la partida en media/).
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
  ['us-m43-81mm', 'M43 · mortero de 81 mm', 'Estados Unidos · Segunda Guerra Mundial. Documentado en abril de 1943; subvariante exacta y fabricación sin confirmar.', 'EE-45'],
  ['bar-m1918a2', 'BAR · M1918A2 probable', 'Estados Unidos. Apoyo abatible en la cantonera, bípode junto a la bocacha y asa: patrón de 1938, no el M1918 original.', 'EE-1071'],
  ['soviet-120mm', '120 mm · familia OF-843 probable', 'URSS · mortero 120-PM-38. Cuerpo en lágrima con ranuras y cola larga de aletas; variante y fabricación sin confirmar.', 'EE-483']];
const REPO_URL = 'https://github.com/manuelrodriguezacosta05-tech/osta-archivo-coleccion';
const PAGE_SIZE = 30;

let D = null, view = 'overview', page = 1, rows = [], workshop = 'repair', filters = baseFilters();
let byRef = new Map();

function baseFilters() { return {q: '', house: '', nation: '', category: '', section: '', state: '', sort: 'year', original: true, exhibit: false, completed: false}; }
const tag = (s, c = '') => '<span class="tag ' + c + '">' + E(s) + '</span>';
const stamp = (s, c = '') => '<span class="stamp ' + c + '">' + E(s) + '</span>';
const badge = s => s === 'repair' ? stamp(STATES[s]) : tag(STATES[s] || s, STATE_TAG[s]);
const house = h => '<span class="h" data-h="' + E(h) + '"><i class="sw"></i>' + E(h) + '</span>';
const fmtDate = s => { if (!s) return 'pendiente'; const d = new Date(String(s).slice(0, 10) + 'T12:00:00Z'); return isNaN(d) ? s : new Intl.DateTimeFormat('es-ES', {day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'}).format(d); };
const fmtDateTime = s => { const d = new Date(s); return isNaN(d) ? (s || '') : new Intl.DateTimeFormat('es-ES', {dateStyle: 'long', timeStyle: 'short'}).format(d); };
const slotName = s => SLOTS[s] || s;
const doubts = () => (D.meta.doubts || []);
const ICON = {arrow: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  down: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v12M6 11l6 6 6-6M5 20h14"/></svg>',
  ext: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true" style="width:14px;height:14px"><path d="M14 5h5v5M19 5l-8 8M18 14v5H5V6h5"/></svg>'};

function toast(t) { const el = $('toast'); el.textContent = t; el.style.display = 'block'; clearTimeout(toast.t); toast.t = setTimeout(() => el.style.display = 'none', 4500); }
function closeNav() { document.body.classList.remove('nav-open'); $('menu').setAttribute('aria-expanded', 'false'); }

function navigate(v, query) {
  view = VIEWS[v] ? v : 'overview'; filters = baseFilters(); if (query) filters.q = query; page = 1;
  history.replaceState(null, '', '#' + view); closeNav(); render(); window.scrollTo({top: 0}); $('main').focus({preventScroll: true});
}
function heading(title, subtitle, actions = '') {
  return '<div class="page-heading"><div><h1>' + E(title) + '</h1><p class="subtitle">' + E(subtitle) + '</p></div>' + actions + '</div>';
}
const originals = () => D.variants.filter(v => v.original_option !== false);
function buildableCount() { return originals().filter(v => v.state === 'buildable').length; }
function navCounts() {
  return {good: D.meta.good_count, buildable: buildableCount(), missing: originals().filter(v => v.state !== 'complete').length,
    catalogue: D.meta.catalogue_count, workshop: D.meta.repair_count + D.meta.incomplete_count, doubts: D.meta.photos_pending + doubts().length};
}

function render() {
  document.querySelectorAll('#nav a').forEach(a => { const on = a.dataset.view === view; a.classList.toggle('active', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  $('breadcrumb').innerHTML = 'Archivo / <b>' + E(VIEWS[view]) + '</b>';
  document.title = VIEWS[view] + ' · Osta · Archivo de la colección';
  $('sidebar-revision').textContent = D.meta.revision;
  // Cada entrada del menú lleva una barra cuyo largo es su número exacto respecto al inventario.
  const c = navCounts(), max = Math.max(D.meta.inventory_count, ...Object.values(c));
  for (const [k, n] of Object.entries(c)) { $('nav-' + k).textContent = num(n); $('ext-' + k).style.setProperty('--w', (100 * n / max).toFixed(2) + '%'); }
  $('alerts').innerHTML = (D.meta.alerts || []).map(a => '<div class="callout alert"><b>' + E(a.tipo) + '.</b> ' + E(a.detalle) + '</div>').join('');
  if (view === 'overview') renderOverview(); else if (view === 'photos') renderPhotos(); else if (view === 'updates') renderUpdates(); else renderList();
}

/* ---------- Vista general: el plano de las tres casas ---------- */
function wing([h, text]) {
  const shown = D.inventory.filter(r => r.display_house === h && r.display_selected && r.health_group === 'good');
  const counts = new Map(); for (const r of shown) counts.set(r.section, (counts.get(r.section) || 0) + 1);
  const rooms = [...counts.entries()].sort((a, b) => b[1] - a[1] || cmp(a[0], b[0]));
  const top = rooms.length ? rooms[0][1] : 1;
  const isWide = n => n / shown.length >= 0.25;
  // Con dos columnas, si las salas dejan un hueco al final, la última ocupa la fila entera.
  const slots = rooms.reduce((t, [, n]) => t + (isWide(n) ? 2 : 1), 0);
  const cells = rooms.map(([s, n], i) => {
    const f = 100 * n / top, wide = isWide(n) || (i === rooms.length - 1 && slots % 2 === 1);
    const label = '<b>' + n + '</b><span>' + E(s) + '</span>';
    return '<button class="room' + (wide ? ' span2' : '') + '" data-room="' + E(h) + '" data-section="' + E(s) + '" style="--f:' + f.toFixed(1) + '%" title="' + E(s) + ': ' + n + ' piezas en exposición"><span class="lbl">' + label + '</span><span class="lbl over" aria-hidden="true">' + label + '</span></button>';
  }).join('') || '<p>Sin piezas seleccionadas para esta casa.</p>';
  return '<section class="wing" data-h="' + E(h) + '"><header><h2>' + E(h) + '</h2><b>' + num(shown.length) + '</b></header><p>' + E(text) + '</p><div class="rooms">' + cells + '</div></section>';
}
function figure(value, text, label, go) {
  return '<button class="figure" data-go="' + go + '" title="' + E(label) + '"><strong>' + value + '</strong><span>' + E(text) + '</span></button>';
}
function renderOverview() {
  const m = D.meta, orig = originals(), achieved = orig.filter(v => v.state === 'complete').length;
  const ds = doubts().length, build = orig.filter(v => v.state === 'buildable').sort((a, b) => cmp(a.title, b.title));
  const last = m.autosync && m.autosync.last_scan;
  $('main').innerHTML =
    '<div class="overview-head"><h1>La colección,<br>sala por sala</h1><div class="revision"><span>Revisión ' + E(last ? fmtDateTime(last) : m.revision) + '</span>' +
    (ds ? '<button class="row-title" data-go="photos">' + stamp(ds === 1 ? '1 duda abierta' : ds + ' dudas abiertas') + '</button>' : stamp('Sin dudas', 'green')) + '</div></div>' +
    '<div class="figures">' +
    figure(num(m.inventory_count), 'objetos en las tres casas', 'Inventario', 'collection') +
    figure(num(m.display_count), 'en buen estado y seleccionados', 'En exposición', 'collection') +
    figure(num(achieved) + '<small> / ' + num(orig.length) + '</small>', 'opciones originales completas', 'Objetivos cubiertos', 'missing') +
    figure(num(build.length), 'con tus repuestos sueltos', 'Puedes montar', 'buildable') +
    '</div>' +
    '<div class="plan">' + HOUSES.map(wing).join('') + '</div>' +
    '<div class="plan-note"><span class="note">Propuesta de exposición: cada sala se rellena según sus piezas expuestas. No se ha movido nada en la partida.</span><button class="link" data-go="collection">Ver toda la colección</button></div>' +
    '<div class="next"><section class="panel"><h2>Puedes montar ahora</h2><ul class="ledger">' +
    (build.slice(0, 5).map(v => '<li><div><button class="row-title" data-detail="variant" data-key="' + E(v.id) + '"><strong>' + E(v.title) + '</strong></button><small>Base ' + E(v.plan.ref) + ' · ' + E(v.plan.available.map(g => slotName(g.slot)).join(', ')) + '</small></div><span>' + house(v.display_house) + '</span></li>').join('') || '<li><span>Ningún montaje disponible con los repuestos actuales.</span></li>') +
    '</ul>' + (build.length > 5 ? '<p style="margin:12px 0 0"><button class="link" data-go="buildable">Ver los ' + build.length + ' montajes</button></p>' : '') + '</section>' +
    '<section class="panel"><h2>Taller</h2><ul class="ledger">' +
    '<li><div><button class="row-title" data-workshop="repair"><strong>Pendientes de reparar</strong></button><small>Dañados, incluidos los que también necesitan piezas</small></div><b>' + num(m.repair_count) + '</b></li>' +
    '<li><div><button class="row-title" data-workshop="incomplete"><strong>Incompletos</strong></button><small>Sin daño, con montaje pendiente</small></div><b>' + num(m.incomplete_count) + '</b></li>' +
    '<li><div><button class="row-title" data-go="photos"><strong>Fotos y dudas</strong></button><small>Identificaciones por confirmar y casos que el lector no decide solo</small></div><b>' + num(m.photos_pending + ds) + '</b></li>' +
    '</ul></section></div>' +
    '<div class="section-heading"><h2>De tu colección</h2><button class="link" data-go="photos">Todas las piezas revisadas</button></div>' +
    '<div class="gallery">' + REVIEWED.slice(0, 5).map(plate).join('') + '</div>' +
    '<div class="status"><b>Estado de los datos.</b> ' + HOUSES.map(([h]) => h + ': guardado del ' + E(fmtDate(m.snapshot_dates[h]))).join(' · ') + '. ' + E(m.scope) + '</div>';
}
function plate([im, n, t, ref]) {
  const r = byRef.get(ref);
  return '<figure class="plate"><img src="media/' + im + '.webp" alt="Captura de la partida: ' + E(n) + '" loading="lazy" width="1600" height="900"><figcaption><b>' + E(n) + '</b><small>' + E(ref) + (r ? ' · ' + E(r.display_house) : '') + '</small>' +
    (r ? '<button class="row-title link" data-detail="inventory" data-key="' + E(ref) + '">Abrir ficha</button>' : '') + '</figcaption></figure>';
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
  if (filters[id] && !opts.includes(filters[id])) opts.unshift(filters[id]);
  return '<label>' + label + '<select id="filter-' + id + '"><option value="">' + first + '</option>' + opts.map(s => '<option value="' + E(s) + '"' + (filters[id] === s ? ' selected' : '') + '>' + E(s) + '</option>').join('') + '</select></label>';
}
function renderList() {
  const texts = {
    collection: ['Mi colección', 'Sólo objetos sin daño marcado ni montajes incompletos. Cada ficha conserva sus piezas exactas.'],
    buildable: ['Puedes montar con tus piezas', 'Conjuntos que puedes completar con una base y repuestos sueltos que ya tienes. Abre una ficha para ver nombres exactos y referencias.'],
    missing: ['Qué me falta', 'Objetivos sin completar: modelos, culatas, interiores y otras opciones dentro de conjuntos completos. Una pieza suelta no cuenta como un arma o casco completo.'],
    catalogue: ['Catálogo del juego', num(D.meta.catalogue_count) + ' modelos y objetos confirmados en la instalación analizada. Distingue lo que posees de lo que aún no aparece en tus guardados.'],
    workshop: ['Pendientes', 'Objetos fuera de la lista principal, separados según necesiten reparación o piezas para terminar su montaje.']}[view];
  const data = dataForView();
  let f = '<div class="filters"><label class="search">Buscar objeto, pieza o referencia<input id="filter-q" type="search" value="' + E(filters.q) + '" placeholder="M1 Carbine, SSh-36, M17 Liner, EE-778…" autocomplete="off"></label>' +
    selectFilter(data, 'house', 'Casa', r => r.display_house, 'Todas') + selectFilter(data, 'nation', 'País / nación', r => r.nation) +
    selectFilter(data, 'category', 'Categoría', fieldCategory) + selectFilter(data, 'section', 'Sección', r => r.section, 'Todas');
  f += isObjectives() ? selectFilter(data, 'state', 'Estado', r => STATES[r.state])
    : '<label>Ordenar<select id="filter-sort">' + [['year', 'Año del modelo'], ['name', 'Nombre · A–Z'], ['house', 'Casa y sección'], ['nation', 'País / nación']].map(([v, l]) => '<option value="' + v + '"' + (filters.sort === v ? ' selected' : '') + '>' + l + '</option>').join('') + '</select></label>';
  f += '</div>';
  const extras = isObjectives()
    ? '<label class="check"><input id="compatible" type="checkbox"' + (!filters.original ? ' checked' : '') + '> Incluir montajes compatibles no originales</label>' + (view === 'missing' ? '<label class="check"><input id="completed" type="checkbox"' + (filters.completed ? ' checked' : '') + '> Mostrar también completos</label>' : '')
    : view === 'collection' ? '<label class="check"><input id="exhibit" type="checkbox"' + (filters.exhibit ? ' checked' : '') + '> Sólo selección para exposición</label>' : '';
  $('main').innerHTML = heading(texts[0], texts[1], '<button class="btn" id="export">' + ICON.down + 'Exportar esta lista</button>') +
    (view === 'workshop' ? '<div class="chips"><button class="chip ' + (workshop === 'repair' ? 'active' : '') + '" data-workshop="repair">Irrecuperables / pendientes de reparar · ' + num(D.meta.repair_count) + '</button><button class="chip ' + (workshop === 'incomplete' ? 'active' : '') + '" data-workshop="incomplete">Incompletos · ' + num(D.meta.incomplete_count) + '</button></div><p class="note">Si está dañado e incompleto, aparece sólo en pendientes de reparar. La ficha conserva todos sus faltantes.</p>' : '') +
    (isObjectives() ? '<div class="callout"><b>Objetivos de montaje.</b> Se comprueba cada opción dentro de un conjunto completo. Por defecto se muestran las piezas originales del juego; los montajes compatibles no originales se pueden incluir aparte.</div>' : '') +
    f + '<div class="filter-extras"><span id="result-count" aria-live="polite"></span><div>' + extras + '<button class="btn" id="reset-filters">Limpiar filtros</button></div></div>' +
    '<div class="table-wrap"><table><thead id="table-head"></thead><tbody id="table-body"></tbody></table></div>' +
    '<div class="pager"><span id="page-info"></span><div><button class="btn" id="prev">Anterior</button><button class="btn" id="next">Siguiente</button></div></div>' +
    (isObjectives() ? '<p class="note">«Puedes montarlo» usa repuestos sueltos sin daño y no desmonta otras armas. Los repuestos no se reservan entre objetivos: varios pueden necesitar la misma pieza.</p>' : '');
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
function healthMark(r) {
  if (r.doubt) return stamp('Duda', 'amber');
  if (r.health_group === 'repair') return stamp('Irrecuperable');
  return tag(r.complete === false ? 'Incompleto' : r.complete === true ? 'Completo' : 'Objeto independiente', r.complete === false ? 'amber' : '');
}
// País y sección dicen lo mismo («Rusia imperial» / «Rusia imperial», «Reino Unido / Commonwealth» / «Reino Unido y Commonwealth»).
const sameAs = (nation, section) => { const a = N(nation).split('/')[0].trim(); return !a || N(section).startsWith(a); };
function drawRows() {
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE)); page = Math.min(Math.max(page, 1), pages);
  const kind = isObjectives() ? 'variant' : view === 'catalogue' ? 'catalogue' : 'inventory';
  $('result-count').textContent = num(rows.length) + (view === 'buildable' ? ' montajes disponibles' : isObjectives() ? (filters.completed ? ' objetivos de colección' : ' objetivos pendientes') : kind === 'catalogue' ? ' modelos del catálogo' : ' objetos');
  $('page-info').textContent = 'Página ' + page + ' de ' + pages + ' · ' + (rows.length ? ((page - 1) * PAGE_SIZE + 1) + '–' + Math.min(page * PAGE_SIZE, rows.length) : '0') + ' de ' + num(rows.length);
  $('prev').disabled = page === 1; $('next').disabled = page === pages;
  $('table-head').innerHTML = '<tr><th>' + (kind === 'variant' ? 'OBJETIVO COMPLETO' : 'OBJETO / MODELO') + '</th><th>CASA Y SALA</th><th>' + (kind === 'variant' ? 'QUÉ FALTA / QUÉ TIENES' : kind === 'catalogue' ? 'PRESENCIA EN EL GUARDADO' : 'MONTAJE / ESTADO') + '</th><th>' + (kind === 'variant' ? 'ESTADO' : 'FECHA DEL MODELO') + '</th></tr>';
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
      content = '<div class="subparts">' + E(variantHint(r)) + '</div>' + healthMark(r) + (r.original === false ? ' ' + stamp('No original', 'amber') : ''); last = E(r.date || 'Sin fecha contrastada');
    }
    const sub = kind === 'inventory' ? r.ref + ' · guardado en ' + r.origin : kind === 'variant' ? slotName(r.axis) + (r.original_option === false ? ' · compatible, no original' : '') : r.category;
    return '<tr><td><button class="row-title" data-detail="' + kind + '" data-key="' + E(key) + '"><strong>' + E(r.title || r.name) + '</strong></button><div class="ref">' + E(sub) + '</div></td>' +
      '<td><div class="house-cell">' + house(r.display_house) + '<small>' + E(r.section) + '</small>' + (sameAs(r.nation, r.section) ? '' : '<small>' + E(r.nation) + '</small>') + '</div></td><td>' + content + '</td><td>' + last + '</td></tr>';
  }).join('') || '<tr><td colspan="4" class="empty">No hay resultados con estos filtros. Prueba a limpiar la búsqueda.</td></tr>';
}

/* ---------- Fichas ---------- */
const field = (k, v) => v ? '<div class="detail-field"><small>' + E(k) + '</small><p>' + E(v) + '</p></div>' : '';
function historical(r) {
  if (!r.historical_origin) return '';
  return '<h3>Revisión histórica</h3><div class="detail-grid">' + field('Origen histórico', r.historical_origin) + field('Qué fecha estamos usando', r.date_basis) +
    field('Grado de identificación', r.historical_status) + field('Datos contrastados', r.confirmed_details) + field('Lo que sigue sin confirmar', r.uncertain_details) +
    '</div><ul class="part-list">' + (r.historical_sources || []).map(s => '<li><a class="link" target="_blank" rel="noopener" href="' + E(s.url) + '">' + E(s.title) + ' ' + ICON.ext + '</a></li>').join('') + '</ul>';
}
function openDetail(kind, key) {
  const r = kind === 'inventory' ? byRef.get(key) : kind === 'variant' ? D.variants.find(x => x.id === key) : D.catalogue.find(x => x.id === key);
  if (!r) return;
  const marks = kind === 'inventory' ? healthMark(r) : kind === 'variant' ? badge(r.state) : '';
  let h = '<div class="sheet-head" data-h="' + E(r.display_house) + '"><h2 id="detail-title">' + E(r.title || r.name) + '</h2><div class="sheet-tags">' + house(r.display_house) + tag(r.nation, 'gray') + marks + '</div></div>' +
    '<div class="detail-grid">' + field('Categoría', r.category || r.piece_type) + field('Sección', r.section) + field('Fecha del modelo', r.date) + field('Familia', r.family) + '</div>' + historical(r);
  if (kind === 'inventory') {
    const ds = doubts().filter(d => d.ref === r.ref);
    h += ds.map(d => '<div class="callout warn"><b>' + E(d.tipo) + '.</b> ' + E(d.detalle) + '</div>').join('') +
      '<div class="detail-grid">' + field('Referencia / ubicación guardada', r.ref + ' · ' + r.origin) + field('Estado', r.status) + field('Identificación revisada', r.identification) +
      field('Originalidad', r.original === true ? 'Montaje original según el juego' : r.original === false ? 'Montaje no original' : 'No evaluada') + '</div>' +
      '<h3>Piezas montadas · ' + r.mounted.length + '</h3><ul class="part-list">' + (r.mounted.map(p => '<li>' + E(mountedSlot(p, r)) + ' — <b>' + E(p.name) + '</b><small>' + E(p.asset) + '</small></li>').join('') || '<li>No tiene piezas montadas registradas.</li>') + '</ul>' +
      '<div class="detail-grid">' + field('Todos los faltantes', r.missing) + field('Para ser original', r.correction) + field('Precisión de fecha', r.date_note) + field('Revisión de fotografías', r.photo_review) + field('Criterio de clasificación', r.classification_basis) + field('Notas', r.note) + '</div>' +
      (r.source_url && !(r.historical_sources || []).length ? '<a class="link" target="_blank" rel="noopener" href="' + E(r.source_url) + '">' + E(r.source_title || 'Fuente histórica') + ' ' + ICON.ext + '</a>' : '');
  } else if (kind === 'variant') {
    const refs = x => x.length ? x.join(', ') : 'Ninguno registrado';
    h += '<div class="callout">' + (r.target ? 'Opción exacta: <b>' + E(r.target.name) + '</b> · ' + E(r.target.asset) : 'Objetivo: un ejemplar completo de este modelo.') + (r.original_option === false ? '<br>El juego admite el montaje, pero esta pieza no figura entre las opciones originales del modelo.' : '') + '</div>' +
      '<div class="detail-grid">' + field('Ejemplares completos', refs(r.refs)) + field('Ejemplares dañados con esta opción', refs(r.repair_refs)) + field('Incompletos con esta opción', refs(r.incomplete_refs)) + field('Base del plan', r.plan.ref || 'Falta una base sin daño marcado') + '</div>' +
      '<h3>Todo lo que falta conseguir</h3><ul class="part-list">' + (r.plan.missing.map(g => '<li><b>' + E(slotName(g.slot)) + '</b><br>' + g.options.map(p => E(p.name) + (p.asset ? ' <small style="display:inline">' + E(p.asset) + '</small>' : '')).join(' <span class="ref" style="display:inline">o bien</span> ') + '</li>').join('') || '<li>Sin piezas adicionales por conseguir para este plan.</li>') + '</ul>' +
      '<h3>Repuestos que ya tienes</h3><ul class="part-list">' + (r.plan.available.map(g => '<li>' + E(slotName(g.slot)) + '<br>' + g.available.map(p => '<b>' + E(p.name) + '</b><small>' + E(p.refs.join(', ')) + '</small>').join('') + '</li>').join('') || '<li>Este plan no necesita repuestos sueltos.</li>') + '</ul>' +
      '<p class="note">' + E(D.meta.buildable_method) + '</p>';
  } else {
    const owned = r.refs.map(ref => byRef.get(ref)).filter(Boolean);
    h += '<h3>Ejemplares registrados · ' + owned.length + '</h3><ul class="part-list">' + (owned.map(i => '<li><button class="row-title" data-detail="inventory" data-key="' + E(i.ref) + '"><strong>' + E(i.ref) + ' · ' + E(i.name) + '</strong></button><small>' + E(i.health_label) + ' · ' + E(variantHint(i)) + '</small></li>').join('') || '<li>Este modelo no figura en los guardados analizados.</li>') + '</ul>';
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
    '<div class="section-heading" style="margin-top:8px"><h2>Dudas del lector · ' + ds.length + '</h2><span class="note">Lo que no cuadra no se inventa</span></div>' +
    (ds.length ? '<div class="doubts">' + ds.map(d => '<div class="doubt">' + stamp(d.tipo, 'amber') + '<p>' + E(d.detalle) + '</p>' + (d.ref ? '<button class="link" data-detail="inventory" data-key="' + E(d.ref) + '">Abrir ficha</button>' : '<span></span>') + '</div>').join('') + '</div>'
      : '<p class="subtitle">No hay dudas pendientes del lector.</p>') +
    '<div class="section-heading"><h2>' + pending.length + ' grupos de fotos pendientes</h2><span class="note">Empieza por los prioritarios</span></div>' +
    '<div class="callout">Un ejemplar por modelo suele bastar. Indica su nombre o referencia y procura que ocupe buena parte de la captura. Las fotos pueden precisar una variante; no garantizan un año de fabricación si el juego no reproduce sus marcajes.</div>' +
    '<div class="photo-grid">' + pending.map(p => '<article class="photo-card"><header><span class="label">' + E(p.id) + '</span>' + (p.priority === 1 ? stamp('Prioritaria') : p.priority === 2 ? tag('Segunda tanda', 'amber') : tag('Opcional', 'gray')) + '</header><h3>' + E(p.title) + '</h3><p class="refs">' + E(p.refs.join(', ') || 'Sin ejemplares en los guardados actuales') + '</p><p>' + E(p.why) + '</p><p><b>Fotos útiles:</b> ' + E(p.views) + '</p><button class="btn" data-query="' + E(p.names[0]) + '" data-target="catalogue">Localizar modelo ' + ICON.arrow + '</button></article>').join('') + '</div>' +
    '<div class="section-heading"><h2>Ya revisado contigo</h2></div><div class="received">' + REVIEWED.map(plate).join('') + '</div>';
}

/* ---------- Datos y actualizaciones ---------- */
function renderUpdates() {
  const m = D.meta, last = m.autosync && m.autosync.last_scan;
  $('main').innerHTML = heading('Datos y actualizaciones', 'De dónde salen los datos, cuándo se actualizan y qué significa cada estado.', '<button class="btn" id="download-json">' + ICON.down + 'Descargar datos actuales</button>') +
    '<div class="method-grid"><section class="panel"><h2>' + E(m.revision) + '</h2><ul>' +
    HOUSES.map(([h]) => '<li>' + house(h) + ' · guardado del ' + E(fmtDate(m.snapshot_dates[h])) + '.</li>').join('') +
    '<li>Build del juego analizada: ' + E(m.build) + '.</li><li>' + num(m.native_validated) + ' clases del juego contrastadas; ' + num(m.catalogue_count) + ' modelos y objetos incluidos.</li>' +
    (last ? '<li>Última lectura: ' + E(fmtDateTime(last)) + '.</li>' : '') + '<li>Huella de los datos: <code>' + E(m.dataset_hash) + '</code>.</li></ul><p>' + E(m.scope) + '</p></section>' +
    '<section class="panel"><h2>Al abrir y al cerrar el juego</h2><ol><li>Guarda la partida después de adquirir, reparar o cambiar piezas.</li><li>Al abrir Osta y al cerrarlo, el actualizador de tu PC lee Estonia, Francia y Afganistán.</li><li>Si los datos cambian, publica una revisión nueva aquí en uno o dos minutos. Si no cambian, no publica nada.</li></ol><p>' + E(m.update_method) + '</p><p>La página busca revisiones nuevas al volver a ella y al pulsar «Actualizar». <a class="link" href="' + REPO_URL + '/commits/main" target="_blank" rel="noopener">Historial de revisiones ' + ICON.ext + '</a></p></section>' +
    '<section class="panel"><h2>Qué cuenta como conseguido</h2><p>Debe existir un conjunto completo, sin daño marcado y con la opción exacta montada. Tener la pieza suelta, el cuerpo incompleto o un ejemplar dañado no lo marca como conseguido.</p><p>' + E(m.variant_method) + '</p></section>' +
    '<section class="panel"><h2>Piezas y originalidad</h2><p>' + E(m.buildable_method) + '</p><p>La originalidad procede de las comprobaciones del juego. Las fechas son referencias de modelo o configuración, no certificados de fabricación. País o nación describe la atribución de la familia, no la procedencia real de un ejemplar.</p><p>«Irrecuperable» conserva la marca del guardado: no promete que el juego permita recuperarlo.</p></section></div>' +
    '<details class="unresolved"><summary>' + m.unresolved_assets.length + ' entradas técnicas del catálogo sin confirmar · no se cuentan como faltantes</summary><p>Rutas que no resolvieron una clase utilizable durante la inspección. Incluyen nombres internos o antiguos; no se presupone que sean objetos obtenibles.</p><ul>' + m.unresolved_assets.map(a => '<li>' + E(typeof a === 'string' ? a : a.asset) + '</li>').join('') + '</ul></details>' +
    '<div class="status"><b>Visibilidad.</b> Esta web es pública (GitHub Pages) pero no se indexa en buscadores. Sus datos son una colección dentro de un videojuego.</div>';
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
  const t = e.target.closest('[data-go],[data-room],[data-query],[data-workshop],[data-detail]'); if (!t) return;
  if (t.dataset.go) navigate(t.dataset.go);
  else if (t.dataset.room) { navigate('collection'); filters.house = t.dataset.room; filters.section = t.dataset.section; filters.exhibit = true; renderList(); }
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
