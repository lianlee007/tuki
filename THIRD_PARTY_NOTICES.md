# Avisos de terceros

El código original de TukiTuki se distribuye bajo la licencia MIT del archivo
[`LICENSE`](LICENSE).

Hay una dependencia que cambia las condiciones si el proyecto se distribuye:

- **Ultralytics YOLO11** (`ultralytics`), usado por `services/vision-service`,
  se distribuye bajo **AGPL-3.0**. Si el servicio de visión se ofrece como
  servicio de red o se distribuye junto con el resto del sistema, hay que
  cumplir la AGPL (publicar el código del servicio) o comprar una licencia
  comercial de Ultralytics.
- El modelo `comida-v1.pt` fue entrenado con YOLO11n-cls y hereda esa
  restricción.
- Las demás dependencias conservan sus propias licencias. Los archivos
  `package.json`, `requirements.txt` y `pyproject.toml` son la fuente para una
  auditoría completa con una herramienta de composición de licencias.

Para el alcance académico del Diplomado CloudForge el repositorio no se
distribuye comercialmente. Antes de publicar un producto hay que decidir entre
AGPL-3.0 para `vision-service` o una licencia comercial de Ultralytics.
