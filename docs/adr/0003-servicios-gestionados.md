# ADR 0003 — Supabase, Cloudinary y Groq fuera del clúster

- **Estado:** aceptado
- **Fecha:** 2026-10-25

## Contexto

El trabajo pide justificar qué servicios se containerizan y cuáles no. Riki usa
tres servicios externos:

- **Supabase:** Postgres, Auth, RLS y almacenamiento.
- **Cloudinary:** subida, transformación y CDN de imágenes.
- **Groq Cloud:** inferencia de modelos de lenguaje.

## Decisión

No containerizarlos. El clúster solo ejecuta la SPA (`web`) y el AI Gateway.

## Motivos

### Supabase

- Ya es un servicio gestionado con backups, réplicas, actualizaciones y RLS.
- Autohospedarlo obliga a operar Postgres, GoTrue, Storage, Kong, Realtime y sus
  migraciones; es un proyecto completo, no un contenedor.
- La SPA sigue hablando directo con Supabase; el gateway solo valida el JWT con
  el JWKS público.

### Cloudinary

- El valor está en la CDN, las transformaciones y el almacenamiento, no en el
  proceso.
- La subida es *unsigned* desde el navegador; moverla al backend requeriría
  firmar peticiones y cambiar la SPA, algo fuera del alcance autorizado.
- Containerizar un CDN no aporta disponibilidad ni seguridad.

### Groq

- Es una API de inferencia con hardware especializado; no se puede replicar en
  el clúster.
- El gateway es precisamente la frontera que protege la clave y aplica cuotas.

## Consecuencias

- El clúster no necesita PVCs ni operadores de bases de datos.
- La disponibilidad del producto depende de terceros; se mitiga con reintentos,
  fallback de modelos, timeouts y alertas.
- El egreso del gateway se limita a 443 (Groq y JWKS) y DNS mediante
  `NetworkPolicy`.
- Si en el futuro se exige soberanía de datos, se puede evaluar Supabase
  autohospedado como proyecto separado, sin cambiar el contrato del gateway.
