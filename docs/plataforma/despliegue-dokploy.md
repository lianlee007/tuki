# Despliegue de Tuki en Dokploy

Contexto operativo del despliegue real de Tuki en el VPS compartido de
CloudForge. Sirve para volver al panel sin reconstruir la historia y para que
otra persona pueda repetir el despliegue o diagnosticarlo.

- **Estado:** desplegado y funcionando (frontend y gateway `healthy`).
- **Última actualización:** 2026-10-31.
- **Commits desplegados:** `9341870` (fix de la IA y del acceso) y `71a336e` (esta documentación).
- **URL pública:** <http://tuki-tuki-169-58-151-195.sslip.io>
- **Acceso directo por IP y puerto:** <http://169.58.151.195:8080>

## 1. Por qué Dokploy y no Kubernetes

El proyecto académico usa Kubernetes + ArgoCD (`deploy/`), pero el VPS
compartido no expone un clúster para este proyecto y el tiempo de la entrega no
alcanzaba para montarlo. Dokploy despliega el mismo `docker-compose.yml` en un
solo servidor: mantiene la topología de dos contenedores y permite enseñar el
producto en vivo sin renunciar a los manifiestos, que siguen en el repositorio
como camino de producción.

## 2. Topología desplegada

```text
VPS 169.58.151.195
└── Dokploy v0.29.14 (:3000, panel)
    └── Proyecto "tuki" / entorno "production"
        └── Servicio Compose "tuki"  (appName: tuki-tuki-mcftoo)
            ├── tuki-frontend   Nginx sin privilegios, puerto 8080
            └── tuki-backend    AI Gateway (FastAPI), puerto 8000 interno
```

- El servicio Compose construye **dos imágenes** desde el repositorio:
  `tuki:local` (SPA) y `tuki-ai-gateway:local` (gateway).
- Nginx sirve la SPA y proxya `/api/` hacia `backend:8000`
  (`docker/nginx/conf.d/default.conf`).
- El puerto 8000 del gateway **no** se publica en producción; Nginx lo alcanza
  por la red interna del compose.
- El frontend se publica en el puerto 8080 del host (mapeado desde `TUKI_PORT`).

## 3. Identificadores del panel

| Recurso | Identificador |
| --- | --- |
| Proyecto | `DUYPWiNLT5HNz1-AH1PF9` |
| Entorno | `85Sj6T716baYjnXnHzOJ-` (`production`) |
| Servicio Compose | `xfJJg_WxILdJEgw9cCqgk` |
| Nombre de app | `tuki-tuki-mcftoo` |
| Webhook de despliegue | `http://169.58.151.195:3000/api/deploy/compose/AgzcW0jqC_2Pq3fg_7mBZ` |
| Clave SSH de Dokploy | `tuki-deploy` (ED25519, solo lectura) |

El webhook permite redesplegar sin abrir el panel. No basta un `POST` vacío:
Dokploy lo trata como aviso de GitHub y necesita la cabecera `X-GitHub-Event`
y el `ref` de la rama; si falta, responde `301 Branch Not Match`.

```bash
curl -X POST 'http://169.58.151.195:3000/api/deploy/compose/AgzcW0jqC_2Pq3fg_7mBZ' \
  -H 'Content-Type: application/json' \
  -H 'X-GitHub-Event: push' \
  -d '{"ref":"refs/heads/main"}'
# -> {"message":"Compose deployed successfully"}
```

## 4. Acceso al repositorio

El repositorio `lianlee007/tuki` es **privado** y no había una GitHub App de
Dokploy con permiso sobre él. La solución fue una **deploy key**:

1. En Dokploy → *Settings → SSH Keys → Add SSH Key*, generar una clave ED25519
   llamada `tuki-deploy`.
2. Registrar la clave pública en GitHub como *Deploy key* del repositorio, con
   **read-only** activado.
3. En el servicio Compose, pestaña *Provider → Git*:

   | Campo | Valor |
   | --- | --- |
   | Repository URL | `git@github.com:lianlee007/tuki.git` |
   | SSH Key | `tuki-deploy` |
   | Branch | `main` |
   | Compose Path | `./docker-compose.yml` |

No se configura *Autodeploy*: el despliegue se dispara a mano desde el panel o
por webhook. Si algún día se activa, cada push a `main` reconstruye las dos
imágenes.

## 5. Variables de entorno

Se cargan en Dokploy → servicio Compose → pestaña *Environment*. **Los valores
no se documentan aquí** (claves de Supabase y Groq); viven en el panel y en
`.env.local`, que no se versiona.

| Variable | Para qué | Dónde se usa |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | URL del proyecto Supabase | build del frontend y `SUPABASE_URL` del gateway |
| `VITE_SUPABASE_ANON_KEY` | Clave pública de Supabase | build del frontend y `SUPABASE_ANON_KEY` del gateway |
| `GROQ_API_KEY` | Clave de Groq | solo el contenedor `backend` |
| `TUKI_PORT` | Puerto publicado del frontend (`8080`) | mapeo de puertos del compose |
| `AI_ENVIRONMENT` | `production` | validaciones del gateway |
| `AI_AUTH_MODE` | `supabase` | validación de sesión en el gateway |
| `AI_ALLOW_ANON` | `true` | permite carrito y corrección de barrio sin sesión |
| `VITE_PUBLIC_APP_URL` | Origen de los enlaces compartidos y del QR. Mientras no haya HTTPS: `http://tuki-tuki-169-58-151-195.sslip.io:8080` | build del frontend |

Reglas que no se deben romper:

- `AI_AUTH_MODE=disabled` **falla al arrancar** con `AI_ENVIRONMENT=production`
  (`Configuración inválida: AI_AUTH_MODE=disabled no se permite en producción`).
- `SUPABASE_ANON_KEY` la usa el gateway para validar tokens HS256 (ver §8). Si
  falta, sigue arrancando pero las llamadas con sesión responden
  `503 auth_unavailable`.
- Las variables `VITE_*` se **incrustan en el bundle** durante el build: si
  cambian, hay que reconstruir la imagen, no basta reiniciar el contenedor.

## 6. Dominio y HTTP

| Campo | Valor |
| --- | --- |
| Host | `tuki-tuki-169-58-151-195.sslip.io` |
| Servicio | `frontend` |
| Puerto del contenedor | `8080` |
| Path | `/` |
| HTTPS | desactivado |

Se usa **sslip.io** porque resuelve cualquier nombre que contenga una IP
pública: el DNS gratuito traduce `169-58-151-195` a `169.58.151.195` sin que
haga falta comprar un dominio.

Consecuencias:

- `tuki-tuki.sslip.io` **no resuelve**: sslip.io exige la IP en el nombre.
- Sin HTTPS en Dokploy el sitio queda en **HTTP** y el navegador muestra
  "No seguro".
- En `sslip.io` **sí se puede** emitir un certificado con Let's Encrypt: cada
  subdominio es su propio nombre público y el reto HTTP-01 funciona. Basta
  activar *HTTPS* en el dominio de Dokploy y esperar a la emisión.

### 6.1 Por qué el móvil muestra `404 page not found`

Síntoma: en computadora `http://tuki-tuki-169-58-151-195.sslip.io` carga, pero
en el móvil sale un `404 page not found` (texto plano, sin el diseño de Tuki).

Causa: los navegadores móviles (Chrome en Android y muchos navegadores dentro
de apps como WhatsApp o Instagram) intentan **HTTPS primero** por su cuenta. El
puerto 443 del VPS está abierto y lo atiende el Traefik de Dokploy, pero como
el dominio no tiene HTTPS configurado **no existe un router para ese host** y
Traefik responde su 404 por defecto:

```text
$ curl -sk http://tuki-tuki-169-58-151-195.sslip.io/ -o /dev/null -w '%{http_code}\n'
200
$ curl -sk https://tuki-tuki-169-58-151-195.sslip.io/ -o /dev/null -w '%{http_code}\n'
404
```

El `404` **no viene de Nginx ni de React Router**: la petición nunca llega al
contenedor. En computadora funciona porque el enlace se abre como `http://`.

Mientras se habilita HTTPS, el enlace que **sí** funciona en el móvil es el que
lleva el puerto explícito, porque los navegadores no lo actualizan a HTTPS:

- <http://tuki-tuki-169-58-151-195.sslip.io:8080>
- <http://169.58.151.195:8080>

Para que el QR y los enlaces compartidos usen siempre ese origen, define
`VITE_PUBLIC_APP_URL` (§5) y reconstruye el frontend: las variables `VITE_*` se
incrustan en el build, no basta reiniciar el contenedor.

Solución definitiva (en el panel, no en el código):

1. Dokploy → servicio Compose `tuki` → pestaña *Domains* → editar el dominio
   `tuki-tuki-169-58-151-195.sslip.io`.
2. Activar **HTTPS** (Let's Encrypt) y guardar. El reto HTTP-01 se resuelve por
   el puerto 80, que ya está publicado.
3. Activar **Redirect to HTTPS** para que el enlace `http://` también termine en
   el sitio correcto.
4. Verificar que el 404 desapareció:

   ```bash
   curl -sI https://tuki-tuki-169-58-151-195.sslip.io/ | head -1   # HTTP/2 200
   curl -s  https://tuki-tuki-169-58-151-195.sslip.io/healthz      # ok
   ```

Sin paso 2 y 3, cualquier enlace compartido por WhatsApp, Instagram o un QR
seguirá abriéndose en HTTPS y devolviendo el 404 de Traefik.

## 7. Flujo de despliegue

1. Hacer los cambios en local y pasar la puerta de calidad:

   ```bash
   pnpm verificar        # typecheck, lint, tests y arquitectura
   ```

2. Commit con prefijo convencional en español y push a `main`.
3. Dokploy → proyecto `tuki` → servicio Compose `tuki` → pestaña *General* →
   **Deploy** → **Confirm**.
4. Esperar el estado **Done** en *Deployments*. La primera construcción tarda
   varios minutos; las siguientes reutilizan caché de capas.
5. Verificar (§8).

> Los cambios que solo tocan documentación también pasan por el mismo flujo:
> reconstruir es rápido y deja el commit visible en el historial del despliegue.

## 8. Verificación

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://tuki-tuki-169-58-151-195.sslip.io/
curl -s http://tuki-tuki-169-58-151-195.sslip.io/healthz
curl -s http://tuki-tuki-169-58-151-195.sslip.io/api/healthz
curl -s http://tuki-tuki-169-58-151-195.sslip.io/api/readyz

# Con HTTPS activo (necesario para móviles, ver §6.1)
curl -s -o /dev/null -w '%{http_code}\n' https://tuki-tuki-169-58-151-195.sslip.io/
curl -s https://tuki-tuki-169-58-151-195.sslip.io/api/readyz
```

Resultados esperados:

| Ruta | Qué prueba |
| --- | --- |
| `/` | Nginx sirve la SPA |
| `/healthz` | Nginx responde |
| `/api/healthz` | Nginx alcanza el gateway |
| `/api/readyz` | Groq configurado, `auth_mode: supabase` y modelos cargados |

Prueba funcional de la IA (sustituir `TOKEN` por un `access_token` real):

```bash
curl -s -X POST http://tuki-tuki-169-58-151-195.sslip.io/api/v1/ai/chat \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer TOKEN" \
  -d '{"prompt":"Dime solo: hola","system":"Responde breve."}'
```

Debe devolver `200` con `content`, `model` y `request_id`. Sin cabecera
`Authorization` también responde `200` porque `AI_ALLOW_ANON=true`.

## 9. Autenticación de la IA en producción

El proyecto de Supabase de Tuki usa **JWT HS256** (clave simétrica). En ese
modo el endpoint `…/auth/v1/.well-known/jwks.json` devuelve un **conjunto
vacío**, así que la validación local por JWKS no puede comprobar la firma.

Síntoma que motivó el arreglo: cualquier llamada **con sesión iniciada**
devolvía `500 Ocurrió un error inesperado`; sin sesión funcionaba.

Cómo funciona ahora (`services/ai-gateway/app/adaptadores/supabase.py`):

1. Se lee el `alg` del token sin verificarlo.
2. Si empieza por `HS`, el token se comprueba contra
   `GET {SUPABASE_URL}/auth/v1/user` con la clave pública `anon`. Es GoTrue
   quien valida firma y caducidad: no hace falta repartir el secreto JWT.
3. El resultado se cachea 60 s por hash del token
   (`AI_LEGACY_TOKEN_CACHE_SECONDS`).
4. Si falta la clave o Supabase no responde → `503 auth_unavailable`, nunca se
   degrada a anónimo.
5. Los tokens asimétricos (RS256/ES256/EdDSA) siguen validándose por JWKS.

## 10. Problemas conocidos y solución

| Síntoma | Causa | Solución |
| --- | --- | --- |
| `500 Ocurrió un error inesperado` al usar la IA con sesión | JWKS vacío por JWT HS256 | Añadir `SUPABASE_ANON_KEY` y redesplegar (§9) |
| `503 auth_unavailable` | Falta `SUPABASE_ANON_KEY` o Supabase no responde | Revisar la variable y el egreso 443 |
| El contenedor `backend` reinicia con `Configuración inválida` | `AI_AUTH_MODE=disabled` en producción | Usar `AI_AUTH_MODE=supabase` |
| `tuki-tuki.sslip.io` no carga | sslip.io necesita la IP en el nombre | Usar `tuki-tuki-169-58-151-195.sslip.io` |
| El navegador dice "No seguro" | No hay TLS configurado en el dominio | Activar HTTPS (Let's Encrypt) en Dokploy (§6.1) |
| En el móvil sale `404 page not found` y en computadora carga | El móvil fuerza HTTPS y Traefik no tiene router en 443 | Activar HTTPS y la redirección en Dokploy (§6.1) |
| `git push` falla con "Could not connect to server" | Proxy `ALL_PROXY` roto en la sesión | Limpiar `ALL_PROXY`, `HTTP_PROXY` y `HTTPS_PROXY` |
| Varias peticiones seguidas al panel dan `429` | Límite de intentos del login de Dokploy | Esperar unos minutos antes de reintentar |
| El webhook responde `301 Branch Not Match` | Falta `X-GitHub-Event: push` o el `ref` de la rama | Enviar la cabecera y `{"ref":"refs/heads/main"}` (§3) |

## 11. Rollback y mantenimiento

- **Volver a un commit anterior:** `git revert` del commit, push y redesplegar.
  El historial de *Deployments* conserva cada commit desplegado.
- **Reiniciar sin reconstruir:** pestaña *Containers* → acción sobre
  `tuki-backend` o `tuki-frontend`, o botón *Start/Rebuild* del compose.
- **Ver logs:** pestaña *Logs*, seleccionar `tuki-backend`; los errores salen
  como JSON con `event` y `request_id`.
- **Rotar claves:** actualizar la variable en Dokploy y redesplegar. Si cambia
  la `anon key`, hay que reconstruir el frontend (va en el bundle).

## 12. Pendientes

- [ ] Dominio propio con HTTPS para quitar el aviso de sitio no seguro.
- [ ] Evaluar *Autodeploy* con webhook de GitHub una vez estabilizado el flujo.
- [ ] Revisar el proyecto `laboratorio-4`, creado durante el laboratorio, cuyo
      `tareas-api` falló por conflicto de los puertos 5432/5433 del host
      compartido. Es ajeno a Tuki.
- [ ] Repetir el despliegue con los manifiestos de `deploy/k8s` cuando haya un
      clúster disponible, para cerrar la brecha entre lo enseñado y lo desplegado.

## 13. Referencias

- `docker-compose.yml` — definición de los dos servicios.
- `Dockerfile` — build de la SPA y Nginx sin privilegios.
- `services/ai-gateway/Dockerfile` — imagen del gateway.
- `docker/nginx/conf.d/default.conf` — proxy `/api/` y `/healthz`.
- `docs/runbook.md` — diagnóstico del gateway y rotación de secretos.
- `docs/security/modelo-de-amenazas.md` — controles de autenticación.
- `deploy/README.md` — camino Kubernetes/GitOps, aún no usado en este VPS.
