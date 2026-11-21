# Observabilidad local

Stack mínimo de métricas y dashboards para TukiTuki sobre Docker Compose. Es el
equivalente local de `infra/observability`, que está pensado para Kubernetes.

```
Stack principal                              Observabilidad
├── red: tukituki_default  ◄──────────────── prometheus  (raspa /metrics)
│   ├── identidad-service:3001                 ├── grafana        :3000
│   ├── restaurantes-service:3002              └── node-exporter  :9100
│   ├── media-service:3003
│   ├── pedidos-service:3004
│   ├── resenas-service:3005
│   ├── admin-service:3006
│   └── ai-gateway:8000
```

## Cómo se levanta

`pnpm infra:up` levanta primero el stack principal y después este. También se
puede arrancar por separado:

```bash
docker compose -f infra/docker/monitoring/docker-compose.monitoring.yml up -d
```

El stack principal debe estar arriba porque este compose se une a su red como
red externa.

| Servicio | URL local |
|---|---|
| Grafana | `http://localhost:3000` |
| Prometheus | `http://localhost:9090` |
| node-exporter | `http://localhost:9100/metrics` |

## Credenciales y variables

Grafana arranca con el usuario `admin` y la contraseña `admin`. Para cambiarla,
exporta `GRAFANA_ADMIN_PASSWORD` antes de levantar el stack o crea
`infra/docker/monitoring/.env` con `GRAFANA_ADMIN_PASSWORD=...`.

| Variable | Obligatoria | Descripción |
|---|---|---|
| `GRAFANA_ADMIN_PASSWORD` | no | contraseña de `admin`; por defecto `admin` |
| `GRAFANA_ROOT_URL` | no | URL de Grafana; por defecto `http://localhost:3000` |
| `TUKI_DOCKER_NETWORK` | no | red del stack principal; por defecto `tukituki_default` |
| `PROMETHEUS_RETENTION` | no | retención temporal; por defecto `7d` |
| `PROMETHEUS_RETENTION_SIZE` | no | retención por tamaño; por defecto `1GB` |

`TUKI_DOCKER_NETWORK` debe coincidir con la red real. Se puede comprobar con:

```bash
docker inspect tukituki-identidadbe \
  --format '{{range $k, $v := .NetworkSettings.Networks}}{{$k}}{{"\n"}}{{end}}'
```

Si el compose principal cambia de nombre de proyecto, la red cambia y hay que
actualizar esta variable.

## Qué se recoge

- métricas RED de los servicios (`/metrics` de `@tuki/observabilidad-node`);
- métricas del AI Gateway;
- CPU, memoria, disco y red del host con `node-exporter`;
- salud de Grafana y de Prometheus.

cAdvisor y Loki no se incluyen para mantener el consumo de memoria bajo. Los
logs se consultan con:

```bash
docker compose -f infra/docker/docker-compose.yml logs -f <servicio>
```

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
stack actual solo las muestra como `pending`/`firing` en
`http://localhost:9090/alerts`.

## Operación

```bash
# Ver el estado del stack de observabilidad
docker compose -f infra/docker/monitoring/docker-compose.monitoring.yml ps

# Validar la configuración sin levantar nada
docker compose -f infra/docker/monitoring/docker-compose.monitoring.yml config

# Sigue los logs de Grafana o Prometheus
docker compose -f infra/docker/monitoring/docker-compose.monitoring.yml logs -f grafana

# Recargar Prometheus tras cambiar reglas
curl -X POST http://localhost:9090/-/reload
```

Docker Compose no recrea un contenedor cuando solo cambia un archivo montado.
Después de editar `prometheus.yml`, `alertas.yml` o el provisioning de Grafana,
reinicia el contenedor correspondiente:

```bash
docker compose -f infra/docker/monitoring/docker-compose.monitoring.yml restart prometheus
docker compose -f infra/docker/monitoring/docker-compose.monitoring.yml restart grafana
```

Los límites de memoria (`mem_limit`) mantienen la observabilidad acotada:
Prometheus 384 MB, Grafana 768 MB y node-exporter 64 MB.

Grafana 13 consume ~330 MB en reposo. Con un límite más bajo el OOM killer lo
reinicia al navegar entre dashboards, por eso el límite es 768 MB y se desactivó
la instalación de plugins en segundo plano (`GF_PLUGINS_PREINSTALL_DISABLED`).
