# ADR 0005 — Arquitectura hexagonal en el AI Gateway

- **Estado:** aceptado
- **Fecha:** 2026-10-27

## Contexto

El gateway nació como un conjunto plano de módulos (`main`, `auth`, `groq`,
`rate_limit`, `schemas`, `observability`, `config`). Funcionaba, pero:

- `main.py` importaba directamente las implementaciones: cambiar de proveedor
  de IA o de limitador obligaba a editarlo.
- Las pruebas parcheaban funciones internas del módulo de autenticación.
- No había una frontera explícita entre reglas del caso de uso e infraestructura.

Para la entrega final se necesita una estructura que **resista el crecimiento**
sin convertirse en microservicios prematuros.

## Decisión

Aplicar **arquitectura hexagonal (puertos y adaptadores)** dentro de un
**monolito modular**, solo en el gateway:

```text
app/
├── dominio/          modelos y errores sin dependencias
│   ├── modelos.py    Identity, RateDecision, RateRule, ResultadoIA
│   └── errores.py    ErrorIA, PromptDemasiadoLargo
├── puertos/          Protocols: ProveedorIA, Limitador, VerificadorIdentidad
├── servicios/        caso de uso: ServicioChat
├── adaptadores/      Groq, Supabase JWKS, rate limit en memoria
├── main.py           composición (wiring) y capa HTTP
└── auth.py, groq.py, rate_limit.py   shims de compatibilidad
```

Regla de dependencia: **dominio ← servicios ← puertos**; los adaptadores
dependen del dominio y de los puertos, nunca al revés. `main.py` es el único
lugar que conoce las implementaciones concretas.

Los módulos antiguos se conservan como *shims* que reexportan desde
`app.adaptadores`, de modo que `app.main:app` y las importaciones existentes
siguen funcionando.

## Consecuencias

**Positivas**

- El caso de uso se prueba con un proveedor falso, sin HTTP ni Groq
  (`tests/test_servicio_chat.py`).
- Cambiar Groq por otro proveedor o el limitador por Redis es añadir un
  adaptador, no editar `main.py`.
- La frontera queda visible para la sustentación y para el equipo.

**Negativas**

- Más archivos y una indirección extra para un servicio pequeño.
- Los adaptadores siguen conociendo HTTP (FastAPI) donde hace falta; no se
  busca pureza académica, sino dirección de dependencias.

## Evolución

1. `AdaptadorRedis` que implemente `Limitador` (ADR 0004).
2. `AdaptadorProveedorAlterno` para fallback entre proveedores de IA.
3. Si el gateway crece, separar `servicios/chat`, `servicios/auth` y
   `servicios/cuotas` en módulos con su propio `dominio/` y `adaptadores/`.
4. Extraerlo a servicio independiente solo cuando haya un motivo medible:
   escalado distinto, equipo distinto o despliegue distinto.

Hexagonal **no** significa microservicios: es una forma de ordenar dependencias
dentro del despliegue actual.
