# Capa edge con Cloudflare

Tuki se sirve desde Kubernetes, pero el tráfico público entra por Cloudflare:
**DNS → proxy/WAF → caché → Cloudflare Tunnel → Ingress → Services**. No se
abre ningún puerto del clúster a Internet y no hace falta IP pública.

```text
comensal
   │  https://tuki.app
   ▼
Cloudflare (DNS proxied, WAF, rate limit, caché)
   │  túnel saliente (cloudflared, sin inbound)
   ▼
Ingress nginx ──► Service tuki (Nginx/SPA)
   │
   └────────────► Service backend (AI Gateway)
                        │
                        └──► Groq / Supabase
```

## 1. Qué aporta cada pieza

| Pieza | Configuración | Archivo |
| --- | --- | --- |
| DNS | `tuki.app` proxied (naranja) + `www` CNAME | Dashboard |
| Tunnel | 2 réplicas de `cloudflared` en el namespace `tuki` | `cloudflared-deployment.yaml` |
| WAF | Reglas gestionadas de Cloudflare + 4 reglas propias | `waf-reglas.json` |
| Rate limit de borde | 60 req/min por IP en `/api/*` | `waf-reglas.json` |
| Caché | Assets inmutables 1 año; HTML y API sin caché | `cache-reglas.json` |
| R2 (opcional) | Réplica de imágenes si se sale del plan gratuito | §6 |

El rate limit de borde es, además, la pieza que hace coherente el límite del
gateway: la cuota **global** vive en Cloudflare (una sola IP, una sola cuenta),
y el token bucket del gateway queda como defensa en profundidad por pod.

## 2. Crear el túnel

```bash
cloudflared tunnel login
cloudflared tunnel create tuki

# Guarda el token en un secreto de Kubernetes (nunca en Git)
kubectl create namespace tuki --dry-run=client -o yaml | kubectl apply -f -
kubectl -n tuki create secret generic cloudflared-token \
  --from-literal=token="$(cloudflared tunnel token tuki)"

kubectl apply -k deploy/cloudflare
```

`cloudflared` solo necesita **salida** a `*.argotunnel.com:7844`. No se publica
ningún Service de tipo `LoadBalancer` ni `NodePort`.

## 3. DNS

| Nombre | Tipo | Contenido | Proxy |
| --- | --- | --- | --- |
| `tuki.app` | CNAME | `<TUNNEL_ID>.cfargotunnel.com` | Proxied |
| `www.tuki.app` | CNAME | `tuki.app` | Proxied |

TLS lo termina Cloudflare con su certificado universal. El Ingress conserva
`cert-manager` para el tráfico interno túnel → Ingress (`originRequest.noTLSVerify`
en el ejemplo, o un certificado de origen si se prefiere).

## 4. Aplicar WAF y caché

Las reglas viven en JSON con el formato de la API de Rulesets. Se aplican con:

```bash
export CLOUDFLARE_API_TOKEN=...   # token con Zone:Rulesets:Edit
export CLOUDFLARE_ZONE_ID=...
node scripts/cloudflare/aplicar-reglas.mjs --dry-run
node scripts/cloudflare/aplicar-reglas.mjs
```

El script es idempotente: busca la ruleset de la fase y reemplaza solo las
reglas cuyo `description` empieza por `tuki-`.

## 5. Verificación

```bash
bash scripts/cloudflare/verificar-edge.sh https://tuki.app
```

Comprueba: cabeceras `cf-cache-status`/`cf-ray`, que `/api/healthz` no se cachea,
que un `POST` con método no permitido se bloquea y que los assets llevan
`cache-control` largo. En el dashboard, *Security → Events*, deben aparecer las
reglas `tuki-*` cuando se prueba el bloqueo.

## 6. R2 (opcional, no implementado)

R2 tiene sentido si se superan los 5 GB/mes de egress de Supabase Storage o si
se quiere servir imágenes desde el mismo edge. El diseño sería:

1. Bucket `tuki-imagenes` con dominio público `img.tuki.app`.
2. La SPA sube a R2 con URL prefirmada por una Edge Function.
3. Cloudflare Cache delante de `img.tuki.app` (1 año, inmutable).

No se implementa ahora: Supabase Storage cubre de sobra la entrega y añadir R2
duplicaría proveedores y credenciales. Queda documentado como escala.

## 7. Coste

Plan gratuito de Cloudflare: DNS, TLS, WAF gestionado, 5 reglas propias, caché
y **hasta 10 reglas de rate limiting**. Tunnel incluido. R2: 10 GB gratis.
Es suficiente para la sustentación y para el primer año de un restaurante.
