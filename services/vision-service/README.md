# Tuki Vision

Clasificador local que responde una pregunta concreta: **¿la foto que sube el
dueño es comida o no?** Se ejecuta con [Ultralytics](https://docs.ultralytics.com/)
(YOLO de clasificación) en el propio servidor de Tuki; ninguna imagen sale a un
proveedor externo.

El panel lo llama antes de publicar la foto de un plato. Si el veredicto es "no
comida", la imagen no se sube y se muestra un aviso con el porcentaje de
seguridad. Si el servicio no está disponible, la subida continúa: el panel no
se bloquea por una comprobación auxiliar.

## Estructura

```text
services/vision-service/
  app/
    config.py                 variables VISION_* y rutas del modelo
    dominio/clasificador.py   regla comida / no comida (sin FastAPI)
    entrada/rutas.py          POST /api/v1/vision/clasificar, /readyz, /modelo
    main.py                   ensamblado y carga del modelo
  entrenamiento/
    preparar_dataset.py       Label Studio JSON -> train/val/test
    entrenar.py               Ultralytics -> modelos/comida-v1.pt
    evaluar.py                métricas, matriz de confusión y umbral
  modelos/                    pesos y informe de métricas
  tests/                      API y reglas de etiquetas, sin cargar torch
```

## Arranque

```bash
cd services/vision-service
python -m venv .venv
.venv/Scripts/activate            # Windows
pip install -r requirements-dev.txt
.venv/Scripts/python -m uvicorn app.main:app --reload --port 8002
```

En Linux/macOS: `source .venv/bin/activate` y `python -m uvicorn ...`.

- Documentación interactiva: <http://localhost:8002/docs>
- Salud: `GET /healthz`
- Disponibilidad: `GET /readyz` (503 mientras no haya modelo)
- Clasificar: `POST /api/v1/vision/clasificar` con `multipart/form-data` y el
  campo `imagen`.

```bash
curl -X POST http://localhost:8002/api/v1/vision/clasificar \
  -F "imagen=@plato.jpg"
```

```json
{
  "es_comida": true,
  "etiqueta": "comida",
  "confianza": 0.987,
  "probabilidad_comida": 0.987,
  "umbral": 0.65,
  "modelo": "comida-v1.pt"
}
```

## Entrenamiento

El punto de partida es la exportación de Label Studio del proyecto de
clasificación (`comida` / `no comida`). El manifiesto reducido que se versiona
está en `datos/etiquetas/manifiesto-comida.csv`.

```bash
# 1) Reparte las fotos en train/val/test. La exportación de Label Studio está
#    versionada en datos/etiquetas; las imágenes se buscan bajo ~/Downloads.
python entrenamiento/preparar_dataset.py \
  --export ../../datos/etiquetas/export-labelstudio-comida.json \
  --raiz ~/ \
  --salida datos/comida

# 2) Ajusta yolo11n-cls.pt (CPU por defecto).
python entrenamiento/entrenar.py --datos datos/comida --epocas 20

# 3) Mide en test y propone el umbral.
python entrenamiento/evaluar.py --modelo modelos/comida-v1.pt --datos datos/comida
```

`preparar_dataset.py` descarta tareas sin anotación, archivos que no son
imágenes (`desktop.ini`), duplicados por hash y fotos cuyo formato no lee
OpenCV (las AVIF/HEIC con extensión `.jpg` se convierten a JPEG). El reparto es
estratificado y reproducible con `--semilla 42`.

En una GPU, cambia `--dispositivo 0` en los dos scripts.

### Resultado del entrenamiento

Consulta `modelos/comida-v1.metricas.json` (lo expone
`GET /api/v1/vision/modelo`). El umbral de producto es
`VISION_UMBRAL_COMIDA`: se acepta la foto cuando la probabilidad de "comida"
lo supera. `evaluar.py` imprime el umbral con mejor F1; si el dueño reporta
rechazos injustos, súbelo o baja (según el caso) sin reentrenar.

## Configuración

Todas las variables usan el prefijo `VISION_`; ver `.env.example`.

| Variable | Por defecto | Uso |
| --- | --- | --- |
| `VISION_MODEL_PATH` | `modelos/comida-v1.pt` | pesos de Ultralytics |
| `VISION_UMBRAL_COMIDA` | `0.3` | probabilidad mínima para aceptar |
| `VISION_ETIQUETA_COMIDA` | `comida` | clase positiva del modelo |
| `VISION_IMGSZ` | `224` | resolución de inferencia |
| `VISION_DEVICE` | `cpu` | `cpu` o `0` para GPU |
| `VISION_MAX_IMAGEN_BYTES` | `8388608` | tope de la foto (8 MB) |

## Pruebas y estilo

```bash
pytest -q
ruff check app entrenamiento tests
```

Las pruebas inyectan un clasificador falso: no descargan pesos ni cargan torch.
`tests/test_clasificador.py` cubre el mapeo de etiquetas (incluido el caso
peligroso de confundir "no-comida" con "comida").

## Limitaciones

- **Licencia:** Ultralytics y YOLO11 son AGPL-3.0. Para uso comercial
  propietario hace falta licencia de Ultralytics o cambiar de modelo.
- El modelo distingue comida de no comida; no valida que el plato exista en el
  menú, ni su calidad, ni alérgenos.
- Fotos oscuras, muy de cerca o con personas pueden caer cerca del umbral.
- Es un clasificador de imagen completa: no detecta objetos ni porciones.
- La métrica es optimista si hay fotos casi idénticas entre splits; se
  deduplicaron por SHA-256, no por similitud visual.
- Si se reentrena con otro dataset, revisa `umbral_recomendado` antes de
  desplegar.
