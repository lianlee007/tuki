# ADR 0004 — Rate limit en memoria y evolución a Redis

- **Estado:** aceptado
- **Fecha:** 2026-10-25

## Contexto

El gateway necesita limitar el consumo de Groq sin añadir infraestructura en la
primera fase. Las opciones eran:

1. Token bucket en memoria por réplica.
2. Redis compartido.
3. Rate limiting en el Ingress (por IP, sin identidad).

## Decisión

Implementar un **token bucket en memoria** por réplica, con dos reglas
(`anon` y `user`) y limpieza de cubos inactivos.

## Consecuencias

**Positivas**

- Cero dependencias y cero latencia adicional.
- Suficiente para el tráfico actual y para demostrar la política de cuotas.
- La interfaz `RateLimiter.check(kind, key)` permite sustituirlo por Redis sin
  tocar los endpoints.

**Negativas**

- La cuota efectiva es `cuota × número de réplicas`. Con 2 pods, un usuario
  puede hacer el doble de peticiones en el mismo minuto.
- Un pod nuevo arranca con cubos vacíos; no hay cuota global.
- No sirve para facturación exacta por usuario.

## Evolución

Si el tráfico o el presupuesto lo exigen:

1. Desplegar Redis con persistencia y alta disponibilidad.
2. Implementar un `RedisRateLimiter` con script Lua atómico.
3. Mantener la misma interfaz y las mismas métricas.
4. Añadir una alerta de divergencia entre réplicas.

Mientras tanto, el Ingress y `NetworkPolicy` limitan el abuso grueso, y el panel
`Riki · SPA y AI Gateway` muestra `ai_gateway_rate_limited_total` para detectar
cuotas mal dimensionadas.
