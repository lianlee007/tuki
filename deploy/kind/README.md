# Clúster local de Tuki con kind

Alternativa reproducible a Docker Desktop para el módulo 2. Crea un clúster de
tres nodos, carga las imágenes locales y aplica el overlay `local`.

> **Estado:** configuración incluida y validada por esquema. En el entorno de
> referencia no se ejecutó `kind`; las pruebas de runtime se hicieron con Docker
> Desktop. Los comandos de este documento son los que deben reproducirse en una
> estación con `kind` instalado.

---

## 1. Requisitos

- Docker Engine o Docker Desktop en ejecución.
- `kind` 0.20 o superior.
- `kubectl` 1.27 o superior.
- Al menos 4 GB de RAM libres y 10 GB de disco.
- Las variables de build de la SPA (`VITE_SUPABASE_*`, `VITE_CLOUDINARY_*`).

En Windows, ejecuta los comandos desde WSL o Git Bash.

---

## 2. Crear el clúster

```bash
kind create cluster --config deploy/kind/cluster.yaml
kubectl cluster-info --context kind-tuki
kubectl get nodes
```

Resultado esperado: un `control-plane` y dos `worker` en estado `Ready`.

Si el equipo tiene poca memoria:

```bash
# Edita cluster.yaml y deja solo el control-plane y un worker antes de crear.
kind delete cluster --name tuki
kind create cluster --config deploy/kind/cluster.yaml
```

---

## 3. Construir y cargar las imágenes

Las imágenes no se publican en un registro para el clúster local: se cargan
directamente en los nodos de kind.

```bash
docker build \
  --build-arg VITE_SUPABASE_URL="$VITE_SUPABASE_URL" \
  --build-arg VITE_SUPABASE_ANON_KEY="$VITE_SUPABASE_ANON_KEY" \
  --build-arg VITE_CLOUDINARY_CLOUD_NAME="$VITE_CLOUDINARY_CLOUD_NAME" \
  --build-arg VITE_CLOUDINARY_UPLOAD_PRESET="$VITE_CLOUDINARY_UPLOAD_PRESET" \
  --build-arg VITE_AI_GATEWAY_URL=/api \
  -t tuki:local-0.2.0 .

docker build -t tuki-ai-gateway:local-0.2.0 services/ai-gateway

kind load docker-image tuki:local-0.2.0 --name tuki
kind load docker-image tuki-ai-gateway:local-0.2.0 --name tuki
```

Comprueba que los nodos ven las imágenes:

```bash
docker exec -it tuki-control-plane crictl images | grep tuki
```

---

## 4. Crear el namespace y el secreto

El manifiesto del overlay crea el namespace, pero el secreto se crea aparte para
no versionar la clave.

```bash
kubectl create namespace tuki --dry-run=client -o yaml | kubectl apply -f -
kubectl create secret generic tuki-ai-gateway \
  --from-literal=GROQ_API_KEY="$GROQ_API_KEY" \
  -n tuki
```

Si el secreto ya existe y cambiaste la clave:

```bash
kubectl delete secret tuki-ai-gateway -n tuki
kubectl create secret generic tuki-ai-gateway \
  --from-literal=GROQ_API_KEY="$GROQ_API_KEY" \
  -n tuki
kubectl rollout restart deployment/tuki-ai-gateway -n tuki
```

---

## 5. Desplegar el overlay local

```bash
kubectl apply -k deploy/k8s/overlays/local
kubectl rollout status deployment/tuki -n tuki
kubectl rollout status deployment/tuki-ai-gateway -n tuki
kubectl get pods,svc -n tuki -o wide
```

El overlay local:

- usa `tuki:local-0.2.0` y `tuki-ai-gateway:local-0.2.0`;
- deja los Services como `ClusterIP`;
- elimina Ingress, HPA, PDB y NetworkPolicy;
- desactiva la validación JWT (`AI_AUTH_MODE=disabled`).

No expongas este clúster a Internet: el modo `disabled` es solo para laboratorio.

---

## 6. Acceder a la aplicación

```bash
# Terminal 1: SPA y proxy /api
kubectl port-forward -n tuki svc/tuki 8081:80

# Terminal 2: gateway directo (opcional)
kubectl port-forward -n tuki svc/backend 8002:8000

# Terminal 3: métricas de Nginx (opcional)
kubectl port-forward -n tuki svc/tuki 9114:9113
```

Comprobaciones:

```bash
curl -i http://localhost:8081/healthz
curl -i http://localhost:8081/api/healthz
curl -s http://localhost:8081/api/v1/ai/models
curl -s http://localhost:8081/api/v1/ai/chat \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"Devuelve exactamente: hola"}'
```

Resultado esperado: `200` en salud y modelos, y una respuesta JSON con
`content`, `model` y `request_id` en el chat.

---

## 7. Probar Ingress (opcional)

El clúster de este repositorio no publica los puertos 80/443 en el host. Para
probar el Ingress:

1. Añade `extraPortMappings` al nodo `control-plane`:

   ```yaml
   extraPortMappings:
     - containerPort: 80
       hostPort: 8080
       protocol: TCP
     - containerPort: 443
       hostPort: 8443
       protocol: TCP
   ```

2. Recrea el clúster y vuelve a cargar las imágenes.
3. Instala ingress-nginx para kind:

   ```bash
   kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
   kubectl wait --namespace ingress-nginx \
     --for=condition=Ready pod \
     --selector=app.kubernetes.io/component=controller \
     --timeout=180s
   ```

4. Usa el overlay de producción con imágenes locales o añade un Ingress de
   prueba. El overlay local elimina el Ingress a propósito.

> En kind, el CNI por defecto no aplica NetworkPolicy de forma fiable. Si
> necesitas probarlas, instala Calico u otro CNI compatible. El overlay local las
> elimina y el de producción las conserva.

---

## 8. HPA y métricas (opcional)

El overlay local elimina el HPA. Para probarlo:

```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
kubectl top nodes
```

En kind, metrics-server puede necesitar `--kubelet-insecure-tls`. Es una prueba
de laboratorio, no una configuración de producción.

---

## 9. Diagnóstico

| Síntoma | Causa probable | Solución |
| --- | --- | --- |
| `ImagePullBackOff` | La imagen no se cargó en los nodos | `kind load docker-image ... --name tuki` |
| `CrashLoopBackOff` en el gateway | Falta el secreto o la clave está vacía | Revisa `kubectl logs` y recrea el secreto |
| `/api` devuelve 502 | El gateway no está Ready | `kubectl describe pod -n tuki -l app.kubernetes.io/name=tuki-ai-gateway` |
| El pod sigue con la configuración vieja | Tag reutilizado | Usa un tag nuevo y vuelve a cargar |
| No hay Ingress | El overlay local lo elimina | Usa port-forward o el overlay de producción |
| NetworkPolicy no bloquea | CNI sin soporte | Instala Calico o prueba en un clúster real |

---

## 10. Eliminar el clúster

```bash
kind delete cluster --name tuki
```

Esto borra el clúster y sus volúmenes. No borra las imágenes de Docker locales ni
el repositorio.

---

## 11. Referencias

- `deploy/k8s/overlays/local/kustomization.yaml`
- `deploy/README.md` §7
- `docs/modulos-1-3.md` §4
- `docs/runbook.md`
