# Observabilidad en Dokploy

Stack de métricas, logs y dashboards para el despliegue de TukiTuki en un host
Docker gestionado por Dokploy. Es el equivalente a `infra/observability`, que
está pensado para Kubernetes.

```
Dokploy
├── aplicación "tuki"                 infra/docker/docker-compose.production.yml
│   └── red: tuki-tuki-mcftoo_default
│
└── aplicación "tuki-monitoring"      infra/docker/monitoring/docker-compose.monitoring.yml
    ├── prometheus      métricas de los 6 servicios y del AI Gateway
    ├── cadvisor        CPU, memoria y red por contenedor
    ├── node-exporter   CPU, memoria y disco del host
    ├── loki            almacén de logs (7 días)
    ├── alloy           recolector de logs de Docker
    └── grafana         dashboards y datasource Prometheus + Loki
```

## Por qué una aplicación aparte

- Desplegar Tuki no reinicia Grafana y viceversa.
- Prometheus entra por la red interna de Docker: no se publica `9090`, `3100`
  ni `3000`. Solo Grafana queda detrás de Traefik con HTTPS.
- La aplicación de producción no cambia; el stack de monitoreo se une a su red
  como red externa.

## Variables

| Variable | Obligatoria | Descripción |
|---|---|---|
| `GRAFANA_ADMIN_PASSWORD` | sí | contraseña del usuario `admin` |
| `GRAFANA_ROOT_URL` | recomendada | `https://grafana.<host>.nip.io` |
| `TUKI_DOCKER_NETWORK` | recomendada | red del compose de producción; por defecto `tuki-tuki-mcftoo_default` |
| `PROMETHEUS_RETENTION` | no | retención temporal; por defecto `15d` |
| `PROMETHEUS_RETENTION_SIZE` | no | retención por tamaño; por defecto `2GB` |

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

- **Tuki · Servicios y SLO (Docker):** disponibilidad 1 h, peticiones, 5xx,
  p95, peticiones en curso, CPU/memoria/reinicios por contenedor y estado de
  los targets.
- **Tuki · API e infraestructura (Docker):** rutas y latencia del AI Gateway,
  rate limit, tokens, llamadas a Groq y CPU/RAM/disco del host.

Las alertas de `prometheus/alertas.yml` se evalúan en Prometheus. Para recibir
notificaciones hace falta un Alertmanager o configurar Grafana Alerting; el
stack actual solo las muestra como `pending`/`firing`.

## Logs

Alloy lee el socket de Docker y envía a Loki los contenedores cuyo nombre
empieza por `tukituki-prod-`. En Grafana → *Explore* → datasource **Loki**:

```logql
{container="tukituki-prod-pedidosbe"}
{service="identidad-service"} |= "error"
```

Dokploy también muestra los logs en vivo en la pestaña *Logs* de cada servicio.

## Operación

```bash
# Ver el estado del stack
docker compose -p tuki-monitoring ps

# Validar la configuración antes de desplegar
docker compose -f infra/docker/monitoring/docker-compose.monitoring.yml config

# Recargar Prometheus tras cambiar reglas
curl -X POST http://127.0.0.1:9090/-/reload
```

`cadvisor` requiere `privileged: true` para leer las métricas del kernel. Es el
mismo esquema que usa la plantilla *Container Monitoring* de Dokploy.
