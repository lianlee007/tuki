# ADR 0003 — Supabase, Supabase Storage y Groq fuera del clúster

- **Estado:** aceptado (parcialmente superado por el [ADR 0008](0008-imagenes-en-supabase-storage.md))
- **Fecha:** 2026-10-25

## Contexto

El trabajo pide justificar qué servicios se containerizan y cuáles no. Tuki usa
tres servicios externos:

- **Supabase:** Postgres, Auth, RLS y almacenamiento.
- **Supabase Storage:** subida y servicio de imágenes (sustituye a Cloudinary,
  ver ADR 0008).
- **Groq Cloud:** inferencia de modelos de lenguaje.

## Decisión

No containerizarlos. El clúster solo ejecuta la SPA (`frontend`) y el AI Gateway
(`backend`).

## Motivos

### Supabase

- Ya es un servicio gestionado con backups, réplicas, actualizaciones y RLS.
- Autohospedarlo obliga a operar Postgres, GoTrue, Storage, Kong, Realtime y sus
  migraciones; es un proyecto completo, no un contenedor.
- La SPA sigue hablando directo con Supabase; el gateway solo valida el JWT con
  el JWKS público.

### Supabase Storage

- El valor está en la CDN, la cuota y el almacenamiento, no en el proceso.
- Comparte proyecto, credenciales y RLS con la base de datos: un proveedor menos.
- La subida la hace el navegador tras comprimir la imagen; no hay servidor que
  containerizar.
- **Nota:** desde el ADR 0008 Cloudinary ya no se usa. Esta sección se conserva
  como registro de la decisión original.

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
