# Modelos del clasificador

`comida-v1.pt` es el resultado de `entrenamiento/entrenar.py` sobre las 998
fotos anotadas en Label Studio (500 comida / 498 no comida, tras descartar
duplicados y el `desktop.ini`).

- `comida-v1.pt`: pesos de Ultralytics (YOLO de clasificación).
- `comida-v1.metricas.json`: informe de `entrenamiento/evaluar.py` (accuracy,
  matriz de confusión y barrido de umbrales en el split de prueba).

Los pesos son un artefacto generado: si se reentrena, se reemplazan y se
versiona el nuevo archivo. El servicio falla en `/readyz` (pero sigue vivo)
cuando el `.pt` no está.
