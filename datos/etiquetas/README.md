# Etiquetas de comida / no comida

- `export-labelstudio-comida.json`: exportación original de Label Studio
  (proyecto 2). Es la fuente de verdad de las etiquetas; no contiene imágenes,
  solo rutas y anotaciones.
- `manifiesto-comida.csv`: versión reducida y reproducible que usa el
  entrenamiento. Columnas: `tarea_id`, `archivo_origen` (relativa a `~/`),
  `archivo_destino`, `clase`, `split` y `sha256`.

Las fotos **no se versionan**: son material de sus autores. El dataset se
reconstruye con `services/vision-service/entrenamiento/preparar_dataset.py` si
las imágenes están en `~/Downloads/Comida` y `~/Downloads/No comida`, o con
`--raiz` apuntando a la carpeta donde estén.

Resumen: 1001 tareas → 997 imágenes válidas (500 comida / 497 no comida).
Se descartan 3 tareas sin anotación y un `desktop.ini`.
