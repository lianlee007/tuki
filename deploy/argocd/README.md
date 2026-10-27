# GitOps con ArgoCD

Las dos `Application` apuntan al mismo repositorio y a overlays distintos:

| Aplicación | Overlay | Sync | Uso |
| --- | --- | --- | --- |
| `tuki-local` | `deploy/k8s/overlays/local` | Manual | Docker Desktop / kind / k3d |
| `tuki-production` | `deploy/k8s/overlays/production` | Automático | Clúster real |

## Requisitos

- ArgoCD instalado en el namespace `argocd`.
- El repositorio accesible desde ArgoCD (público o con credenciales).
- El secreto `tuki-ai-gateway` creado en el namespace `tuki` **antes** del
  primer sync (o gestionado con Sealed Secrets / External Secrets).
- En producción, `SUPABASE_URL` del overlay reemplazada por la real. El gateway
  falla al arrancar si detecta el placeholder.

## Aplicar

```bash
kubectl apply -f deploy/argocd/application-local.yaml
# o
kubectl apply -f deploy/argocd/application-production.yaml

argocd app get tuki-production
argocd app sync tuki-local
argocd app history tuki-production
argocd app rollback tuki-production <ID>
```

## Notas

- `ignoreDifferences` evita que ArgoCD revierta las réplicas que decide el HPA.
- `selfHeal` y `prune` están activos solo en producción.
- Para promover una versión, cambia `newTag` en
  `deploy/k8s/overlays/production/kustomization.yaml` y haz commit. ArgoCD
  sincroniza sola.
- Si usas imágenes privadas de GHCR, crea `imagePullSecrets` y añádelo a los
  Deployments (ver `deploy/README.md`).
