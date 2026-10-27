#!/usr/bin/env bash
# Ejecuta la parte local de la Fase 0: hadolint, Trivy, Syft y (opcional)
# Cosign. No publica nada.
#
# Uso:
#   bash deploy/scripts/verificar-supply-chain.sh
#   WEB_IMAGE=tuki:local-0.2.0 GATEWAY_IMAGE=tuki-ai-gateway:local-0.2.0 \
#     bash deploy/scripts/verificar-supply-chain.sh
#
# Para firmar en local necesitas una clave Cosign:
#   COSIGN_KEY=cosign.key FIRMAR=true bash deploy/scripts/verificar-supply-chain.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

WEB_IMAGE="${WEB_IMAGE:-tuki:local-0.2.0}"
GATEWAY_IMAGE="${GATEWAY_IMAGE:-tuki-ai-gateway:local-0.2.0}"
OUT="build/supply-chain"
mkdir -p "$OUT"

echo "==> hadolint"
docker run --rm --entrypoint hadolint \
  -v "$PWD:/work" -w /work hadolint/hadolint:latest \
  Dockerfile services/ai-gateway/Dockerfile

echo "==> Trivy (CRITICAL/HIGH, solo vulnerabilidades corregibles)"
for image in "$WEB_IMAGE" "$GATEWAY_IMAGE"; do
  name="$(echo "$image" | tr '/:' '__')"
  docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
    -v "$PWD/$OUT:/out" \
    aquasec/trivy:latest image \
    --severity HIGH,CRITICAL --ignore-unfixed --exit-code 1 \
    --format table --output "/out/trivy-$name.txt" "$image"
  echo "   $OUT/trivy-$name.txt"
done

echo "==> Syft (SBOM SPDX)"
for image in "$WEB_IMAGE" "$GATEWAY_IMAGE"; do
  name="$(echo "$image" | tr '/:' '__')"
  docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
    -v "$PWD/$OUT:/out" \
    anchore/syft:latest "$image" -o "spdx-json=/out/sbom-$name.spdx.json"
  echo "   $OUT/sbom-$name.spdx.json"
done

if [ "${FIRMAR:-false}" = "true" ]; then
  if [ -z "${COSIGN_KEY:-}" ]; then
    echo "ERROR: define COSIGN_KEY (ruta a cosign.key) para firmar" >&2
    exit 1
  fi
  echo "==> Cosign (firma con clave local)"
  docker run --rm -v "$PWD:/work" -w /work \
    -e COSIGN_PASSWORD="${COSIGN_PASSWORD:-}" \
    gcr.io/projectsigstore/cosign:v2.4.3 \
    sign --key "/work/$COSIGN_KEY" --yes "$WEB_IMAGE" "$GATEWAY_IMAGE"
else
  echo "==> Cosign omitido (usa FIRMAR=true COSIGN_KEY=cosign.key para firmar)"
fi

echo "OK: supply chain local"
