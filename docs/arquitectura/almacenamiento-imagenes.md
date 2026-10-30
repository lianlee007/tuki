# Almacenamiento de imágenes

Referencia operativa del [ADR 0008](../adr/0008-imagenes-en-supabase-storage.md).

## 1. Dónde vive cada foto

| Bucket | Quién sube | Dónde se usa |
| --- | --- | --- |
| `platillos` | Dueño del restaurante (panel) | Tarjetas del menú y buscador |
| `restaurantes` | Dueño del restaurante (panel) | Logo y banner del local |
| `resenas` | Comensal (formulario de reseña) | Reseñas del restaurante |

Las tres columnas siguen guardando una **URL pública**:

```text
https://<proyecto>.supabase.co/storage/v1/object/public/platillos/<uuid>.webp
```

## 2. Qué optimiza la aplicación

`src/lib/almacenamiento.ts` comprime antes de subir:

1. Redimensiona a **1600 px** por el lado largo (suficiente para una tarjeta a
   2x; el original de un móvil suele ser 4000 px).
2. Exporta **WebP calidad 0.82**; si el navegador no soporta WebP, JPEG 0.82.
3. Rechaza tipos que no sean imagen y archivos de más de 5 MB ya comprimidos.

Resultado típico: una foto de 4–8 MB baja a **120–350 KB** (≈ 90 % menos).

**Lo que no hace:** transformaciones en servidor. El plan gratuito de Supabase
no incluye *Image Transformations* (solo Pro). Por eso no hay `.webp?width=400`
dinámico: el tamaño se decide al subir. Para el tamaño de Tuki es suficiente.

## 3. Límites del plan gratuito

| Recurso | Incluido | Traducción práctica |
| --- | --- | --- |
| Storage | **1 GB** | ~3.000–8.000 fotos de 130–350 KB |
| Egress | **5 GB/mes** | ~15.000–40.000 visitas a una foto de 200 KB |
| Tamaño máx. por archivo | 50 MB | El bucket corta en 5–8 MB |
| Transformaciones | No disponibles | Se comprime en el navegador |
| Proyectos | 2 | Uno para Tuki |

Cálculo para la entrega: 61 platillos + 13 restaurantes ≈ 25 MB. Cabe unas 40
veces en el plan gratuito. El egress es el límite real: si la app se difunde,
5 GB/mes se agotan antes que el disco. Mitigación: `Cache-Control: 31536000`
(las URLs llevan UUID y son inmutables) y el proxy de Cloudflare delante.

## 4. Puesta en marcha (una vez)

```bash
# 1. Crear buckets y políticas (SQL Editor del dashboard o CLI)
#    db/migraciones/2026-10-29-storage-imagenes.sql

# 2. Migrar las 23 imágenes que siguen en Cloudinary
node scripts/migrar-imagenes-supabase.mjs --dry-run   # revisar el plan
node scripts/migrar-imagenes-supabase.mjs             # migrar de verdad
```

`SUPABASE_SERVICE_ROLE_KEY` solo se usa durante la migración; se toma del
entorno o de `.env.local` y **se borra al terminar**. La aplicación nunca la
necesita: sube con la clave anónima y las políticas RLS.

## 5. Verificación

```sql
-- No debe quedar ninguna URL de Cloudinary
select count(*) from platillos where imagen_url like '%cloudinary%';
select count(*) from restaurantes
 where imagen_banner_url like '%cloudinary%' or imagen_logo_url like '%cloudinary%';
```

En la web: subir una foto desde el panel y comprobar que la URL resultante
empieza por `https://<proyecto>.supabase.co/storage/v1/object/public/`.

## 6. Si el almacenamiento se queda corto

1. Purga fotos de reseñas con más de 12 meses (no aportan al menú).
2. Genera una miniatura de 480 px en el navegador y guárdala junto al original
   (`<uuid>-min.webp`) para las tarjetas del buscador.
3. Solo entonces plantéate Pro (100 GB y transformaciones) o R2.
