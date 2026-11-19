#!/usr/bin/env bash
# =============================================================================
# Demo reproducible del módulo 2 (Kubernetes, GitOps y Platform Engineering).
#
# Instala en un clúster de laboratorio lo que el overlay no puede traer:
# metrics-server (para el HPA), ingress-nginx (para el Ingress) y ArgoCD
# (para GitOps). Después despliega Tuki y verifica cada pieza.
#
# Uso:
#   bash deploy/scripts/demo-plataforma.sh plataforma   # prerequisitos
#   bash deploy/scripts/demo-plataforma.sh app          # imágenes + overlays
#   bash deploy/scripts/demo-plataforma.sh verificar    # evidencias
#   bash deploy/scripts/demo-plataforma.sh drift        # deriva + selfHeal
#   bash deploy/scripts/demo-plataforma.sh rollback     # vuelta a la versión previa
#
# Variables:
#   KUBE_CONTEXT   contexto de kubectl (por defecto docker-desktop)
#   TUKI_TAG       tag local de las imágenes (por defecto local-0.3.0)
# =============================================================================
set -euo pipefail

CONTEXT="${KUBE_CONTEXT:-docker-desktop}"
TAG="${TUKI_TAG:-local-0.3.0}"
NS="tuki"
ARGO_NS="argocd"

kube() { kubectl --context "${CONTEXT}" "$@"; }

instalar_plataforma() {
  echo "== metrics-server (HPA) =="
  kube apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
  # En kind y Docker Desktop el certificado del kubelet es autofirmado.
  kube -n kube-system patch deployment metrics-server --type=json \
    -p '[{"op":"add","path":"/spec/template/spec/containers/0/args/-","value":"--kubelet-insecure-tls"}]' \
    --dry-run=client -o yaml | kube apply -f -

  echo "== ingress-nginx (Ingress) =="
  kube apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml

  echo "== ArgoCD (GitOps) =="
  kube create namespace "${ARGO_NS}" --dry-run=client -o yaml | kube apply -f -
  kube apply -n "${ARGO_NS}" -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

  echo "== Esperando controladores =="
  kube -n kube-system rollout status deployment/metrics-server --timeout=180s
  kube -n ingress-nginx rollout status deployment/ingress-nginx-controller --timeout=180s
  kube -n "${ARGO_NS}" rollout status deployment/argocd-server --timeout=300s
  kube get apiservice v1beta1.metrics.k8s.io
}

construir_imagenes() {
  echo "== Imágenes locales =="
  docker build -t "tuki:${TAG}" .
  docker build -t "tuki-ai-gateway:${TAG}" services/ai-gateway
  docker build -t "tuki-vision:${TAG}" services/vision-service

  if kube config current-context | grep -q '^kind-'; then
    local cluster
    cluster="$(kube config current-context | sed 's/^kind-//')"
    kind load docker-image "tuki:${TAG}" --name "${cluster}"
    kind load docker-image "tuki-ai-gateway:${TAG}" --name "${cluster}"
    kind load docker-image "tuki-vision:${TAG}" --name "${cluster}"
  fi
}

desplegar_app() {
  echo "== Overlay local con plataforma =="
  kube apply -k deploy/k8s/overlays/local-plataforma
  kube -n "${NS}" rollout status deployment/tuki --timeout=180s
  kube -n "${NS}" rollout status deployment/tuki-ai-gateway --timeout=180s
  kube -n "${NS}" rollout status deployment/tuki-vision --timeout=180s
  kube -n "${NS}" get pods,svc,ingress,hpa
}

verificar() {
  echo "== Nodos y métricas (habilita el HPA) =="
  kube top nodes || true

  echo "== Ingress =="
  kube -n "${NS}" get ingress
  local ip
  ip="$(kube -n "${NS}" get ingress tuki -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || true)"
  echo "Dirección del Ingress: ${ip:-pendiente de controlador}"
  if [ -n "${ip}" ]; then
    curl -fsS -o /dev/null -w 'GET / -> HTTP %{http_code}\n' "http://${ip}/" || true
    curl -fsS -o /dev/null -w 'GET /api/healthz -> HTTP %{http_code}\n' "http://${ip}/api/healthz" || true
  fi

  echo "== HPA =="
  kube -n "${NS}" get hpa
  kube -n "${NS}" describe hpa tuki | sed -n '/Metrics/,$p' || true

  echo "== ArgoCD =="
  kube -n "${ARGO_NS}" get applications || echo "Sin Applications: aplica deploy/argocd/application-local.yaml"
}

drift() {
  echo "== Deriva controlada =="
  if ! kube -n "${ARGO_NS}" get application tuki-local >/dev/null 2>&1; then
    echo "Falta la Application tuki-local. Aplica primero deploy/argocd/application-local.yaml"
    exit 1
  fi
  echo "Se cambian las réplicas a mano (fuera de Git)..."
  kube -n "${NS}" scale deployment/tuki --replicas=3
  sleep 5
  kube -n "${ARGO_NS}" get application tuki-local -o jsonpath='{.status.sync.status}{"\n"}'
  echo "Con selfHeal activo, ArgoCD vuelve al estado declarado en Git."
  sleep 30
  kube -n "${NS}" get deployment tuki -o jsonpath='réplicas actuales: {.spec.replicas}{"\n"}'
}

rollback() {
  echo "== Rollback de la aplicación =="
  kube -n "${NS}" rollout history deployment/tuki
  kube -n "${NS}" rollout undo deployment/tuki
  kube -n "${NS}" rollout status deployment/tuki --timeout=120s
  echo "== Rollback de ArgoCD =="
  kube -n "${ARGO_NS}" get application tuki-local -o jsonpath='{.status.sync.revision}{"\n"}' || true
}

case "${1:-}" in
  plataforma) instalar_plataforma ;;
  app) construir_imagenes && desplegar_app ;;
  verificar) verificar ;;
  drift) drift ;;
  rollback) rollback ;;
  *)
    echo "Uso: $0 {plataforma|app|verificar|drift|rollback}"
    exit 2
    ;;
esac
