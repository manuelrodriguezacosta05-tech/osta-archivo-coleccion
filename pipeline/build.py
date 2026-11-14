"""Genera docs/data.json (y el CSV de objetivos) a partir del inventario.

Port de sites/osta-archivo-coleccion/build_data.py con los mismos criterios.
`dataset_hash` se calcula igual que antes, para poder comparar con lo publicado.
"""
import collections
import csv
import hashlib
import json

import attribution

pathkey = lambda p: p.replace('BlueprintGeneratedClass ', '')

GROUPS = {'Receivers': 'Armas y lanzadores', 'Helmets': 'Cascos y protección', 'Armor': 'Chalecos y protección corporal',
          'UXO': 'Munición y accesorios', 'Misc': 'Equipo y objetos de colección', 'Jewelry': 'Condecoraciones y joyería',
          'Tools': 'Herramientas', 'Crates': 'Cajas y vitrinas', 'Furniture': 'Mobiliario', 'Books': 'Biblioteca',
          'Food': 'Alimentos', 'Junk': 'Objetos cotidianos'}
METADATA_FIELDS = ['nation', 'display_house', 'section', 'piece_type', 'family', 'date', 'year', 'historical_origin',
                   'date_basis', 'historical_status', 'confirmed_details', 'uncertain_details', 'historical_sources']


def nation(c):
    if not c or c in ['Sin atribuir', 'Por confirmar', 'Tradición regional · sin atribuir']: return 'Por confirmar'
    if c.startswith('Rusia imperial'): return 'Rusia imperial'
    if 'uso civil' in c or c == 'Rusia / URSS' or c == 'URSS / variantes compartidas': return 'URSS / Rusia'
    if c.startswith('Yugoslavia'): return 'Yugoslavia / Serbia'
    if 'compartid' in c.lower(): return 'Compatibilidad compartida'
    if c.startswith('Suecia'): return 'Suecia'
    if c.startswith('Finlandia'): return 'Finlandia'
    if c.startswith('Tradición afgana'): return 'Afganistán / región'
    return c


def dataset_hash(inventory, variants, photos, catalogue):
    blob = json.dumps({'inventory': inventory, 'variants': variants, 'photos': photos, 'catalogue': catalogue},
                      ensure_ascii=False, sort_keys=True).encode()
    return hashlib.sha256(blob).hexdigest()[:20]


def build(inventory, raw_items, classes, universe, photos, assemblies, plan_checks, plan_links, snapshot_meta):
    raw = {r['uid']: r for r in raw_items}
    by_path = {pathkey(c['path']): c for c in classes.values()}
    by_root = collections.defaultdict(list)
    loose = collections.Counter()
    loose_refs = collections.defaultdict(list)
    for r in inventory:
        r['nation'] = 'Rusia imperial' if r['section'] == 'Rusia imperial' else nation(r['national_family'])
        r['mounted'] = []
        for cid in raw[r['ref']]['AttachedParts']:
            c = classes.get(str(cid), {})
            r['mounted'].append({'name': c.get('name', 'Por identificar'), 'path': pathkey(c.get('path', '')),
                                 'slot': c.get('slot', ''), 'asset': c.get('path', '').split('/')[-1].split('.')[0]})
        by_root[pathkey(r['class'])].append(r)
        if '/Parts/' in r['class'] and not r['damaged']:
            loose[pathkey(r['class'])] += 1
            loose_refs[pathkey(r['class'])].append(r['ref'])

    def metadata(n):
        owned = by_root.get(pathkey(n['path']), [])
        if owned:
            first = owned[0]
            return {k: first.get(k, '') for k in METADATA_FIELDS}
        country = attribution.region(n['name'], n['path'])
        nt = nation(country)
        house = 'Francia' if nt in ['Alemania', 'Estados Unidos', 'Reino Unido / Commonwealth', 'Francia', 'Bélgica'] else \
            'Afganistán' if 'Jezail' in n['name'] or 'Hookah' in n['name'] else \
            'Estonia' if nt not in ['Por confirmar', 'Compatibilidad compartida'] else 'Por asignar'
        cat = n['asset'].split('/')[0]
        return {'nation': nt, 'display_house': house, 'section': 'Por clasificar' if nt == 'Por confirmar' else GROUPS.get(cat, 'Otros'),
                'piece_type': GROUPS.get(cat, 'Otros'), 'family': n['name'], 'date': 'Sin fecha contrastada', 'year': None}

    def aspart(p):
        return {'path': pathkey(p['path']), 'name': p['name'], 'slot': p['slot'],
                'asset': p['path'].split('/')[-1].split('.')[0], 'original': p.get('original', True)}

    variants = []
    catalogue = []
    ignore = {'AllItemsTeleporter', 'CollisionDisabler', 'DurabilityChecker', 'PriceChecker'}
    for n in universe['items']:
        cat = n['asset'].split('/')[0]
        if n['is_part'] or cat == 'Parts' or n['asset'] in ignore:
            continue
        if cat not in GROUPS:
            cat = 'Furniture' if any(x in n['asset'] for x in ['Shelf', 'Rack', 'WallMount']) else 'Crates' if n['asset'] == 'ShippingBox' else 'Tools' if n['asset'] == 'MetalDetector' else 'Junk'
        key = pathkey(n['path'])
        owned = by_root.get(key, [])
        meta = metadata(n)
        collection_group = 'Objetos decorativos regionales' if 'Hookah' in n['name'] else GROUPS.get(cat, 'Otros')
        catalogue.append({'id': key, 'name': n['name'], 'asset': n['asset'], 'category': collection_group, **meta,
                          'owned': len(owned), 'good': sum(r['health_group'] == 'good' for r in owned), 'refs': [r['ref'] for r in owned]})
        natural = collections.defaultdict(list)
        for p in n['natural']:
            if p['weight'] is not None:
                p = {**p, 'original': True}
                natural[p['slot']].append(p)
        for opts in natural.values():
            opts.sort(key=lambda p: -(p.get('weight') or 0))
        slot_names = {}
        required = set()
        root_class = by_path.get(key)
        template = assemblies['templates'].get(str(root_class['id']), {}) if root_class else {}
        components = {c['name']: c for c in [*n['slots'], *template.get('slots', [])]}
        for component in components.values():
            for tag in component['tags']:
                if tag in natural:
                    slot_names[tag] = component['name']
                if tag in natural and 'Required' in component['tags']:
                    required.add(tag)
            if 'Required' in component['tags'] and not any(tag in natural for tag in component['tags']):
                tag = next((t for t in component['tags'] if t not in ['Part', 'Required', 'Optional']), component['name'])
                required.add(tag)
                slot_names[tag] = component['name']
        choices = {slot: [aspart(p) for p in opts] for slot, opts in natural.items()}
        for p in n['compatible']:
            opts = choices.setdefault(p['slot'], [])
            if not any(x['path'] == pathkey(p['path']) for x in opts):
                opts.append(aspart({**p, 'original': False}))
        axes = []
        artillery_case = cat == 'UXO' and '/Casings/' in key and 'Shell' in natural
        if artillery_case:
            slot_names['Shell'] = 'Proyectil'
        if cat in ['Receivers', 'Helmets'] or artillery_case:
            for slot, opts in choices.items():
                label = slot_names.get(slot, slot)
                if len(opts) > 1 or cat == 'Helmets' or (artillery_case and slot == 'Shell') or any(x in label.lower() for x in ['stock', 'handguard', 'liner', 'visor']):
                    axes.extend((slot, p) for p in opts)
        if not axes:
            axes = [(None, None)]
        for axis, target in axes:
            match = lambda r: target is None or any(p['path'] == target['path'] for p in r['mounted'])
            complete = [r for r in owned if r['health_group'] == 'good' and match(r)]
            damaged = [r for r in owned if r['damaged'] and match(r)]
            incomplete = [r for r in owned if r['health_group'] == 'incomplete' and match(r)]
            plans = []
            for candidate in [r for r in owned if not r['damaged']] or [None]:
                mounted = candidate['mounted'] if candidate else []
                gaps = []
                needed = []
                if candidate is None:
                    gaps.append({'slot': 'Base', 'options': [{'name': n['name'], 'asset': n['asset'].split('/')[-1]}], 'kind': 'base'})
                # Orden estable (antes dependía del orden aleatorio de un set y cambiaba el hash en cada ejecución).
                for slot in sorted(required | ({axis} if axis else set())):
                    opts = [target] if slot == axis else [aspart(p) for p in natural.get(slot, [])]
                    if not opts:
                        if candidate:
                            saved = raw[candidate['ref']]
                            check_key = str(saved['ID']) + ':' + ','.join(map(str, sorted(saved['AttachedParts'])))
                            check = assemblies['results'].get(check_key, {})
                            if candidate['complete'] is True or any(c['name'] == slot_names.get(slot, slot) and c['has_mesh'] for c in check.get('slots', [])):
                                continue
                        gaps.append({'slot': slot_names.get(slot, slot), 'options': [{'name': 'Pieza requerida · opción exacta por confirmar', 'asset': slot_names.get(slot, slot)}], 'kind': 'unconfirmed'})
                        continue
                    if any(p['path'] == o['path'] for p in mounted for o in opts):
                        continue
                    part = {'slot': slot_names.get(slot, slot), 'options': opts, 'kind': 'piece'}
                    possible = [o for o in opts if loose[o['path']] > 0]
                    if possible:
                        needed.append({**part, 'available': [{'name': o['name'], 'refs': loose_refs[o['path']]} for o in possible]})
                    else:
                        gaps.append(part)
                plans.append({'ref': candidate['ref'] if candidate else None, 'missing': gaps, 'available': needed})
            plan = min(plans, key=lambda p: (len(p['missing']), len(p['available'])))
            if complete: state = 'complete'
            elif not plan['missing'] and owned: state = 'buildable'
            elif incomplete: state = 'incomplete'
            elif damaged: state = 'repair'
            else: state = 'missing'
            slot_label = 'Proyectil' if artillery_case and axis == 'Shell' else slot_names.get(axis, axis) if axis else 'Montaje completo'
            title = n['name'] + (' · ' + target['name'] if target else '')
            if target and sum(p['name'] == target['name'] for p in choices[axis]) > 1:
                title += ' [' + target['asset'] + ']'
            vid = key + '|' + (target['path'] if target else 'base')
            verified = False
            if state == 'buildable':
                saved = raw[plan['ref']]
                planned_ids = list(saved['AttachedParts'])
                for g in plan['available']:
                    cid = raw[g['available'][0]['refs'][0]]['ID']
                    slot = classes[str(cid)]['slot']
                    planned_ids = [i for i in planned_ids if classes[str(i)]['slot'] != slot]
                    planned_ids.append(cid)
                check_key = str(saved['ID']) + ':' + ','.join(map(str, sorted(planned_ids)))
                audit = plan_checks.get(check_key) if plan_links.get(vid) == check_key else None
                verified = bool(audit and audit['complete'])
                if not verified:
                    state = 'incomplete' if owned else 'missing'
                    if not plan['missing']:
                        plan['missing'].append({'slot': 'Revisión de montaje', 'options': [{'name': 'Hay un requisito adicional sin confirmar'}], 'kind': 'unconfirmed'})
            variants.append({'id': vid, 'name': n['name'], 'title': title, 'axis': slot_label, 'target': target, 'state': state,
                             'native_plan_verified': verified, 'category': collection_group, **meta,
                             'refs': [r['ref'] for r in complete], 'repair_refs': [r['ref'] for r in damaged],
                             'incomplete_refs': [r['ref'] for r in incomplete], 'plan': plan,
                             'original_option': target['original'] if target else None, 'base_refs': [r['ref'] for r in owned]})
            if artillery_case and target:
                representative = next(iter(complete or incomplete or damaged), None)
                if representative:
                    variants[-1].update({k: representative.get(k, '') for k in METADATA_FIELDS})
        if artillery_case:
            catalogue[-1]['family'] = n['name'].replace(' Casing', '') + ' · variantes de proyectil'
            if len(natural['Shell']) > 1:
                catalogue[-1].update({'date': 'Depende del proyectil montado', 'year': None})

    states = collections.Counter(v['state'] for v in variants)
    pending_photos = [p for p in photos if not p.get('reviewed')]
    meta = {'title': 'Osta · Archivo de la colección', 'revision': '', 'build': '', 'snapshot_dates': {},
            'inventory_count': len(inventory), 'good_count': sum(r['health_group'] == 'good' for r in inventory),
            'repair_count': sum(r['health_group'] == 'repair' for r in inventory),
            'incomplete_count': sum(r['health_group'] == 'incomplete' for r in inventory),
            'display_count': sum(r['health_group'] == 'good' and r['display_selected'] for r in inventory),
            'native_validated': len(universe['items']), 'catalogue_count': len(catalogue), 'variant_count': len(variants),
            'variant_states': dict(states), 'unresolved_assets': universe['errors'], 'photos_pending': len(pending_photos),
            'variant_method': 'Cada objetivo comprueba una pieza concreta dentro de un objeto completo. Los interiores y visores alternativos se han comprobado con la función de montaje del juego; los demás objetivos proceden de sus piezas originales (NaturalParts). No se enumeran todas las combinaciones cruzadas ni se declaran nuevas variantes históricas por un cambio de cargador.',
            'buildable_method': 'Puedes montarlo compara una base sin daño marcado con sus piezas montadas y repuestos sueltos sin daño. No desmonta otros objetos ni reserva piezas: dos objetivos pueden necesitar el mismo repuesto.'}
    meta.update(snapshot_meta)
    meta['dataset_hash'] = dataset_hash(inventory, variants, photos, catalogue)
    return {'meta': meta, 'inventory': inventory, 'catalogue': catalogue, 'variants': variants, 'photos': photos}


def write_csv(payload, path):
    with path.open('w', encoding='utf-8-sig', newline='') as f:
        w = csv.writer(f, delimiter=';')
        w.writerow(['Objetivo', 'Estado', 'País / nación', 'Categoría', 'Casa recomendada', 'Referencias completas', 'Falta conseguir'])
        for v in payload['variants']:
            w.writerow([v['title'], v['state'], v['nation'], v['category'], v['display_house'], ', '.join(v['refs']),
                        '; '.join(g['slot'] + ': ' + ' / '.join(x['name'] for x in g['options']) for g in v['plan']['missing'])])
