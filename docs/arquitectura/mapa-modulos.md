# Mapa de módulos

Referencia operativa del [ADR 0007](../adr/0007-monolito-modular.md). Responde
tres preguntas: dónde vive cada cosa, qué puede importar cada capa y cuándo un
módulo se convierte en servicio.

## 1. Estado actual

| Zona | Qué contiene hoy | Deuda |
| --- | --- | --- |
| `src/modulos/pedidos/` | Dominio del pedido y del carrito, repositorio Supabase, store de Zustand y `index.ts` | Ninguna; es el patrón a seguir |
| `src/modulos/resenas/` | Dominio de resumen, repositorio Supabase, hook y `index.ts` | Mover sus componentes en la fase 2 |
| `src/modulos/cuenta/` | Reglas de datos de envío, repositorio de `users`, hook y `index.ts` | Mover sus componentes en la fase 2 |
| `src/modulos/menu/` | Estado del platillo, repositorios de platillos/restaurante/temas, hook del panel y `index.ts` | Mover sus componentes en la fase 2 |
| `src/lib/` | Utilidades transversales (color, imágenes, slugs, Supabase, gateway) | Ninguna: ya no guarda reglas de negocio de un módulo |
| `src/api/` | `misApis.ts` (horarios, QR, WhatsApp, saludo) y `apiDescubrir.ts` | Repartir por módulo en la fase 1b |
| `src/componentes/` | Interfaz agrupada por pantalla | Debe pasar a `modulos/<m>/componentes` |
| `src/hooks/` | `useHaptics` (utilidad transversal) | Moverlo a `compartido` en la fase 2 |
| `services/ai-gateway/app/` | Dominio, puertos, servicios, adaptadores y `app/entrada` (rutas, dependencias, middleware y errores) | Adaptador Redis para réplicas |

## 2. Módulos objetivo

| Módulo | Responsabilidad | Datos que posee |
| --- | --- | --- |
| `pedidos` | Carrito, enlace de WhatsApp, estados e historial | `pedidos`, carrito local |
| `menu` | Platillos, categorías, etiquetas y editor | `platillos`, `categorias` |
| `resenas` | Reseñas públicas y respuestas del restaurante | `resenas` |
| `cuenta` | Autenticación, perfil y datos de envío | `perfiles`, `datos_envio` |
| `descubrir` | Búsqueda y filtros para comensales | Lectura de `restaurantes`, `platillos` |
| `restaurante` | Sitio público, horarios, QR y saludo | `restaurantes`, `temas` |
| `diseno` | Paletas, tipografías y previsualización | `temas` |
| `difusion` | QR, enlaces y piezas para compartir | Derivado, sin tabla propia |
| `ia` | Asistente y contrato con el gateway | Ninguno; llama a `/api/v1/ai/chat` |
| `panel` | Composición del panel del dueño | Ninguno |
| `compartido` | Sistema de diseño, cliente Supabase, tipos y utilidades | Ninguno |

Un módulo puede leer datos de otro **a través de su API pública**, no con una
consulta directa a su tabla. Si dos módulos necesitan el mismo dato con
frecuencia, se expone como consulta de lectura en el dueño del dato.

## 3. Estructura de un módulo

```text
src/modulos/pedidos/
├── dominio/            Reglas puras (pedido.ts, carrito.ts)
├── aplicacion/         Casos de uso y estado (storeCarrito.ts)
├── infraestructura/    Adaptadores (apiPedidos.ts, almacenamientoCarrito.ts)
├── componentes/        Interfaz del módulo (cuando exista)
└── index.ts            API pública: lo único que importan otros módulos
```

Las cuatro capas son opcionales. Un módulo pequeño puede quedarse en
`dominio` + `index.ts`; lo que no se permite es saltarse la dirección de
dependencias.

### Regla de dependencia

```text
componentes → aplicacion → dominio
      ↓            ↓
 infraestructura ←┘        (implementa lo que el dominio/aplicación necesitan)
```

- `dominio` no importa React, Zustand, Supabase, `localStorage` ni ninguna capa
  hermana.
- `aplicacion` puede usar `dominio` e `infraestructura`.
- `infraestructura` traduce tecnologías al modelo del dominio.
- `componentes` consume `aplicacion` y `dominio`; nunca consulta Supabase.

## 4. Reglas verificadas

`pnpm arquitectura` (script `scripts/verificar-arquitectura.mjs`) comprueba:

1. `src/modulos/*/dominio/**` sin paquetes de interfaz ni estado.
2. Un módulo no importa `dominio`, `aplicacion`, `infraestructura` ni
   `componentes` de otro; solo su `index.ts`.
3. `src/lib/**` y `src/api/**` no importan componentes, páginas, contexto ni
   hooks.
4. En el gateway: `dominio` no importa servicios/puertos/adaptadores; `puertos`
   no importa servicios/adaptadores; `servicios` no importa adaptadores ni
   FastAPI/httpx; `adaptadores` no importa `main`.

El paso corre dentro de `pnpm verificar`. Si una regla estorba de verdad, se
cambia el ADR y el script a la vez; no se salta con un `// eslint-disable`.

## 5. Rodaja piloto: `pedidos`

Qué se movió y por qué sirve de plantilla:

| Antes | Ahora | Motivo |
| --- | --- | --- |
| `src/lib/pedidos.ts` | `modulos/pedidos/dominio/pedido.ts` | Reglas puras del pedido |
| Lógica dentro de `storeCarrito.ts` | `modulos/pedidos/dominio/carrito.ts` | Agregar, sumar y validar sin React |
| `src/store/storeCarrito.ts` | `modulos/pedidos/aplicacion/storeCarrito.ts` | Estado de interfaz sobre el dominio |
| `src/api/apiPedidos.ts` | `modulos/pedidos/infraestructura/apiPedidos.ts` | Supabase como detalle |
| `localStorage` dentro del store | `modulos/pedidos/infraestructura/almacenamientoCarrito.ts` | Persistencia intercambiable |
| Imports dispersos | `modulos/pedidos/index.ts` | Una sola frontera |

La prueba `tests/frontend/pedidos.test.ts` importa solo el dominio, así que
demuestra que las reglas no dependen de la interfaz.

## 6. Fases de migración

**Fase 1 — dominios e infraestructura** (hecha, sin tocar pantallas)

- [x] `resenas`: dominio, repositorio Supabase, hook y `index.ts`.
- [x] `cuenta`: reglas de datos de envío, repositorio de `users`, hook y `index.ts`.
- [x] `menu`: repositorios de platillos/restaurante, estado del platillo, hook del
      panel y `index.ts`.

**Fase 1b — reparto de `misApis.ts`**

- [ ] `horarios` y `saludo` → `modulos/restaurante`.
- [ ] `QR` → `modulos/difusion`.
- [ ] Enlaces de WhatsApp → `modulos/pedidos`.
- [ ] `apiDescubrir.ts` → `modulos/descubrir`.

**Fase 2 — interfaz por módulo**

- [ ] Mover `componentes/panel/Seccion*` a su módulo cuando la sección tenga
      dominio propio (`menu`, `resenas`, `diseno`, `pedidos`).
- [ ] Dejar `compartido/sistema-diseno` con lo que usa más de un módulo.
- [ ] `panel` se queda como composición: barra lateral, rutas y layout.

**Fase 3 — gateway** (hecha)

- [x] `main.py` → `app/entrada/{rutas,dependencias,middleware,errores}.py` y
      `app/composicion.py` (wiring). El contrato `POST /api/v1/ai/chat` no cambia.
- [ ] Añadir un adaptador Redis para `Limitador` (ADR 0004) cuando haya réplicas.

**Fase 4 — microservicios, solo si aplica**

Orden candidato y disparador:

| Candidato | Disparador |
| --- | --- |
| `ia` | Ya es servicio; escalar por separado si el consumo crece |
| `descubrir` | Búsqueda con índice propio o carga de lectura muy distinta |
| `pedidos` | Notificaciones asíncronas, integraciones o equipo propio |
| `resenas` | Moderación con revisión humana o cumplimiento aparte |

Antes de extraer: contrato versionado, errores de dominio estables, sin acceso
cruzado a tablas y un `outbox` si hay eventos. Si no se cumple un criterio del
ADR, no se extrae.

## 7. Cómo trabajar con esto

```bash
pnpm arquitectura     # reglas de dependencia
pnpm typecheck        # tipos
pnpm test             # 87 pruebas
pnpm contexto         # coste real de la sesión
```

Al añadir una funcionalidad:

1. Elegir el módulo dueño del dato; si no existe, crearlo.
2. Escribir primero la regla en `dominio` y su prueba.
3. Añadir el adaptador en `infraestructura` (Supabase, HTTP, almacenamiento).
4. Exponer lo necesario en `index.ts`; no importar rutas internas.
5. Pasar `pnpm arquitectura` antes de abrir el PR.
