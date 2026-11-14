# Osta · Archivo de la colección — traspaso a Claude Code

## Qué es
- Osta es un videojuego (Unreal Engine; clases tipo `/Game/Items/Receivers/Mosins/SakoHuntingMosin.SakoHuntingMosin_C`).
- Manuel tiene un mod hecho para el juego (hecho con ChatGPT; archivos aún no entregados) y una web hecha con ChatGPT: https://osta-archivo-coleccion.manuelcasper007.chatgpt.site
- Secciones de la web (mantenerlas): Vista general, Mi colección, Puedes montar, Me falta, Catálogo del juego, Pendientes, Fotos y dudas, Datos y actualizaciones.

## Datos (osta-coleccion-datos.json, ~6,6 MB, copia del 2026-11-08)
- `meta`: recuentos, `snapshot_dates` por casa, `variant_states`, `unresolved_assets` (45), notas de método (`scope`, `variant_method`, `buildable_method`, `update_method`), `autosync`, `dataset_hash`.
- `inventory` (1650): ref, name, class, group, house (Estonia/Afganistán/Francia), origin, complete, damaged, original, status, parts, missing, x/y/z, display_house, section, family, piece_type, era, nation, mounted, fecha + precisión + fuente.
- `catalogue` (780): id (clase del juego), asset, category, nation, display_house, section, piece_type, family, date, owned, good, refs.
- `variants` (1842): id, axis, target, state (missing 1408 / complete 337 / buildable 56 / incomplete 38 / repair 3), plan, refs, repair_refs, incomplete_refs, base_refs, native_plan_verified.
- `photos` (24): dudas de identificación con prioridad y vistas necesarias.
- "Casas" = las tres partidas/inventarios guardados (Estonia, Francia, Afganistán).
- `scope`: "Casa recomendada" = propuesta de exposición (display_house); "ubicación guardada" = dónde está el objeto en la partida (house).

## Reglas de cálculo (de meta)
- Variantes: cada objetivo comprueba una pieza concreta dentro de un objeto completo; interiores y visores alternativos comprobados con la función de montaje del juego; el resto desde NaturalParts. No se enumeran combinaciones cruzadas ni se declaran variantes históricas nuevas por cambiar un cargador.
- "Puedes montarlo": base sin daño + piezas montadas y repuestos sueltos sin daño; no desmonta otros objetos ni reserva piezas (dos objetivos pueden necesitar el mismo repuesto).
- En caso de duda de clasificación: reproducir lo que ya hace el JSON existente (usarlo como referencia/test: el lector nuevo debe dar los mismos resultados con las mismas partidas) y conservar las dudas en lugar de inventar.

## Actualización actual (a sustituir)
- Revisión cada 30 min desde la app de ChatGPT, leyendo las partidas guardadas. Requiere PC y ChatGPT abiertos.

## Objetivo nuevo
1. Que la web se actualice sola **cada vez que se inicia el juego y al cerrarlo**, sin depender de ChatGPT ni de Claude abiertos.
2. **Dos ordenadores** con las mismas partidas (sincronizadas entre ambos). Código y web en un repositorio de GitHub clonado en los dos PC; actualizador instalado en ambos; antes de publicar, `git pull`; si los datos no han cambiado (hash), no publicar.
3. Publicación: web estática en GitHub Pages.
4. Rehacer la web con las mismas secciones a partir del JSON y seguir ampliándola.
5. Más adelante: seguir con el mod (pedir los archivos a Manuel).

## Pendiente de averiguar
- Ruta de instalación del juego / nombre del ejecutable.
- Cuenta de GitHub de Manuel.
