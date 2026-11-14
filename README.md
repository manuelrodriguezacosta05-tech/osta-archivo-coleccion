# Osta · Archivo de la colección

Web estática (GitHub Pages) con la colección de las tres casas de Osta —Estonia, Francia y
Afganistán—, que se actualiza sola **al abrir y al cerrar el juego** en cualquiera de los dos
PC. No depende de ChatGPT ni de Claude.

**Web:** https://manuelrodriguezacosta05-tech.github.io/osta-archivo-coleccion/

## Instalar el actualizador en un PC (una línea)

En PowerShell:

```powershell
irm https://raw.githubusercontent.com/manuelrodriguezacosta05-tech/osta-archivo-coleccion/main/updater/instalar.ps1 | iex
```

Instala Git, Python y GitHub CLI si faltan, pide autorizar GitHub una vez, clona el repositorio
en `%USERPROFILE%\OstaArchivo` y registra la tarea oculta «Osta Archivo - actualizador», que
arranca al iniciar sesión.

## Cómo funciona

1. `updater/vigilante.ps1` vigila el proceso `Osta-Win64-Shipping.exe`. Al abrirse (tras 20 s,
   cuando Steam ya bajó la nube) y al cerrarse (tras 25 s, cuando terminó de guardar) ejecuta
   `pipeline/update.py --sync`.
2. `update.py` alinea el clon con GitHub (`git fetch` + `reset` a `origin/main`), lee
   `Save1Home.sav` (Estonia), `Save1FrenchHotel.sav` (Francia) y `Save1AfghanHotel.sav`
   (Afganistán) desde `%LOCALAPPDATA%\Osta\Saved\SaveGames`, sólo lectura y esperando a que el
   archivo deje de escribirse.
3. Si los guardados no han cambiado (hash SHA-256 en `pipeline/data/save-hashes.json`) termina.
   Si cambiaron, regenera los datos; si el `dataset_hash` resultante es igual al publicado, no
   publica. Si es distinto, hace commit y push: GitHub Pages sirve `docs/`.
4. Si los dos PC publican a la vez, el segundo push se rechaza, se descarta lo local y se
   regenera sobre la versión remota.

Registros: `%USERPROFILE%\OstaArchivo\.work\logs\` (`vigilante.log`, `actualizador.log`).

## Reglas de los datos

- Lector de guardados: `pipeline/read_save.py` (GVAS de UE5, array `Items`).
- Inventario: `pipeline/inventory.py` conserva las referencias EE/AF/FR y las correcciones
  históricas emparejando con la revisión anterior (exacto → mismo modelo en la misma casa → entre casas).
- Clasificación: `pipeline/rules.py` y `pipeline/attribution.py` (portadas sin cambios de criterio).
- Catálogo, variantes y «Puedes montar»: `pipeline/build.py`.
- **Lo que no cuadra se marca como duda** (`meta.doubts`, visible en «Fotos y dudas»): clases
  desconocidas, montajes que no se han comprobado con el juego, modelos nuevos sin clasificar y
  secciones inconsistentes. No se deciden automáticamente.
- Comprobación nativa opcional (`pipeline/native.py`): si existe la copia aislada del juego con
  UE4SS (`OSTA_NATIVE_RUNTIME`), resuelve clases y montajes nuevos al cerrar el juego. Nunca toca
  la instalación ni la partida del jugador. Sin ella, lo nuevo queda como duda.
- Si Steam actualiza el juego (cambia la build), la web muestra un aviso y conserva los datos
  hasta revisar el catálogo. Para aceptar la build nueva: `python pipeline/update.py --accept-build --force`.

## Validación

`python pipeline/tests/validate.py` lee los guardados actuales y compara con el JSON publicado
por el sistema anterior (`pipeline/tests/reference-2026-11-08.json`), en dos escenarios. Resultado
al migrar (2026-11-14): 1650 objetos, 780 modelos, 1842 variantes y 24 solicitudes de fotos
idénticos campo a campo. Diferencias documentadas:

- El sistema anterior ordenaba al azar las listas de cada plan (orden de un `set` de Python), por
  lo que su `dataset_hash` cambiaba en cada ejecución. Ahora el orden es estable.
- EE-1428 (M17 Liner) estaba en «Repuestos de compatibilidad compartida» mientras los otros 94
  repuestos compartidos se reclasificaban por país: se mantiene lo publicado y queda como duda.

## Probar en local

```powershell
python -m http.server 8765 --directory docs
```

Más contexto en [TRASPASO.md](TRASPASO.md).
