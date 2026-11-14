"""Rutas y constantes del lector. Detecta Steam/Osta en cualquier PC."""
import os
import re
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
PIPE = REPO / 'pipeline'
DATA = PIPE / 'data'
DOCS = REPO / 'docs'
WORK = REPO / '.work'          # no versionado: copias de guardados, logs, pruebas nativas

APP_ID = '3997240'             # Osta en Steam
GAME_EXE = 'Osta-Win64-Shipping.exe'
SAVES = Path(os.environ.get('OSTA_SAVES') or Path(os.environ.get('LOCALAPPDATA', '')) / 'Osta/Saved/SaveGames')

# Las tres casas: archivo de guardado -> (nombre, prefijo de referencia)
HOMES = {
    'Save1Home.sav': ('Estonia', 'EE'),
    'Save1AfghanHotel.sav': ('Afganistán', 'AF'),
    'Save1FrenchHotel.sav': ('Francia', 'FR'),
}

# Runtime aislado (copia del juego con UE4SS) para comprobar montajes nuevos.
# Opcional: si no existe, los montajes nuevos quedan como duda en vez de inventarse.
NATIVE_RUNTIME = Path(os.environ.get('OSTA_NATIVE_RUNTIME') or
                      Path.home() / 'Documents/Codex/2026-08-15/iy/work/original-runtime/Osta/Binaries/Win64')


def game_running():
    import subprocess
    try:
        # Bytes: tasklist responde en la codificación OEM del sistema (p. ej. «INFORMACIÓN» en cp850).
        out = subprocess.run(['tasklist', '/FI', f'IMAGENAME eq {GAME_EXE}', '/NH'], capture_output=True,
                             creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0)).stdout or b''
        return GAME_EXE.lower().encode() in out.lower()
    except OSError:
        return False


def steam_libraries():
    roots = []
    try:
        import winreg
        for hive, key in ((winreg.HKEY_CURRENT_USER, r'Software\Valve\Steam'),
                          (winreg.HKEY_LOCAL_MACHINE, r'SOFTWARE\WOW6432Node\Valve\Steam')):
            try:
                with winreg.OpenKey(hive, key) as k:
                    for name in ('SteamPath', 'InstallPath'):
                        try:
                            roots.append(Path(winreg.QueryValueEx(k, name)[0]))
                        except OSError:
                            pass
            except OSError:
                pass
    except ImportError:
        pass
    libs = []
    for root in roots:
        vdf = root / 'steamapps/libraryfolders.vdf'
        if vdf.exists():
            libs += [Path(p.replace('\\\\', '\\')) for p in re.findall(r'"path"\s+"([^"]+)"', vdf.read_text(encoding='utf-8', errors='replace'))]
        libs.append(root)
    seen, out = set(), []
    for lib in libs:
        key = str(lib).lower()
        if key not in seen:
            seen.add(key)
            out.append(lib)
    return out


def game_manifest():
    for lib in steam_libraries():
        m = lib / 'steamapps' / f'appmanifest_{APP_ID}.acf'
        if m.exists():
            return m
    return None


def game_build():
    m = game_manifest()
    if not m:
        return None
    hit = re.search(r'"buildid"\s+"(\d+)"', m.read_text(encoding='utf-8', errors='replace'))
    return hit.group(1) if hit else None
