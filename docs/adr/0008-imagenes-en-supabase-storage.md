# ADR 0008 — Imágenes en Supabase Storage en lugar de Cloudinary

- **Estado:** aceptado
- **Fecha:** 2026-10-29
- **Relacionado:** ADR 0003 (servicios gestionados), ADR 0007 (monolito modular)

## Contexto

Las fotos de platillos, el logo/banner del restaurante y las fotos de reseñas
se subían a Cloudinary con un preset **sin firmar**. Funcionaba, pero añadía un
proveedor, dos variables de build (`VITE_CLOUDINARY_*`), un preset público que
cualquiera podía usar y una CDN externa que no aparecía en la arquitectura
documentada. El diplomado ya usa Supabase para Postgres, Auth y RLS; sumar
Storage reduce la superficie a un solo proveedor de datos.

## Decisión

Usar **Supabase Storage** con tres buckets públicos de lectura:

| Bucket | Contenido | Límite | Tipos |
| --- | --- | --- | --- |
| `platillos` | Foto del menú | 5 MB | JPEG, PNG, WebP, AVIF |
| `restaurantes` | Logo y banner | 5 MB | JPEG, PNG, WebP, AVIF |
| `resenas` | Foto del comensal | 8 MB | JPEG, PNG, WebP, AVIF |

- La compresión ocurre **en el navegador** (`src/lib/almacenamiento.ts`):
  máximo 1600 px por el lado largo, WebP a calidad 0.82 y fallback a JPEG.
- La URL pública se guarda en la misma columna que antes (`imagen_url`,
  `foto_url`, `imagen_*_url`). El resto de la aplicación no cambia.
- RLS: lectura pública, subida para `anon` y `authenticated` (igual que el
  preset sin firmar anterior), actualización y borrado solo del dueño.

## Alternativas descartadas

- **R2 de Cloudflare.** Buen encaje con el edge, pero obliga a firmar subidas y
  a mantener otro proveedor. Se documenta como opción en
  `deploy/cloudflare/README.md`, no como dependencia.
- **Servicio propio de archivos en el clúster.** Un `Deployment` con volumen
  persistente rompe la regla de "cero estado en Kubernetes" (ADR 0003).
- **Seguir con Cloudinary.** No aporta nada que Storage no cubra y mantiene un
  preset público sin control de cuota.

## Consecuencias

- **A favor:** un proveedor menos, un juego de credenciales menos, mismo origen
  que la base de datos, políticas RLS auditables y cuota medida junto al resto.
- **En contra:** en el plan gratuito **no hay transformaciones de imagen** (sí
  en Pro). La optimización depende del navegador, así que la calidad del
  resultado varía si el cliente es antiguo. Se mitiga comprimiendo antes de
  subir y sirviendo `loading="lazy"`.
- **Riesgo aceptado:** permitir subidas anónimas al bucket `resenas` replica el
  riesgo del preset sin firmar. Si aparece abuso, el siguiente paso es una Edge
  Function que firme la subida y valide el JWT del comensal.
