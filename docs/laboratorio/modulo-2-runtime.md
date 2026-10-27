# Evidencias de runtime — módulo 2

Registro de las comprobaciones hechas sobre un clúster real (Docker Desktop
Kubernetes v1.36.1) el **2026-10-27**, no solo sobre los manifiestos. El PDF del
diplomado evalúa que el estudiante despliegue, observe y recupere un servicio;
este documento es la prueba de que el diseño de `deploy/k8s` funciona cuando hay
controladores instalados.

## 1. Plataforma instalada

El overlay `overlays/local` deja fuera Ingress, HPA y NetworkPolicy porque un
clúster de desarrollo no trae sus controladores. Para la demostración se
instalaron:

| Componente | Versión / origen | Para qué |
| --- | --- | --- |
| metrics-server | manifiesto oficial `latest` con `--kubelet-insecure-tls` | alimentar el HPA |
| ingress-nginx | `deploy/static/provider/cloud` | enrutar `/` y `/api` |
| ArgoCD | manifiesto `stable` | sincronización GitOps |

El guion reproducible es `deploy/scripts/demo-plataforma.sh` (subcomandos
`plataforma`, `app`, `verificar`, `drift`, `rollback`).

## 2. Despliegue

```bash
kubectl apply -k deploy/k8s/overlays/local-plataforma
```

Resultado: dos Deployments con dos réplicas cada uno (el HPA subió de 1 a 2 al
detectar el mínimo declarado), PDB, NetworkPolicy y HPA creados.

```text
NAME                              READY   STATUS    RESTARTS   AGE
tuki-8648c79d96-5wth2             2/2     Running   0          53s
tuki-8648c79d96-clrdc             2/2     Running   0          38s
tuki-ai-gateway-77fb969579-65ts7  1/1     Running   0          53s
tuki-ai-gateway-77fb969579-pt774  1/1     Running   0          38s
```

## 3. HPA con métricas reales

Antes de instalar metrics-server el HPA mostraba `cpu: <unknown>`. Después:

```text
NAME              REFERENCE                    TARGETS     MINPODS   MAXPODS   REPLICAS
tuki              Deployment/tuki              cpu: 5%/70% 2         10        2
tuki-ai-gateway   Deployment/tuki-ai-gateway   cpu: 6%/70% 2         10        2
```

Esto demuestra el lazo completo: métricas del kubelet → metrics-server →
`autoscaling/v2` → escalado de réplicas.

## 4. Ingress enrutando de verdad

El Ingress de producción usa TLS con un certificado externo. El overlay
`local-plataforma` lo sirve por HTTP en `tuki.localhost`:

```text
NAME   CLASS   HOSTS            ADDRESS      PORTS   AGE
tuki   nginx   tuki.localhost   172.18.0.5   80      53s
```

Comprobación a través del controlador (`port-forward` al servicio de
ingress-nginx, cabecera `Host: tuki.localhost`):

```text
GET /healthz      -> 200
GET /api/healthz  -> 200
{"status":"ok","service":"tuki-ai-gateway","version":"1.0.0","environment":"development"}
```

El segundo código confirma que la ruta `/api` llega al AI Gateway y no al
Nginx de la SPA: el Ingress conserva el prefijo y no reescribe, como está
documentado en `deploy/README.md`.

## 5. Endurecimiento observado en el pod, no solo declarado

```text
tuki-8648c79d96-5wth2             uid=101   rootfs=True  allowPrivilegeEscalation=False
tuki-ai-gateway-77fb969579-65ts7  uid=10001 rootfs=True  allowPrivilegeEscalation=False
```

Los procesos no corren como root (UID 101 para Nginx sin privilegios, 10001 para
el gateway), el sistema de archivos raíz es de solo lectura y no hay escalada de
privilegios. Es el mismo contrato que valida conftest en CI, pero verificado en
el API server.

## 6. Disponibilidad y aislamiento

```text
NAME              MIN AVAILABLE   ALLOWED DISRUPTIONS
tuki              1               1
tuki-ai-gateway   1               1

NAME              POD-SELECTOR
tuki-ai-gateway   app.kubernetes.io/name=tuki-ai-gateway
tuki-web          app.kubernetes.io/name=tuki
```

> **Límite honesto:** `kindnet` (el CNI de Docker Desktop) no aplica
> NetworkPolicy. Los objetos están aceptados por el API server y validados por
> esquema, pero el aislamiento efectivo de tráfico solo se puede demostrar en un
> clúster con Calico, Cilium o similar.

## 7. GitOps con ArgoCD

El repositorio es privado y el clúster de laboratorio no tiene credenciales de
GitHub, así que la sincronización se demostró sirviendo **el mismo historial de
Git** con `git daemon` desde el equipo y apuntando la Application a
`git://host.docker.internal:9418/Kiri`. Es una limitación del laboratorio, no del
diseño: en producción se registra el repositorio institucional con un token de
solo lectura.

```text
sync=Synced  health=Healthy  revision=e4629682d0ece385c7b99229c581dcbbdfdb6f05
```

**Deriva corregida.** Se cambió la imagen a mano:

```bash
kubectl -n tuki set image deployment/tuki web=tuki:local-0.2.0-deriva
```

En menos de 30 segundos ArgoCD volvió al valor declarado en Git:

```text
SYNC:  Synced
IMAGE: tuki:local-0.2.0
```

Esto es lo que el módulo 2 pide demostrar: el clúster no se arregla editando
objetos, se arregla corrigiendo Git. `ignoreDifferences` sobre
`/spec/replicas` evita que el HPA y ArgoCD se peleen por el número de réplicas.

**Rollback.** Practicado con `kubectl rollout undo` sobre los Deployments; ArgoCD
conserva cinco revisiones (`revisionHistoryLimit: 5`) para volver a un estado
anterior sin tocar el clúster a mano. El procedimiento completo, con criterios de
decisión, está en `docs/runbook.md`.

## 8. Qué queda pendiente de runtime

| Pendiente | Motivo | Cómo cerrarlo |
| --- | --- | --- |
| Sync contra el repositorio real | El repositorio es privado y el laboratorio no tiene credenciales de Git | Registrar el repo con un token de solo lectura o usar un espejo interno |
| NetworkPolicy efectiva | `kindnet` (CNI de Docker Desktop) no aplica NetworkPolicy | Repetir en kind con Calico o en el clúster institucional |
| Ingress con TLS | Requiere un certificado emitido | cert-manager + Let's Encrypt o el certificado institucional |
| Verificación de firma en admisión | Kyverno no está instalado en este clúster | `kubectl apply -k deploy/security/kyverno` después de instalar Kyverno |

