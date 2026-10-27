# ADR 0006 — Gateway de IA en Python dentro de un proyecto TypeScript

- **Estado:** aceptado
- **Fecha:** 2026-10-27

## Contexto

La aplicación es una SPA en TypeScript. Necesita generar texto con un proveedor
de IA (Groq) sin exponer la clave en el navegador, validar la sesión de
Supabase, aplicar cuotas y no caer si el proveedor falla.

Opciones evaluadas:

1. Llamar a Groq desde el navegador con la clave en el bundle.
2. Una función serverless en TypeScript.
3. Un servicio Node/TypeScript propio (Fastify u Hono).
4. Un servicio Python/FastAPI propio.

La opción 1 se descartó: cualquier usuario podría extraer la clave del bundle.

## Decisión

Un **servicio independiente en Python/FastAPI** (`services/ai-gateway`) que
actúa como frontera de confianza entre la SPA y Groq.

## Motivos

- **Seguridad:** la clave vive solo en el servidor; el bundle se verifica en CI
  para que no aparezca `gsk_` ni `VITE_GROQ_API_KEY`.
- **Identidad y cuotas:** valida el JWT de Supabase (JWKS), distingue usuario de
  anónimo y aplica token bucket por identidad.
- **Resiliencia:** timeouts, reintentos con backoff y fallback entre modelos son
  más claros en un servicio con estado propio que en una función efímera.
- **Operación:** `/healthz`, `/readyz` y `/metrics` permiten sondas, HPA y
  tableros; el servicio escala aparte de la SPA.
- **Aislamiento de fallos:** si Groq o el gateway fallan, la SPA sigue sirviendo
  menús y el carrito.

## Consecuencias

**Positivas**

- Una sola frontera para secretos, cuotas y proveedor de IA.
- El servicio se prueba sin navegador (41 pruebas) y se despliega por separado.
- Cambiar de proveedor afecta solo a `app/adaptadores/` (ver ADR 0005).

**Negativas**

- Dos cadenas de herramientas: `pnpm` para la SPA y `pip`/`uv` para el gateway.
- Dos jobs de CI y dos imágenes que mantener.
- Un lenguaje más para el equipo.

Mitigaciones: contratos HTTP versionados (`/api/v1`), Docker para reproducir el
entorno, CI separada por servicio y documentación en `docs/estructura.md`.

## Alternativa si el equipo estandariza en TypeScript

Migrar el gateway a Node con Fastify u Hono es viable: son ~1.400 líneas y 41
pruebas. Implicaría reescribir auth (jose), cuotas, cliente HTTP y métricas, y
mantener el mismo contrato. **No se hace ahora** porque el costo supera el
beneficio y el riesgo de romper la entrega; queda como evolución si el equipo
crece o si se exige un único runtime.

## Referencias

- `docs/estructura.md` — mapa del repositorio.
- `docs/adr/0005-arquitectura-hexagonal.md` — organización interna del gateway.
- `docs/security/modelo-de-amenazas.md` — activos y fronteras de confianza.
