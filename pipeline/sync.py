"""Lee las tres casas y regenera los datos de la web. Nunca escribe en el juego."""
import datetime
import hashlib
import json
import time

import build as builder
import native
from config import DATA, DOCS, HOMES, SAVES, WORK, game_build, game_running
from inventory import build_inventory
from read_save import parse_items


class SyncError(Exception):
    """Error que impide publicar (se registra y se reintenta en el siguiente evento)."""


def load(name, base=DATA):
    return json.loads((base / name).read_text(encoding='utf-8'))


def dump(path, value, compact=False):
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(value, ensure_ascii=False, separators=(',', ':')) if compact else json.dumps(value, ensure_ascii=False, indent=2) + '\n'
    tmp = path.with_suffix(path.suffix + '.tmp')
    tmp.write_text(text, encoding='utf-8')
    tmp.replace(path)


def read_saves(saves=SAVES, min_age=10, log=print):
    """Copia estable de los tres guardados. Espera si alguno se está escribiendo."""
    items, hashes, dates = [], {}, {}
    for filename, (origin, prefix) in HOMES.items():
        source = saves / filename
        if not source.exists():
            raise SyncError(f'Falta el guardado {filename}; no se publica un inventario parcial.')
        for attempt in range(12):
            age = time.time() - source.stat().st_mtime
            if age < min_age:
                time.sleep(min_age - age + 1)
                continue
            before = source.stat()
            blob = source.read_bytes()
            after = source.stat()
            if (before.st_size, before.st_mtime_ns) == (after.st_size, after.st_mtime_ns) == (len(blob), after.st_mtime_ns):
                break
            time.sleep(3)
        else:
            raise SyncError(f'{filename} no deja de cambiar; se reintentará en el próximo evento.')
        hashes[filename] = hashlib.sha256(blob).hexdigest()
        dates[origin] = datetime.datetime.fromtimestamp(after.st_mtime).astimezone().isoformat(timespec='seconds')
        try:
            records = parse_items(blob)
        except Exception as e:
            raise SyncError(f'No se pudo leer {filename}: {e}')
        for row in records:
            row.update(origin=origin, uid=prefix + '-' + str(row['index']))
            items.append(row)
    for filename, digest in hashes.items():
        if hashlib.sha256((saves / filename).read_bytes()).hexdigest() != digest:
            raise SyncError('Un guardado cambió durante la lectura; se reintentará.')
    return items, hashes, dates


def generate(items, dates, reason, base_inventory=None, base_raw=None, use_native=True, log=print, now=None):
    """Devuelve (payload web, ficheros de datos a guardar)."""
    classes = load('classes.json')
    evaluations = load('assembly-evaluations.json')
    old = base_inventory if base_inventory is not None else load('inventory.json')['items']
    raw = {r['uid']: r for r in (base_raw if base_raw is not None else load('raw-items.json'))}
    if use_native and native.available() and not game_running():
        stamp = datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
        try:
            native.resolve(WORK / 'native' / stamp, items, classes, evaluations, log=log)
        except Exception as e:  # sin comprobación nativa: quedará como duda
            log(f'Aviso: la comprobación nativa falló ({e}); lo nuevo queda como duda.')
    rows, items, classes_all, doubts = build_inventory(items, classes, evaluations, old, raw,
                                                       load('photo-reviews.json'), load('chronology.json'))
    photos = load('photos.json')
    for p in photos:
        p['refs'] = [r['ref'] for r in rows if r['name'] in p['names']]
    now = now or datetime.datetime.now().astimezone()
    meta = load('snapshot-meta.json')
    meta.update(revision=now.strftime('%Y-%m-%d %H:%M') + ' · ' + reason,
                snapshot_dates={k: v[:10] for k, v in dates.items()},
                scope='Inventarios guardados de Estonia, Francia y Afganistán. Casa recomendada indica la propuesta de exposición; ubicación guardada indica dónde está el objeto.',
                update_method='Se actualiza sola al abrir y al cerrar Osta en cualquiera de los dos ordenadores: lee las partidas guardadas y publica una revisión nueva si los datos cambian. No necesita ChatGPT ni Claude. Los cambios sin guardar todavía no aparecen.',
                autosync={'trigger': 'Al abrir y al cerrar el juego', 'last_scan': now.isoformat(timespec='seconds')})
    files = {'inventory.json': {'items': rows}, 'raw-items.json': items, 'classes.json': classes,
             'assembly-evaluations.json': evaluations, 'photos.json': photos, 'snapshot-meta.json': meta}
    payload = builder.build([dict(r) for r in rows], items, classes_all, load('universe.json'), photos, evaluations,
                            load('plan-evaluations.json')['results'], load('plan-links.json'), meta)
    payload['meta']['doubts'] = doubts
    return payload, files


def publish_key(payload):
    m = payload.get('meta', {})
    return json.dumps([m.get('dataset_hash'), m.get('doubts', []), m.get('alerts', [])], ensure_ascii=False, sort_keys=True)


def write_outputs(payload, files, hashes):
    for name, value in files.items():
        dump(DATA / name, value)
    dump(DATA / 'save-hashes.json', hashes)
    dump(DOCS / 'data.json', payload, compact=True)
    builder.write_csv(payload, DOCS / 'objetivos-coleccion.csv')


def current_build_status():
    expected = load('snapshot-meta.json')['build']
    return game_build(), expected
