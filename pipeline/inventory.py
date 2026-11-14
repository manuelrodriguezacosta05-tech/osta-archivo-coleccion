"""Construye el inventario a partir de los registros leídos de los guardados.

Port de collection-autosync/refresh.py (prepare). Diferencias deliberadas:
- Lo que antes abortaba (clase desconocida, montaje sin comprobación nativa) ahora
  se conserva como DUDA visible en la web, sin inventar el estado.
"""
import collections
import copy
import json

import rules

HISTORY = ['year', 'end', 'date', 'precision', 'date_note', 'source', 'source_title', 'source_url', 'identification',
           'historical_origin', 'date_basis', 'historical_status', 'confirmed_details', 'uncertain_details',
           'historical_sources', 'photo_review', 'photo_representative_ref', 'photo_batch', 'photo_numbers']
DISPLAY_CATS = ('Receivers', 'Helmets', 'UXO', 'Misc')
PREFIX = {'Estonia': 'EE', 'Afganistán': 'AF', 'Francia': 'FR'}


def mount_key(item):
    return str(item['ID']) + ':' + ','.join(map(str, sorted(item['AttachedParts'])))


def unknown_class(cid):
    return {'id': cid, 'name': f'Clase sin identificar #{cid}',
            'path': f'BlueprintGeneratedClass /Game/Items/SinIdentificar/Clase{cid}.Clase{cid}_C',
            'is_part': False, 'slot': ''}


def match_previous(items, classes, old, raw):
    def signature(item, origin):
        return (origin, item['ID'], tuple(sorted(item['AttachedParts'])), item['BeyondRepair'],
                json.dumps(item.get('Transform', {}), sort_keys=True))

    def position(item):
        return item.get('Transform', {}).get('Translation', [0, 0, 0])

    exact = collections.defaultdict(collections.deque)
    remaining = collections.defaultdict(dict)
    for row in old:
        ref = row['ref']
        exact[signature(raw[ref], row['origin'])].append(row)
        remaining[row['class']][ref] = row

    matches = {}
    for index, item in enumerate(items):
        candidates = exact.get(signature(item, item['origin']))
        if candidates:
            row = candidates.popleft()
            matches[index] = row
            del remaining[row['class']][row['ref']]

    for same_house_only in (True, False):
        for index, item in enumerate(items):
            if index in matches:
                continue
            candidates = remaining[classes[str(item['ID'])]['path']]
            parts = sorted(item['AttachedParts'])
            pos = position(item)

            def score(row):
                saved = raw[row['ref']]
                return (sorted(saved['AttachedParts']) != parts,
                        sum((a - b) ** 2 for a, b in zip(position(saved), pos)))

            previous = min((row for row in candidates.values() if not same_house_only or row['origin'] == item['origin']),
                           key=score, default=None)
            if previous is not None:
                matches[index] = previous
                del candidates[previous['ref']]
    return matches


def build_inventory(items, classes, ev, old, raw, reviews, chronology):
    """Devuelve (filas, items con uid=ref, dudas). No modifica `classes` en disco."""
    doubts = []
    classes = dict(classes)
    for r in items:
        for cid in [r['ID'], *r['AttachedParts']]:
            if str(cid) not in classes:
                classes[str(cid)] = unknown_class(cid)
                doubts.append({'tipo': 'Clase desconocida', 'clave': str(cid),
                               'detalle': f'El guardado contiene la clase #{cid}, que no figura en el catálogo nativo. '
                                          'Se muestra como «sin identificar» hasta comprobarla con el juego.'})
    rules.extend_parents(classes, ev['templates'])

    oldclass = collections.defaultdict(list)
    for r in old:
        oldclass[r['class']].append(r)
    matches = match_previous(items, classes, old, raw)
    maxref = collections.defaultdict(int)
    for r in old:
        prefix, number = r['ref'].split('-')
        maxref[prefix] = max(maxref[prefix], int(number))

    result = []
    for index, r in enumerate(items):
        c = classes[str(r['ID'])]
        path = c['path']
        name = c['name'].strip()
        cat = path.split('/Items/')[-1].split('/')[0]
        previous = matches.get(index)
        if previous:
            ref = previous['ref']
        else:
            prefix = PREFIX[r['origin']]
            maxref[prefix] += 1
            ref = prefix + '-' + str(maxref[prefix])
        r['uid'] = ref
        part_names = '; '.join(classes[str(i)]['name'] for i in r['AttachedParts'])
        model_source = previous or next(iter(sorted(oldclass[path], key=lambda x: x.get('parts', '') != part_names)), None)
        historical = {k: copy.deepcopy(model_source[k]) for k in HISTORY if model_source and k in model_source}
        if not historical:
            historical = copy.deepcopy(chronology.get(name, dict(year=None, end=None, date='Sin fechar', precision='Pendiente',
                                                                  date_note='Modelo todavía sin fecha contrastada.', source='')))
        key = mount_key(r)
        check = ev['results'].get(key) if not c['is_part'] else None
        unchecked = cat in DISPLAY_CATS and not c['is_part'] and check is None
        if unchecked:
            doubts.append({'tipo': 'Montaje sin comprobar', 'clave': key, 'ref': ref,
                           'detalle': f'{ref} · {name} con piezas [{part_names or "ninguna"}]: esta combinación no se ha '
                                      'comprobado con la función de montaje del juego. No se marca completa ni incompleta.'})
        complete = check['complete'] if check else None
        original = check.get('IsOrginal') if check else None
        natural = ev['templates'].get(str(r['ID']), {}).get('natural', [])
        missing = []
        for slot in check.get('slots', []) if check else []:
            if 'Required' in slot['tags'] and not slot['has_mesh']:
                missing.append(' / '.join(sorted({n['name'] for n in natural if n['slot'] in slot['tags']})) or slot['name'])
        changes = []
        allowed = {n['path'] for n in natural}
        for part in r['AttachedParts']:
            d = classes[str(part)]
            if d['path'] not in allowed:
                changes.append(d['name'] + ' → ' + (' / '.join(sorted({n['name'] for n in natural if n['slot'] == d['slot']})) or 'revisar variante'))
        group = {'Receivers': 'Armas', 'Helmets': 'Cascos y protección', 'UXO': 'Munición y accesorios',
                 'Misc': 'Equipo y condecoraciones'}.get(cat, 'Fuera de exposición')
        if name in ('Persian Hookah', 'Ottoman Hookah'):
            group = 'Equipo y condecoraciones'
        if c['is_part']:
            group = 'Fuera de exposición'
        if unchecked:
            status = 'montaje pendiente de comprobar'
        else:
            status = 'pieza suelta' if c['is_part'] else 'objeto independiente' if check is None else \
                ('completo' if complete else 'incompleto') + (' · montaje original' if original else ' · montaje no original')
        if r['BeyondRepair']:
            status = 'irrecuperable · ' + status
        ready = bool(complete and not r['BeyondRepair'] and group != 'Fuera de exposición')
        row = {**historical, 'ref': ref, 'name': name, 'class': path, 'group': group,
               'house': previous['display_house'] if previous else r['origin'], 'origin': r['origin'],
               'complete': complete, 'damaged': r['BeyondRepair'], 'original': original, 'status': status,
               'parts': part_names, 'missing': '; '.join(missing), 'correction': '; '.join(changes),
               'note': previous.get('note', '') if previous else '', 'ready': ready, 'inventory_index': r['index'],
               'order': previous.get('order', 0) if previous else 0}
        pos = r.get('Transform', {}).get('Translation', [0, 0, 0])
        row.update(zip(('x', 'y', 'z'), pos))
        row = rules.classify(row)
        if model_source:
            for k in ('family', 'national_family', 'classification_basis'):
                row[k] = model_source[k]
            review = reviews.get(model_source['ref']) or next((reviews[x['ref']] for x in oldclass[path] if x['ref'] in reviews), {})
            row['piece_type'] = review.get('piece_type', model_source['piece_type'])
            row['section'] = rules.section(row['display_house'], row['national_family'], row, row['piece_type'])
            if previous and previous.get('section') and previous['section'] != row['section']:
                # Las reglas darían otra sección: se conserva la publicada y se deja la duda.
                doubts.append({'tipo': 'Sección por revisar', 'clave': ref, 'ref': ref,
                               'detalle': f'{ref} · {name}: está en «{previous["section"]}», pero las reglas lo '
                                          f'colocarían en «{row["section"]}». Se mantiene la sección publicada.'})
                row['section'] = previous['section']
        elif not c['is_part'] and cat in DISPLAY_CATS:
            doubts.append({'tipo': 'Modelo nuevo sin clasificar', 'clave': path, 'ref': ref,
                           'detalle': f'{ref} · {name}: modelo que no estaba en la colección. País, sección y fecha se '
                                      'asignan con las reglas automáticas y quedan por revisar.'})
        row['display_selected'] = previous['display_selected'] if previous else ready
        row['health_group'] = 'repair' if row['damaged'] else 'incomplete' if complete is False else 'good'
        row['health_label'] = {'repair': 'Irrecuperables / pendientes de reparar', 'incomplete': 'Incompletos',
                               'good': 'En buen estado'}[row['health_group']]
        if name.endswith(' Casing'):
            row['piece_type'] = 'Cartucho de artillería · conjunto montado' if row['parts'] else 'Vaina'
        if unchecked:
            row['doubt'] = 'Montaje sin comprobar con el juego'
        result.append(row)
    if not (len(result) == len({r['ref'] for r in result}) == len(items)):
        raise RuntimeError('Referencias duplicadas al construir el inventario')
    return result, items, classes, doubts
