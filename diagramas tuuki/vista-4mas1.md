# Modelo 4+1 · TukiTuki

| Campo | Valor |
| --- | --- |
| Versión | 3.1 |
| Fecha | 2026-11-23 |
| Archivo editable | [`vista-4mas1.drawio`](vista-4mas1.drawio) |
| Páginas | 6: mapa + cinco vistas |
| Fuentes | [`diagramas-c4.md`](diagramas-c4.md), [`diagrama-entidad-relacion.md`](diagrama-entidad-relacion.md), [`vista-despliegue.md`](vista-despliegue.md), [`../docs/arquitectura.md`](../docs/arquitectura.md) |
| Relacionado | [`../README.md`](../README.md), [`../docs/convenciones.md`](../docs/convenciones.md) |

## 1. Cómo leerlo

El archivo abre con un **Mapa 4+1** que sirve de índice y después dedica una
página a cada vista. Cada página cuenta **un solo recorrido**, de izquierda a
derecha o de arriba abajo, con estos colores:

| Color | Significado |
| --- | --- |
| Azul | Cliente y frontends |
| Índigo | Borde: Ingress y API Gateway |
| Verde | Servicios Node/Fastify |
| Morado | Servicios Python: AI Gateway y visión |
| Ámbar | Datos: PostgreSQL, RustFS, Redis |
| Rosa | Escenarios y validación |

| Página | Pregunta que responde |
| --- | --- |
| **Mapa 4+1** | ¿Cómo encajan las cuatro vistas y qué las valida? |
| **Vista lógica** | ¿Qué existe y cómo se conecta? |
| **Vista de procesos** | ¿Qué ocurre en un pedido, paso a paso? |
| **Vista de desarrollo** | ¿Cómo se organiza y se entrega el código? |
| **Vista física** | ¿Dónde corre cada pieza? |
| **Vista de escenarios** | ¿Qué casos validan las cuatro vistas? |

## 2. Mapa 4+1

Una página de navegación, no una vista adicional:

- **Cuatro paneles** con la vista lógica arriba a la izquierda, la de desarrollo
  arriba a la derecha, la de procesos abajo a la izquierda y la física abajo a
  la derecha.
- **Un panel central de escenarios** con los cinco casos de uso.
- **Cuatro flechas** desde los escenarios hacia cada vista, etiquetadas
  `valida`: los escenarios son el hilo que compromete a las otras páginas.

Cada panel resume su vista en cuatro tarjetas, de modo que el mapa se lee en
menos de un minuto sin repetir el detalle de las páginas interiores.

## 3. Vista lógica

Un recorrido de cinco capas, sin flechas cruzadas:

1. **Actores:** comensal, dueño y superadmin.
2. **Frontends:** `web-comensal`, `panel-restaurante` y `admin-plataforma`.
3. **Borde:** Ingress Nginx en Kubernetes y API Gateway Nginx en local; JWT
   HS256 y mismo origen.
4. **Servicios:** seis Node/Fastify (`identidad` :3001, `restaurantes` :3002,
   `media` :3003, `pedidos` :3004, `reseñas` :3005, `admin` :3006) y dos Python
   (`ai-gateway` :8000, `visión` :8000 en el clúster).
5. **Datos y modelos:** PostgreSQL 16 con seis bases, RustFS, Redis y Ollama.

La regla que resume la vista: **cada servicio es dueño de su base y nadie lee
tablas ajenas**. Las referencias entre servicios se validan en la aplicación; el
detalle está en [`diagrama-entidad-relacion.md`](diagrama-entidad-relacion.md).

## 4. Vista de procesos

La página muestra **un pedido completo** como flujo principal de siete pasos:

| Paso | Capa | Acción |
| --- | --- | --- |
| 1 | Cliente | Elegir platos en `web-comensal` |
| 2 | Borde | `GET /v1/restaurantes` |
| 3 | Servicio | `restaurantes-service` devuelve menú y precios |
| 4 | Cliente | Confirmar el pedido |
| 5 | Borde | `POST /v1/pedidos` |
| 6 | Servicio | `pedidos-service` calcula totales y guarda |
| 7 | Cliente | Abrir `wa.me` con el resumen |

WhatsApp no recibe una llamada del backend: es un enlace que abre el navegador.
Los pasos 3 y 6 escriben en `tuki_restaurantes` y `tuki_pedidos`.

Debajo quedan dos rutas secundarias, cada una en una cadena lineal:

- **RAG:** Chat → `ai-gateway` → índice híbrido + Ollama → respuesta con fuentes.
  El índice se refresca cada 300 s; si falla, se conserva la última copia.
- **Imagen:** archivo → `media-service` → `vision-service` → RustFS + metadatos.
  Si visión no responde, media guarda la imagen y registra la omisión
  (*fail-open*).

Los servicios Node no guardan estado y escalan con HPA; `ai-gateway` y
`vision-service` usan una réplica.

## 5. Vista de desarrollo

Tres columnas y una cadena de entrega:

- **Repositorio:** `apps/`, `services/`, `packages/`, `db/`, `e2e/`, `infra/` y
  `docs/` en un workspace pnpm.
- **Reglas:** dominio puro, arquitectura hexagonal, sin tablas ajenas, un solo
  cliente HTTP (`@tuki/api-cliente`) y configuración en `/config.js`.
- **Calidad:** typecheck/test/build, Playwright, ruff + pytest, Kustomize,
  CodeQL/gitleaks y pruebas de humo con k6.
- **Entrega:** commit/PR → GitHub Actions → GHCR (11 imágenes) → Argo CD →
  Kubernetes. Argo CD ignora `/spec/replicas` para no pelear con el HPA.

## 6. Vista física

Un solo nodo Kubernetes, dibujado de fuera hacia dentro:

- **Clúster Kubernetes:** borde discontinuo que contiene el Ingress y el
  namespace `tukituki`.
- **Ingress nginx:** TLS y rutas `/v1/*`; reparte el tráfico entre los tres
  frontends.
- **Frontends:** `web-comensal` (2 réplicas, API), `panel-restaurante` (2, API)
  y `admin-plataforma` (2).
- **Servicios:** `identidad` 2, `restaurantes` 2, `media` 1, `pedidos` 2,
  `reseñas` 2 y `admin` 2.
- **IA y operación:** `ai-gateway` con 1 réplica y RAG local; HPA + PDB con 3 y
  10 objetos; NetworkPolicy (5) y ConfigMap `config.js`.
- **Datos:** PostgreSQL 16 (StatefulSet), RustFS (StatefulSet) y Redis 7
  (Deployment).
- **Fuera del clúster:** navegador, Argo CD (ApplicationSet `tukituki`), Ollama
  (HTTP local) y GHCR (10 imágenes firmadas, `pull`).

Las tres relaciones que cruzan el borde son: el navegador entra por HTTPS, Argo
CD aplica el estado desde Git y GHCR entrega las imágenes. Ollama se consulta
por HTTP local y las bases se escriben por SQL.

En local, Docker Compose replica el mismo stack detrás de Traefik y del API
Gateway; Mailpit y Traefik no se despliegan en Kubernetes.

## 7. Vista de escenarios

Cinco casos de uso, agrupados por actor:

| Caso | Actor | Recorrido | Vistas |
| --- | --- | --- | --- |
| **CU-01** Descubrir restaurantes y platos | Comensal | `web-comensal` → `restaurantes-service` | lógica, procesos, física |
| **CU-02** Armar pedido y abrir WhatsApp | Comensal | `web-comensal` → `pedidos-service` → `wa.me` | lógica, procesos, física |
| **CU-03** Conversar con el recomendador RAG | Comensal | `web-comensal` → `ai-gateway` → Ollama | lógica, procesos, física |
| **CU-04** Administrar menú, tema y difusión | Dueño | `panel-restaurante` → `restaurantes` + `media` | lógica, procesos, desarrollo, física |
| **CU-05** Operar y moderar la plataforma | Superadmin | `admin-plataforma` + CI/CD → Kubernetes | lógica, desarrollo, física |

La matriz de la página marca con ✓ las vistas que el caso compromete. Si un
escenario cambia, alguna de las otras páginas debe cambiar también.

## 8. Cambios de la versión 3.1

- Se recupera el **Mapa 4+1** como primera página e índice del conjunto.
- La **vista física** se redibuja siguiendo el esquema de despliegue acordado:
  clúster y namespace explícitos, Ingress arriba, frontends, servicios, IA,
  datos y las cuatro dependencias externas.
- El mapa y la vista de escenarios comparten los **cinco casos de uso**
  vigentes; ya no se referencian seis escenarios.
