# Vista de despliegue · página física del 4+1

| Campo | Valor |
| --- | --- |
| Versión | 2.0 |
| Fecha | 2026-11-22 |
| Vista | Física del modelo 4+1 |
| Archivo editable | página `Vista física` de [`vista-4mas1.drawio`](vista-4mas1.drawio) |
| Fuentes | [`../infra/k8s`](../infra/k8s), [`../infra/docker/docker-compose.yml`](../infra/docker/docker-compose.yml), [`../infra/argocd`](../infra/argocd), [`../infra/observability`](../infra/observability) |
| Relacionado | [`vista-4mas1.md`](vista-4mas1.md), [`diagramas-c4.md`](diagramas-c4.md) |

## 1. Qué muestra

La vista física responde **dónde corre cada pieza y por qué puerto habla**. No
describe responsabilidades de código; eso está en C4.

- Navegador del comensal, del dueño y del superadmin.
- Clúster Kubernetes de un nodo con namespaces `ingress-nginx`, `argocd`,
  `tukituki` y `monitoring`.
- Servicios externos: Ollama, WhatsApp y GitHub/GHCR.
- Stack local de Docker Compose con el mismo código y otro borde.

En producción el borde es **Ingress Nginx**; en desarrollo es **Traefik →
API Gateway Nginx**. Los frontends siempre reciben las URLs en `/config.js`, así
que la misma imagen sirve en ambos entornos.

## 2. Namespaces de Kubernetes

| Namespace | Contenido |
| --- | --- |
| `ingress-nginx` | `ingress-nginx-controller`; hosts y TLS |
| `argocd` | Argo CD y ApplicationSet |
| `tukituki` | 3 frontends, 6 servicios Node, AI Gateway, visión, PostgreSQL, Redis y RustFS |
| `monitoring` | Prometheus, Grafana, Tempo y OpenTelemetry Collector |

Además, `tukituki` contiene ConfigMaps, Secrets, HPA, PDB, NetworkPolicy y
ServiceMonitors. El namespace, la cuota y el LimitRange se crean con OpenTofu o
con el manifiesto de Kustomize; las imágenes y los Deployments los reconcilia
Argo CD.

## 3. Réplicas y puertos

| Carga | Réplicas | Puerto |
| --- | --- | --- |
| `web-comensal` | 2; HPA 2..6 al 75 % | 80 |
| `panel-restaurante` | 2 | 80 |
| `admin-plataforma` | 2 | 80 |
| `identidad-service` | 2 | 3001 |
| `restaurantes-service` | 2; HPA 1..4 al 70 % | 3002 |
| `media-service` | 1 | 3003 |
| `pedidos-service` | 2; HPA 1..4 al 70 % | 3004 |
| `resenas-service` | 2 | 3005 |
| `admin-service` | 2 | 3006 |
| `ai-gateway` | 1 | 8000 |
| `vision-service` | 1 | 8000 |
| PostgreSQL | 1 | 5432 |
| Redis | 1 | 6379 |
| RustFS | 1 | 9000 API / 9001 consola |

En el overlay local se baja a 1 réplica por Deployment. El HPA de web,
restaurantes y pedidos ajusta según CPU.

## 4. Relaciones principales

| Desde | Hacia | Protocolo | Por qué |
| --- | --- | --- | --- |
| Navegador | Ingress Nginx | HTTPS | Sitios y API por host |
| Ingress | Frontends | HTTP :80 | Sirve las tres SPA |
| Ingress | Servicios | HTTP `:3001`–`:3006` | Prefijos `/v1/*` |
| Ingress | AI Gateway | HTTP :8000 | `/api/v1/ai` |
| Frontends | Servicios | REST + JWT | A través del Ingress |
| Servicios | PostgreSQL | TCP :5432 | Cada uno a su base lógica |
| `media-service` | RustFS | S3 :9000 | Objetos de imagen |
| `media-service` | `vision-service` | HTTP :8000 | Clasificar la foto |
| `ai-gateway` | Ollama | HTTP :11434 | Chat y embeddings |
| `ai-gateway` | `restaurantes` y `resenas` | REST | Catálogo y valoraciones |
| Prometheus | Servicios | HTTP `/metrics` | Scrape cada 30 s |
| Servicios | OTel Collector | OTLP :4317/:4318 | Trazas |
| GitHub Actions | GHCR | HTTPS | Imágenes |
| GHCR | Argo CD | HTTPS | Tags y digests |
| Argo CD | Kubernetes | HTTPS | GitOps |

## 5. Stack local

`infra/docker/docker-compose.yml` levanta el mismo sistema con estos puertos:

| Pieza | URL local |
| --- | --- |
| Comensal | `http://localhost:8081` |
| Panel | `http://localhost:8082` |
| Administración | `http://localhost:8083` |
| API Gateway | `http://localhost:8084` |
| Servicios Node | `3001`–`3006` |
| AI Gateway | `8000` |
| Visión | `8002` |
| PostgreSQL | `5432` |
| Redis | `6379` |
| RustFS | `9000` / `9001` |
| Mailpit | `8025` / `1025` |
| Traefik | `8088` / dashboard `8089` |
| Grafana | `3000` |
| Prometheus | `9090` |

En Compose, Traefik publica el API Gateway Nginx; los frontends llaman a
`http://localhost:8084` y reciben esa URL en `/config.js`. Mailpit y Traefik no
se despliegan en Kubernetes.

## 6. Decisiones visibles

- **Un solo nodo.** El PDB protege ante drenajes, no ante la caída del nodo.
- **Servicios sin estado.** Escalan con HPA; la base y los objetos quedan fuera.
- **Una réplica del AI Gateway.** La cuota exacta depende de que el limitador sea
  local al pod; migrarlo a Redis es un pendiente.
- **Redis desplegado sin conectar.** El rate limit de Fastify sigue en memoria.
- **Visión fail-open.** Si el clasificador no está listo, media deja pasar la
  subida.
- **El HPA manda.** Argo CD ignora `/spec/replicas` para no pelear con el
  autoscaler.

> **Regla de honestidad.** Cada caja corresponde a un manifiesto, una imagen o un
> servicio realmente desplegado. Lo que no está en `infra/` no aparece como si
> existiera.
