# Laboratorio de fallo inducido

Práctica del **módulo 1**: romper una configuración a propósito, leer el síntoma,
diagnosticar con evidencia y restaurar el servicio. El valor no está en que la
aplicación arranque, sino en saber *por qué* no arranca y cómo se comprueba que
volvió.

Regla del ejercicio: **no se documenta el resultado hasta haberlo reproducido**.
Cada fallo tiene síntoma esperado, causa y comando de verificación.

---

## Fallo 1 — Falta una variable de compilación

**Cómo se induce.** Compila la imagen sin `VITE_SUPABASE_URL`:

```bash
docker build -t riki:fallo .
```

**Síntoma esperado.** El build falla en la etapa `build`, no en runtime:

```text
ERROR: faltan variables de compilación: VITE_SUPABASE_URL
Pásalas con --build-arg o ejecuta: docker compose --env-file .env.local up -d --build
```

**Por qué está bien que falle ahí.** Vite incrusta las variables `VITE_*` en el
bundle. Si el build continúa, la imagen arranca pero no puede autenticar ni leer
datos: el error aparecería en producción y no en el pipeline. El `Dockerfile`
verifica las cuatro variables antes de compilar.

**Diagnóstico.** El mensaje nombra la variable exacta y la alternativa (build
args o Compose). No hace falta leer logs de contenedor porque el contenedor
nunca llegó a existir.

---

## Fallo 2 — Clave de Groq ausente o inválida

**Cómo se induce.** Levanta el stack con `GROQ_API_KEY` vacía:

```bash
GROQ_API_KEY= docker compose --env-file .env.local up -d
```

**Síntoma esperado.**

```bash
curl -i http://localhost:8080/api/healthz
```

- `/api/healthz` responde **200** (el proceso vive, la configuración no).
- `POST /api/v1/ai/chat` responde **503** con un mensaje de servicio no
  configurado, o **502** si Groq rechaza la clave.

**Diagnóstico.**

```bash
docker compose logs --tail=50 ai-gateway | jq 'select(.level=="error")'
```

Los logs son JSON con `request_id`; el campo `event` distingue
`upstream_auth_error` de `upstream_timeout`. Esa diferencia es la que separa un
problema de credenciales de uno de red.

**Restauración.** Exporta la clave y recrea solo el gateway:

```bash
docker compose --env-file .env.local up -d --force-recreate ai-gateway
curl -fsS http://localhost:8080/api/healthz
```

---

## Fallo 3 — Etiqueta de imagen inexistente en Kubernetes

**Cómo se induce.** Cambia el tag del overlay local por uno que no exista:

```bash
kubectl -n riki set image deployment/riki riki=riki:no-existe
```

**Síntoma esperado.** El pod queda en `ImagePullBackOff` y el rollout no avanza.

**Diagnóstico.**

```bash
kubectl -n riki get pods
kubectl -n riki describe pod -l app.kubernetes.io/name=riki | tail -20
kubectl -n riki get events --sort-by=.lastTimestamp | tail -10
```

La cadena de lectura es: estado del pod → evento del kubelet → causa
(`manifest unknown`). En un clúster con ArgoCD y `selfHeal`, además se ve el
drift: el Deployment deja de coincidir con Git y Argo lo marca `OutOfSync`.

**Restauración.**

```bash
kubectl -n riki rollout undo deployment/riki
kubectl -n riki rollout status deployment/riki
```

---

## Fallo 4 — Secreto del gateway sin crear

**Cómo se induce.** Aplica el overlay sin crear `riki-ai-gateway`:

```bash
kubectl apply -k deploy/k8s/base
```

**Síntoma esperado.** El pod del gateway queda en
`CreateContainerConfigError`; el de la SPA arranca pero `/api/*` responde 502.

**Diagnóstico.**

```bash
kubectl -n riki describe pod -l app.kubernetes.io/name=riki-ai-gateway | grep -A3 Events
```

El evento dice `secret "riki-ai-gateway" not found`. Este fallo es intencional en
el diseño: el secreto no vive en Git y el manifiesto solo incluye un
`.example.yaml`.

**Restauración.**

```bash
kubectl create secret generic riki-ai-gateway \
  --from-literal=GROQ_API_KEY="$GROQ_API_KEY" -n riki
kubectl -n riki rollout restart deployment/riki-ai-gateway
```

---

## Matriz de evidencia

| Fallo | Capa | Señal observada | Comando de cierre |
| --- | --- | --- | --- |
| 1. Variable de build | Imagen | build abortado con nombre de variable | `docker build` exitoso con args |
| 2. Clave de IA | Aplicación | `/api/healthz` 200, chat 503 | `curl` 200 al chat |
| 3. Tag inexistente | Kubernetes | `ImagePullBackOff` | `kubectl rollout status` |
| 4. Secreto ausente | Kubernetes | `CreateContainerConfigError` | pod `Running` y `/api/healthz` 200 |

## Qué evalúa el laboratorio

- Distinguir **fallo de build**, **fallo de configuración** y **fallo de
  runtime**: son tres capas distintas y se diagnostican con herramientas
  distintas.
- Leer la señal correcta sin adivinar: el evento del pod antes que el log de la
  aplicación.
- Restaurar sin editar el clúster a mano cuando el estado deseado está en Git:
  el rollback vuelve a la revisión anterior, no a un arreglo manual que nadie
  registró.
