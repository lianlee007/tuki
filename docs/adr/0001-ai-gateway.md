# ADR 0001 — AI Gateway propio en FastAPI

- **Estado:** aceptado
- **Fecha:** 2026-10-25
- **Contexto:** Fase 1 del trabajo CloudForge AI

## Contexto

La SPA llamaba a Groq directamente desde el navegador con
`VITE_GROQ_API_KEY`. Esa variable se incrusta en el bundle: cualquier visitante
puede extraer la clave, consumir el presupuesto y no hay forma de limitar el
abuso ni de auditar el uso.

Las alternativas eran:

1. Una Edge Function de Supabase.
2. Un proxy genérico (Nginx/Envoy) que reenvíe a Groq.
3. Un servicio propio con lógica de negocio.

## Decisión

Construir un **AI Gateway** en FastAPI dentro de `services/ai-gateway`, con:

- Validación de JWT de Supabase contra JWKS.
- Cuota anónima por IP y cuota mayor para usuarios autenticados.
- Reintentos con backoff, timeout total y fallback entre modelos de Groq.
- Logs JSON con `request_id`, métricas Prometheus y trazas OTel opcionales.
- Contrato estable `POST /api/v1/ai/chat`, consumido por la SPA en el mismo
  origen (`/api`).

La SPA sigue funcionando sin sesión: el carrito público usa la cuota anónima.
Un token inválido devuelve `401`; nunca se degrada silenciosamente a anónimo
para evitar que un error de autenticación se convierta en bypass de cuota.

## Consecuencias

**Positivas**

- La clave de Groq solo existe en el runtime del servidor (secreto de K8s).
- Se puede limitar, medir y cortar el consumo sin tocar el frontend.
- El fallback entre modelos mejora la disponibilidad percibida.
- El contrato permite cambiar de proveedor sin recompilar la SPA.

**Negativas**

- Un servicio más que desplegar, observar y proteger.
- El rate limit en memoria no es global entre réplicas (ver ADR 0004).
- La latencia añade un salto de red interno (bajo, mismo clúster).

## Alternativas descartadas

- **Edge Function de Supabase:** válida, pero acopla la lógica al proveedor y
  complica el despliegue reproducible en Kubernetes que pide el trabajo.
- **Proxy Nginx puro:** no puede validar JWT, aplicar cuotas por identidad ni
  hacer fallback entre modelos.
