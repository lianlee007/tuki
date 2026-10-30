# SLO y error budget

Las alertas que ya existían (`deploy/observability/prometheusrule.yaml`) dicen
**qué está roto**. Las de `slo.yaml` dicen **cuánto presupuesto de fallo queda**.
Son complementarias: un pico de 5xx puede disparar la alerta de síntoma sin
consumir el mes; una degradación lenta puede no disparar nada y agotar el SLO.

## 1. Objetivos

| SLO | Definición | Objetivo | Ventana | Error budget |
| --- | --- | --- | --- | --- |
| Disponibilidad del gateway | `status !~ 5..` / total | **99,5 %** | 30 días | 0,5 % (≈ 3 h 36 min) |
| Latencia del gateway | peticiones < 8 s | **95 %** | 30 días | 5 % |
| Disponibilidad de la web | `up{service="tuki"}` | **99,5 %** | 30 días | 0,5 % |

8 s es el umbral de latencia porque Groq responde en 1–4 s y el timeout del
gateway es 30 s; 8 s separa "lento" de "el usuario se fue".

## 2. Reglas de registro

`deploy/observability/slo.yaml` calcula:

- `tuki:sli_disponibilidad:ratio{5m,1h,6h}`
- `tuki:sli_latencia:ratio{5m,1h}`
- `tuki:sli_web:ratio5m`

Se calculan en Prometheus, no en Grafana, para que cualquier consumidor
(alertas, dashboard, `curl` al API) vea el mismo número.

## 3. Alertas de quema (multiventana)

| Alerta | Quema | Equivale a agotar el mes en | Severidad |
| --- | --- | --- | --- |
| `TukiSloDisponibilidadQuemaRapida` | 14,4× en 1 h | ~2 días | critical |
| `TukiSloDisponibilidadQuemaLenta` | 6× en 6 h | ~5 días | warning |
| `TukiSloLatenciaQuemaRapida` | 14,4× en 1 h | ~2 días | warning |
| `TukiSloWebSinPresupuesto` | < 99,5 % 10 min | inmediato | critical |

Todas exigen **dos ventanas** (larga y corta) para no despertar a nadie por un
pico de 30 segundos.

## 4. Qué hacer cuando suena

1. **Quema rápida de disponibilidad** → `docs/runbook.md#errores-5xx-en-el-gateway`.
   Mira primero Groq (¿429/5xx?), luego el túnel de Cloudflare y por último los pods.
2. **Quema lenta** → no es un incidente: es deuda. Abre una tarea con la gráfica
   de 6 h y el `code` de los logs JSON.
3. **Latencia** → compara `ai_gateway_upstream_duration_seconds` con
   `ai_gateway_http_request_duration_seconds`: si el upstream es el 90 %, el
   problema es Groq, no Tuki.
4. **Web sin presupuesto** → `kubectl -n tuki get pods,ingress`; si el pod está
   `Running`, revisa el `ServiceMonitor` y el túnel.

## 5. Revisión mensual

- Consulta `1 - tuki:sli_disponibilidad:ratio6h` al cierre de cada mes.
- Si el budget sobra (> 80 %), el objetivo es demasiado laxo: súbelo a 99,9 %.
- Si se agota dos meses seguidos, el objetivo es irreal para el equipo: bájalo
  o invierte en la causa raíz. Un SLO que siempre se incumple no informa.

## 6. Verificación

```bash
kubectl apply -k deploy/observability
kubectl -n tuki get prometheusrule
# En Prometheus:
#   tuki:sli_disponibilidad:ratio1h
#   ALERTS{alertname=~"TukiSlo.*"}
```
