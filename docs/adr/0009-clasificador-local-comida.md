# ADR 0009 — Clasificador local de fotos con Ultralytics

- **Estado:** aceptado
- **Fecha:** 2026-11-18
- **Relacionado:** ADR 0003 (servicios gestionados), ADR 0005 (arquitectura
  hexagonal), ADR 0008 (imágenes en Supabase Storage)

## Contexto

El panel deja que el dueño suba fotos de platos. Nada impedía publicar una
fachada, un logo o una captura de pantalla como si fuera un plato. El proyecto
de Label Studio ya tenía 997 fotos etiquetadas como `comida` o `no comida`, así
que la pregunta era cómo convertir esa etiqueta en una comprobación útil sin
introducir una dependencia cloud nueva.

Restricciones:

- La foto no debería salir de la infraestructura de Tuki.
- La comprobación no puede bloquear el panel si falla.
- El coste por imagen debe ser cero; el tráfico del menú no paga una API.
- El despliegue tiene que caber en el clúster de demostración (CPU, sin GPU).

## Decisión

Entrenar un **YOLO de clasificación de Ultralytics** (`yolo11n-cls`) con las
etiquetas de Label Studio y servirlo desde un microservicio FastAPI propio
(`services/vision-service`).

- La clase positiva se busca por nombre (`comida`) y se devuelve
  `probabilidad_comida`, no solo la clase ganadora.
- El umbral (`VISION_UMBRAL_COMIDA`) es configuración; se ajusta con el barrido
  de `entrenamiento/evaluar.py` sin reentrenar.
- El panel llama a `POST /vision/api/v1/vision/clasificar` antes de subir. Un
  "no comida" bloquea la subida; un 503 o un timeout **no** la bloquea.
- El servicio no guarda imágenes ni tiene salida a Internet. Los pesos viajan
  en la imagen Docker.

## Alternativas descartadas

- **CLIP zero-shot.** No requiere entrenamiento, pero el modelo es más grande,
  la etiqueta "comida" es difusa y no aprovecha las 997 fotos ya etiquetadas.
  Además, el artefacto y la latencia en CPU son mayores.
- **API de visión cloud** (OpenAI, Google Vision, Groq). Añade coste por
  imagen, latencia de red y un tercero que recibe fotos de restaurantes; choca
  con el objetivo de IA local.
- **Heurística de color o tamaño.** No distingue una pizza de una planta; el
  mantenimiento sería peor que el de un modelo pequeño.
- **Bloquear siempre si el servicio falla.** Convierte una comprobación
  auxiliar en un punto único de fallo del panel.

## Consecuencias

- **Licencia.** Ultralytics y los pesos YOLO11 se distribuyen bajo AGPL-3.0.
  Para un producto propietario hay que comprar la licencia de Ultralytics o
  sustituir el modelo por uno con licencia permisiva (por ejemplo, un
  `timm`/ResNet entrenado con el mismo dataset). No se detectó en la revisión
  de dependencias del frontend porque vive en un servicio Python aparte.
- Hay que versionar un artefacto binario (~5,5 MB) y reentrenarlo cuando cambie
  el dataset. El manifiesto y el script de preparación hacen el proceso
  reproducible.
- El modelo es de imagen completa: no detecta objetos, alérgenos ni si el
  plato está en el menú.
- La inferencia en CPU tarda decenas de milisegundos por foto; suficiente para
  una subida interactiva.
- Un falso negativo es la molestia esperada. Si aparece, se ajusta el umbral o
  se amplía el dataset; no se relaja la validación de tipos.
