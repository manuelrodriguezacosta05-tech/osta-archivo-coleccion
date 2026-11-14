"""Actualizador: guardados -> datos -> GitHub Pages.

Uso:
  python pipeline/update.py --reason "al cerrar el juego" [--sync] [--no-push] [--force] [--accept-build]

--sync      Antes de nada alinea el clon con origin/main (sólo en el clon del actualizador).
--no-push   Genera los datos pero no hace commit ni push.
--force     Regenera aunque los guardados no hayan cambiado.
"""
import argparse
import datetime
import json
import os
import subprocess
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from config import DATA, DOCS, REPO, WORK  # noqa: E402
import sync  # noqa: E402

LOG = WORK / 'logs' / 'actualizador.log'


def log(msg):
    LOG.parent.mkdir(parents=True, exist_ok=True)
    if LOG.exists() and LOG.stat().st_size > 1_000_000:
        LOG.replace(LOG.with_suffix('.old.log'))
    line = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S') + '  ' + msg
    with LOG.open('a', encoding='utf-8') as f:
        f.write(line + '\n')
    try:
        print(line, flush=True)
    except Exception:
        pass


def git(*args, check=True):
    p = subprocess.run(['git', *args], cwd=REPO, capture_output=True, text=True, encoding='utf-8', errors='replace',
                       creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
    if check and p.returncode:
        raise RuntimeError('git ' + ' '.join(args) + ' -> ' + (p.stderr or p.stdout).strip())
    return p


def align_with_remote():
    git('fetch', '--quiet', 'origin')
    git('reset', '--quiet', '--hard', 'origin/main')


class Lock:
    def __init__(self, path):
        self.path = path

    def __enter__(self):
        self.path.parent.mkdir(parents=True, exist_ok=True)
        for _ in range(120):
            try:
                self.fd = os.open(self.path, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
                os.write(self.fd, str(os.getpid()).encode())
                return self
            except FileExistsError:
                if time.time() - self.path.stat().st_mtime > 900:  # bloqueo huérfano
                    self.path.unlink(missing_ok=True)
                    continue
                time.sleep(5)
        raise RuntimeError('Otra actualización sigue en curso.')

    def __exit__(self, *exc):
        os.close(self.fd)
        self.path.unlink(missing_ok=True)


def build_alert(found, expected):
    return {'tipo': 'Versión del juego', 'detalle': f'El juego se ha actualizado (build {found}; los datos se comprobaron con la '
            f'build {expected}). La colección se muestra tal como estaba hasta revisar el catálogo nativo.'}


def run_once(reason, do_sync, push, force, accept_build):
    if do_sync:
        align_with_remote()
    found, expected = sync.current_build_status()
    published = json.loads((DOCS / 'data.json').read_text(encoding='utf-8'))
    if found and found != expected and not accept_build:
        alert = build_alert(found, expected)
        if published['meta'].get('alerts') != [alert]:
            published['meta']['alerts'] = [alert]
            sync.dump(DOCS / 'data.json', published, compact=True)
            log('AVISO: ' + alert['detalle'])
            return commit_and_push(f'Aviso: el juego cambió a la build {found}', push)
        log('Build distinta pendiente de revisar; no se publica nada nuevo.')
        return 'sin cambios'
    if accept_build and found and found != expected:
        meta = sync.load('snapshot-meta.json')
        meta['build'] = found
        sync.dump(DATA / 'snapshot-meta.json', meta)
        log(f'Build {found} aceptada; lo que no cuadre quedará como duda.')
    items, hashes, dates = sync.read_saves(log=log)
    previous_hashes = sync.load('save-hashes.json') if (DATA / 'save-hashes.json').exists() else {}
    if hashes == previous_hashes and not force:
        log(f'Sin cambios en los guardados ({reason}).')
        return 'sin cambios'
    payload, files = sync.generate(items, dates, reason, log=log)
    if sync.publish_key(payload) == sync.publish_key(published) and not force:
        log(f'Los guardados cambiaron pero los datos de la colección son idénticos (hash {payload["meta"]["dataset_hash"]}); no se publica.')
        return 'sin cambios'
    sync.write_outputs(payload, files, hashes)
    m = payload['meta']
    log(f'Datos nuevos: {m["inventory_count"]} objetos, hash {m["dataset_hash"]}, dudas {len(m["doubts"])}.')
    return commit_and_push(f'Colección actualizada {reason} · {m["inventory_count"]} objetos · {m["dataset_hash"]}', push)


def commit_and_push(message, push):
    if not push:
        log('Generado sin publicar (--no-push).')
        return 'generado'
    git('add', '-A', 'docs', 'pipeline/data')
    if not git('diff', '--cached', '--quiet', check=False).returncode:
        log('Nada que publicar.')
        return 'sin cambios'
    git('commit', '--quiet', '-m', message)
    p = git('push', '--quiet', 'origin', 'HEAD:main', check=False)
    if p.returncode:
        raise PushConflict(p.stderr.strip())
    log('Publicado en GitHub: ' + message)
    return 'publicado'


class PushConflict(Exception):
    pass


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--reason', default='actualización manual')
    ap.add_argument('--sync', action='store_true')
    ap.add_argument('--no-push', action='store_true')
    ap.add_argument('--force', action='store_true')
    ap.add_argument('--accept-build', action='store_true')
    a = ap.parse_args()
    if a.sync:
        # Primero se alinea el clon y luego se relanza este script, para ejecutar siempre
        # el código recién descargado (el ya importado podría ser el de la versión anterior).
        try:
            align_with_remote()
        except Exception as e:
            log('No se pudo sincronizar con GitHub: ' + str(e))
            return 5
        argv = [x for x in sys.argv[1:] if x != '--sync']
        return subprocess.run([sys.executable, '-X', 'utf8', str(Path(__file__).resolve()), *argv],
                              creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0)).returncode
    with Lock(WORK / 'update.lock'):
        for attempt in (1, 2, 3):
            try:
                result = run_once(a.reason, a.sync, not a.no_push, a.force, a.accept_build)
                return 0 if result else 1
            except PushConflict as e:
                # El otro PC publicó a la vez: se descarta lo local y se regenera sobre lo último.
                log(f'Push rechazado ({e}); reintentando sobre la versión remota.')
                align_with_remote()
                a.sync = True
            except sync.SyncError as e:
                log('No se publica: ' + str(e))
                return 2
            except Exception as e:
                log('ERROR: ' + repr(e))
                return 3
    return 4


if __name__ == '__main__':
    sys.exit(main())
