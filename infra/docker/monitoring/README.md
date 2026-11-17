# Observabilidad en Dokploy

Stack mínimo de métricas y dashboards para el despliegue de TukiTuki en un
host Docker gestionado por Dokploy. Es el equivalente a `infra/observability`,
que está pensado para Kubernetes.

```
Dokploy
├── aplicación "tuki"                 infra/docker/docker-compose.production.yml
│   └── red: tuki-tuki-mcftoo_default
│
└── aplicación "tuki-monitoring"      infra/docker/monitoring/docker-compose.monitoring.yml
    ├── prometheus      métricas de los 6 servicios y del AI Gateway
    ├── node-exporter   CPU, memoria y disco del host
    └── grafana         dashboards con Prometheus como datasource
```

## Por qué una aplicación aparte

- Desplegar Tuki no reinicia Grafana y viceversa.
- Prometheus entra por la red interna de Docker: no se publica `9090` ni
  `3000`. Solo Grafana queda detrás de Traefik con HTTPS.
- La aplicación de producción no cambia; el stack de monitoreo se une a su red
  como red externa.

## Por qué no hay cAdvisor ni Loki

La primera versión incluía cAdvisor, Loki y Alloy. En este host (8 GB de RAM y
más de 70 contenedores de varios proyectos) cAdvisor llegó a consumir ~870 MB
escaneando los filesystems y el conjunto completo superó los 1,8 GB. El panel
de Dokploy se quedó sin memoria y dejó de responder en dos ocasiones.

Por eso esta pila solo recoge:

- métricas RED de los servicios (`/metrics` de `@tuki/observabilidad-node`);
- métricas del AI Gateway;
- CPU, memoria, disco y red del host con `node-exporter`.

Los **logs en tiempo real** se consultan en Dokploy → servicio → *Logs*. Si más
adelante se amplía la RAM del host, se puede añadir Loki + Alloy y cAdvisor con
límites estrictos de memoria.

## Variables

| Variable | Obligatoria | Descripción |
|---|---|---|
| `GRAFANA_ADMIN_PASSWORD` | sí | contraseña del usuario `admin` |
| `GRAFANA_ROOT_URL` | recomendada | `https://grafana.<host>.nip.io` |
| `TUKI_DOCKER_NETWORK` | recomendada | red del compose de producción; por defecto `tuki-tuki-mcftoo_default` |
| `PROMETHEUS_RETENTION` | no | retención temporal; por defecto `7d` |
| `PROMETHEUS_RETENTION_SIZE` | no | retención por tamaño; por defecto `1GB` |

`TUKI_DOCKER_NETWORK` debe coincidir con la red real. Se puede comprobar con:

```bash
docker inspect tukituki-prod-identidadbe \
  --format '{{range $k, $v := .NetworkSettings.Networks}}{{$k}}{{"\n"}}{{end}}'
```

Si el servicio `tuki` se recrea en Dokploy con otro `appName`, la red cambia y
hay que actualizar esta variable.

## Despliegue en Dokploy

1. Crear un servicio **Compose** llamado `tuki-monitoring` en el mismo proyecto.
2. Fuente: repositorio `git@github.com:lianlee007/tuki.git`, rama de despliegue.
3. *Compose Path*: `infra/docker/monitoring/docker-compose.monitoring.yml`.
4. Definir las variables de la tabla anterior.
5. En el servicio `grafana`, agregar el dominio `grafana.<host>.nip.io`,
   puerto `3000`, HTTPS con Let's Encrypt.
6. Desplegar. Dokploy añade `dokploy-network` al servicio `grafana` para que
   Traefik lo alcance; el resto de contenedores solo viven en la red de Tuki.

Los targets de Prometheus son nombres de servicio (`identidad-service:3001`,
`ai-gateway:8000`, etc.), así que no dependen de IPs ni de puertos publicados.

## Dashboards

- **Tuki · Aplicación** (dashboard inicial): SLO, peticiones por segundo, 5xx,
  latencia p95, peticiones por servicio, por método y por ruta, errores por
  código HTTP, peticiones en curso, heap, RSS, CPU, event loop y GC de cada
  servicio Node.js. Tiene un selector `Servicio` para filtrar los seis
  microservicios.
- **Tuki · Servicios y SLO (Docker):** vista resumida de disponibilidad 1 h,
  peticiones, 5xx, p95, peticiones en curso y estado de los targets.
- **Tuki · API e infraestructura (Docker):** tráfico y latencia del AI Gateway,
  rate limit, tokens, llamadas a Groq, CPU/RAM/disco del host y métricas de
  proceso del gateway. Los contadores del gateway se muestran en cero mientras
  no reciba tráfico de IA.

`GF_DASHBOARDS_DEFAULT_HOME_DASHBOARD_PATH` hace que al iniciar sesión se abra
**Tuki · Aplicación**.

Las alertas de `prometheus/alertas.yml` se evalúan en Prometheus. Para recibir
notificaciones hace falta un Alertmanager o configurar Grafana Alerting; el
stack actual solo las muestra como `pending`/`firing`.

## Operación

```bash
# Ver el estado del stack
docker compose -p tuki-monitoring ps

# Validar la configuración antes de desplegar
docker compose -f infra/docker/monitoring/docker-compose.monitoring.yml config

# Recargar Prometheus tras cambiar reglas
curl -X POST http://127.0.0.1:9090/-/reload
```

Docker Compose no recrea un contenedor cuando solo cambia un archivo montado.
Después de editar `prometheus.yml`, `alertas.yml` o el provisioning de Grafana,
reinicia el contenedor correspondiente:

```bash
docker compose -p tuki-monitoring restart prometheus
docker compose -p tuki-monitoring restart grafana
```

Los límites de memoria (`mem_limit`) evitan que la observabilidad vuelva a
dejar sin RAM al panel de Dokploy.
