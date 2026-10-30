# ADR 0007 — Monolito modular con microservicios progresivos

- **Estado:** aceptado
- **Fecha:** 2026-10-28
- **Relacionado:** ADR 0001 (AI Gateway), ADR 0003 (servicios gestionados), ADR 0005 (hexagonal)

## Contexto

Tuki tiene hoy tres piezas desplegables y una base de datos:

| Pieza | Tamaño | Estado |
| --- | --- | --- |
| SPA React | 117 archivos, el mayor de 48 KB | Organizada por capa técnica (`componentes`, `api`, `lib`) |
| AI Gateway (FastAPI) | 18 archivos, `main.py` de 396 líneas | Ya hexagonal (dominio, puertos, servicios, adaptadores) |
| Supabase | Postgres + Auth + RLS | Servicio gestionado; única fuente de datos |

El gateway ya cumple ADR 0005. La SPA no: sus reglas de negocio están
repartidas entre `src/lib`, `src/api` y componentes, y `src/api/misApis.ts`
mezclaba horarios, QR, enlaces de WhatsApp y saludos en un solo archivo. No hay
fronteras explícitas, así que nada impide que dos funcionalidades se acoplen.

La pregunta de fondo es si conviene saltar a microservicios. No hay motivo
medible: un solo equipo pequeño, un solo dominio transaccional, un despliegue
conjunto y 117 archivos. Partir ahora en servicios produciría un monolito
distribuido con más latencia, más operación y transacciones entre servicios.

## Decisión

Adoptar un **monolito modular** con **arquitectura hexagonal por módulo** y
dejar los microservicios como **evolución opcional y progresiva**, no como punto
de partida.

1. **Módulos por capacidad de negocio**, no por tipo de archivo:
   `pedidos`, `menu`, `resenas`, `cuenta`, `descubrir`, `restaurante`,
   `diseno`, `difusion`, `ia`, `panel`; `compartido` para el sistema de diseño,
   el cliente de Supabase y utilidades sin dominio.
2. **Cuatro capas dentro de cada módulo** cuando el tamaño lo justifique:
   - `dominio/` — reglas puras, sin React, Supabase ni navegador.
   - `aplicacion/` — casos de uso y estado de interfaz (hooks, stores).
   - `infraestructura/` — adaptadores: Supabase, HTTP, `localStorage`.
   - `componentes/` — interfaz del módulo.
3. **API pública por módulo** (`index.ts`). Nadie importa capas internas de
   otro módulo; si un dato se comparte, se expone en el `index.ts` o se mueve a
   `compartido`.
4. **Un solo despliegue** para la SPA y otro para el gateway. La extracción a
   servicio solo ocurre cuando se cumple un criterio de la sección siguiente.
5. **Reglas verificables**: `pnpm arquitectura` revisa la dirección de
   dependencias en TypeScript y Python y falla si alguien la rompe.

### Clean Architecture y hexagonal: lo mismo con distinto énfasis

No se montan dos arquitecturas en paralelo. La correspondencia es directa:

| Clean Architecture | Hexagonal | En Tuki |
| --- | --- | --- |
| Entidades | Dominio | `*/dominio` |
| Casos de uso | Aplicación | `*/aplicacion`, `servicios/` |
| Puertos | Puertos | `puertos/` (Protocols) |
| Adaptadores de interfaz | Adaptadores de entrada | routers FastAPI, componentes |
| Adaptadores de infraestructura | Adaptadores de salida | `adaptadores/`, `infraestructura/` |

La regla que importa es una: **las dependencias apuntan hacia el dominio**. Las
cuatro carpetas de Clean solo se abren cuando hay código que justifique cada
una; un componente de presentación no necesita su propia entidad.

## Criterios para extraer un microservicio

Un módulo se convierte en servicio solo si cumple al menos uno:

1. **Escalado distinto**: su carga no se parece a la del resto (p. ej. búsqueda
   o generación con IA).
2. **Equipo distinto**: otra persona o célula lo posee y despliega.
3. **Datos propios**: necesita un almacén con ciclo de vida independiente.
4. **Frontera de cumplimiento**: aislamiento exigido por seguridad o auditoría.
5. **Cadencia de despliegue**: cambia mucho más que el resto y frena entregas.

Mientras no se cumpla ninguno, el módulo vive en el mismo despliegue. La
extracción se prepara dejando **contratos estables** (DTOs y errores de
dominio), **sin fugas de ORM** hacia la interfaz y, si hay efectos asíncronos,
un **outbox** en la base antes de hablar de colas.

## Consecuencias

**Positivas**

- Se puede avanzar por partes: un módulo migrado no bloquea a los demás.
- El dominio se prueba sin navegador ni red (`tests/frontend/pedidos.test.ts`).
- Cambiar Supabase por otro proveedor o `localStorage` por IndexedDB es un
  adaptador, no una reescritura.
- Extraer un servicio más adelante cuesta un módulo, no una arqueología.

**Negativas**

- Más archivos y una indirección por módulo; para un módulo de una función
  puede ser excesivo (por eso las capas son opcionales).
- Hay que migrar código existente sin romper imports: se hace por rodajas
  verticales, no con una reescritura global.
- `pnpm arquitectura` añade un paso a la puerta; a cambio evita que la frontera
  se erosione.

## Alternativas descartadas

- **Microservicios ahora:** sin equipo, carga ni datos independientes; el coste
  operativo (trazas, contratos, reintentos, consistencia) supera el beneficio.
- **Mantener capas técnicas:** es lo que ya había; no impide el acoplamiento y
  no deja claro qué cambia junto.
- **Microfrontends:** 117 archivos y un solo equipo no justifican varios
  despliegues de interfaz.
- **Serverless/Edge Functions para todo:** válido para picos, pero ata la
  lógica al proveedor y complica el despliegue reproducible en Kubernetes que
  exige el diplomado.

## Evolución

1. **Fase 0 (hecha):** ADR, mapa de módulos, guardián de dependencias y rodaja
   piloto `pedidos` (dominio, aplicación, infraestructura y API pública).
2. **Fase 1 (hecha):** reglas de `src/lib` y clientes de `src/api` movidos a
   `modulos/resenas`, `modulos/cuenta` y `modulos/menu`.
3. **Fase 1b:** repartir `src/api/misApis.ts` (horarios, QR, WhatsApp y saludo) y
   `apiDescubrir.ts` entre `restaurante`, `difusion`, `pedidos` y `descubrir`.
4. **Fase 2:** separar `componentes` por módulo y dejar `compartido` solo con
   sistema de diseño y utilidades transversales.
5. **Fase 3 (hecha):** `main.py` del gateway reducido a punto de entrada; rutas
   en `app/entrada`, composición en `app/composicion.py`, contrato intacto.
6. **Fase 4:** evaluar la extracción de `ia` (ya es un servicio) y, si hay
   volumen, de `descubrir` (lectura) o `pedidos` (escritura asíncrona).

El detalle de módulos, reglas y fases está en
[`docs/arquitectura/mapa-modulos.md`](../arquitectura/mapa-modulos.md).
