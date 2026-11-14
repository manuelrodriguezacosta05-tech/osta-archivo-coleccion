"""Comprobación nativa OPCIONAL de clases y montajes nuevos.

Usa una copia aislada del juego con UE4SS (nunca la instalación del jugador ni su
partida). Si la copia no existe en este PC, no se hace nada y las combinaciones
nuevas quedan como duda. Port de collection-autosync/native.py.
"""
import json
import subprocess
import time
from pathlib import Path

from config import NATIVE_RUNTIME, PIPE

LUA = PIPE / 'native'


def available():
    return (NATIVE_RUNTIME / 'Osta-Win64-Shipping.exe').exists() and \
        (NATIVE_RUNTIME / 'ue4ss/Mods/OstaAutoIdentify/Scripts/main.lua').exists()


def _run(stage: Path, kind: str, expected, log):
    main = NATIVE_RUNTIME / 'ue4ss/Mods/OstaAutoIdentify/Scripts/main.lua'
    original = main.read_bytes()
    (stage / (kind + '-main.before.lua')).write_bytes(original)
    source = (LUA / (kind + '.lua')).read_text(encoding='utf-8').replace('__BASE__', stage.as_posix() + '/')
    out = stage / ('classes.json' if kind == 'classes' else 'evaluations.json')
    proc = None
    try:
        main.write_text(source, encoding='utf-8')
        with (stage / (kind + '-stdout.log')).open('w') as so, (stage / (kind + '-stderr.log')).open('w') as se:
            proc = subprocess.Popen([str(NATIVE_RUNTIME / 'Osta-Win64-Shipping.exe'), '-nullrhi', '-nosound', '-unattended',
                                     '-windowed', '-ResX=640', '-ResY=360', '-UserDir=' + str(stage / 'native-profile')],
                                    cwd=NATIVE_RUNTIME, stdout=so, stderr=se, creationflags=subprocess.CREATE_NO_WINDOW)
            deadline = time.monotonic() + 150
            while time.monotonic() < deadline:
                try:
                    v = json.loads(out.read_text(encoding='utf-8'))
                    results = v if kind == 'classes' else v['results']
                    if all(str(k) in results for k in expected):
                        return v
                except (OSError, ValueError, KeyError):
                    pass
                if proc.poll() is not None:
                    raise RuntimeError('el runtime aislado terminó antes de completar ' + kind)
                time.sleep(.4)
            raise RuntimeError('tiempo agotado en ' + kind)
    finally:
        if proc is not None and proc.poll() is None:
            proc.terminate()
            try:
                proc.wait(timeout=15)
            except subprocess.TimeoutExpired:
                proc.kill()
        main.write_bytes(original)


def resolve(stage: Path, items, classes, evaluations, log=print):
    """Completa `classes` y `evaluations` in situ. Devuelve True si se ejecutó algo."""
    stage.mkdir(parents=True, exist_ok=True)
    ran = False
    ids = sorted({i for r in items for i in [r['ID'], *r['AttachedParts']] if str(i) not in classes})
    if ids:
        log(f'Comprobación nativa: {len(ids)} clases nuevas')
        (stage / 'ids.lua').write_text('return {' + ','.join(map(str, ids)) + '}', encoding='utf-8')
        classes.update(_run(stage, 'classes', ids, log))
        ran = True
    jobs = {}
    for r in items:
        c = classes.get(str(r['ID']))
        if not c:
            continue
        cat = c['path'].split('/Items/')[-1].split('/')[0]
        if c['is_part'] or cat not in ('Receivers', 'Helmets', 'UXO', 'Misc'):
            continue
        key = str(r['ID']) + ':' + ','.join(map(str, sorted(r['AttachedParts'])))
        if key not in evaluations['results']:
            jobs[key] = {'key': key, 'ID': r['ID'], 'parts': r['AttachedParts']}
    if jobs:
        log(f'Comprobación nativa: {len(jobs)} montajes nuevos')
        lines = ['return {']
        for j in jobs.values():
            lines.append('{key=' + json.dumps(j['key']) + ',ID=' + str(j['ID']) + ',parts={' + ','.join(map(str, j['parts'])) + '}},')
        (stage / 'jobs.lua').write_text('\n'.join(lines + ['}']), encoding='utf-8')
        checks = _run(stage, 'evaluate', jobs, log)
        for k in ('results', 'templates'):
            evaluations[k].update(checks[k])
        ran = True
    return ran
