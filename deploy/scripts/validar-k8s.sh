#!/usr/bin/env bash
# Valida los manifiestos de Riki igual que la CI, usando Docker para no
# instalar binarios en la máquina.
#
# Uso:
#   bash deploy/scripts/validar-k8s.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

OUT="build"
mkdir -p "$OUT"

echo "==> Renderizando overlays con Kustomize"
kubectl kustomize deploy/k8s/overlays/local > "$OUT/local.yaml"
kubectl kustomize deploy/k8s/overlays/local-plataforma > "$OUT/local-plataforma.yaml"
kubectl kustomize deploy/k8s/overlays/production > "$OUT/production.yaml"
kubectl kustomize deploy/observability > "$OUT/observability.yaml"

echo "==> kubeconform"
docker run --rm -v "$PWD:/work" -w /work \
  ghcr.io/yannh/kubeconform:latest \
  -strict -summary \
  -skip ServiceMonitor,PrometheusRule \
  "$OUT/local.yaml" "$OUT/local-plataforma.yaml" "$OUT/production.yaml" "$OUT/observability.yaml"

docker run --rm -v "$PWD:/work" -w /work \
  ghcr.io/yannh/kubeconform:latest \
  -strict -summary -skip Application \
  deploy/argocd/application-local.yaml \
  deploy/argocd/application-production.yaml

echo "==> kube-linter"
docker run --rm -v "$PWD:/work" -w /work \
  stackrox/kube-linter:v0.8.3 \
  lint "$OUT/local.yaml" "$OUT/production.yaml"

echo "==> conftest"
docker run --rm -v "$PWD:/work" -w /work \
  openpolicyagent/conftest:v0.56.0 \
  test -p deploy/policies "$OUT/local.yaml" "$OUT/production.yaml"

echo "OK: manifiestos válidos"
