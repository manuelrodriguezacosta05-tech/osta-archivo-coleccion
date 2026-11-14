"""Valida el lector nuevo contra el JSON publicado por el sistema anterior.

Prueba 1: guardados actuales + base = datos del repositorio  -> debe dar el mismo dataset.
Prueba 2: guardados actuales + base anterior (antes de la sync del 2026-11-08 18:29)
          -> debe reproducir la misma asignación de referencias y el mismo dataset.
Las diferencias se listan campo a campo; no se corrigen a mano.
"""
import collections
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
import build  # noqa: E402
import sync  # noqa: E402

REFERENCE = json.loads((HERE / 'reference-2026-11-08.json').read_text(encoding='utf-8'))
SECTIONS = {'inventory': 'ref', 'catalogue': 'id', 'variants': 'id', 'photos': 'id'}


def canonical(payload):
    """El sistema anterior ordenaba las listas de `plan` al azar (orden de un set de Python):
    se comparan ordenadas. El contenido debe coincidir exactamente."""
    # El JSON descargado pasó por JavaScript, que escribe 3220.0 como 3220: mismo número.
    out = json.loads(json.dumps(payload), parse_float=lambda s: int(float(s)) if float(s).is_integer() else float(s))
    for v in out['variants']:
        for k in ('missing', 'available'):
            v['plan'][k] = sorted(v['plan'][k], key=lambda x: json.dumps(x, sort_keys=True, ensure_ascii=False))
    return out


def compare(payload, label):
    payload = canonical(payload)
    ref_payload = canonical(REFERENCE)
    print(f'\n== {label}')
    total = 0
    for section, key in SECTIONS.items():
        new = {r[key]: r for r in payload[section]}
        ref = {r[key]: r for r in ref_payload[section]}
        only_new, only_ref = sorted(set(new) - set(ref)), sorted(set(ref) - set(new))
        fields = collections.Counter()
        examples = {}
        for k in set(new) & set(ref):
            a, b = new[k], ref[k]
            for f in set(a) | set(b):
                if a.get(f) != b.get(f):
                    fields[f] += 1
                    examples.setdefault(f, (k, b.get(f), a.get(f)))
        n = len(only_new) + len(only_ref) + sum(fields.values())
        total += n
        print(f'  {section:10s} nuevos={len(new)} referencia={len(ref)} solo_nuevo={len(only_new)} solo_ref={len(only_ref)} campos_distintos={dict(fields)}')
        for f, (k, b, a) in list(examples.items())[:8]:
            print(f'     ej. {k} · {f}: referencia={str(b)[:90]!r} nuevo={str(a)[:90]!r}')
    h = build.dataset_hash(*(payload[k] for k in ('inventory', 'variants', 'photos', 'catalogue')))
    hr = build.dataset_hash(*(ref_payload[k] for k in ('inventory', 'variants', 'photos', 'catalogue')))
    print(f'  hash canónico nuevo={h} referencia={hr} -> {"IGUAL" if h == hr else "DISTINTO"}')
    print(f'  dudas registradas: {len(payload["meta"]["doubts"])}')
    for d in payload['meta']['doubts'][:10]:
        print('    -', d['tipo'], '·', d['detalle'][:140])
    return total == 0 and h == hr


def main():
    saves = Path(sys.argv[1]) if len(sys.argv) > 1 else sync.SAVES
    items, hashes, dates = sync.read_saves(saves, min_age=0)
    print('Guardados leídos:', {k: v[:12] for k, v in hashes.items()}, 'objetos:', len(items))
    ok = True
    payload, _ = sync.generate([dict(i) for i in items], dates, 'validación', use_native=False)
    ok &= compare(payload, 'Prueba 1 · base = datos actuales del repositorio')
    base_inv = json.loads((HERE / 'base-20261108-inventory.json').read_text(encoding='utf-8'))['items']
    base_raw = json.loads((HERE / 'base-20261108-raw-items.json').read_text(encoding='utf-8'))
    payload2, _ = sync.generate([dict(i) for i in items], dates, 'validación', base_inventory=base_inv, base_raw=base_raw, use_native=False)
    ok &= compare(payload2, 'Prueba 2 · base anterior a la sincronización del 2026-11-08')
    print('\nRESULTADO:', 'OK · reproduce el JSON publicado' if ok else 'HAY DIFERENCIAS (ver arriba)')
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
