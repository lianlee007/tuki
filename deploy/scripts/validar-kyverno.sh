#!/usr/bin/env bash
# Comprueba que las políticas de admisión de Kyverno hacen lo que dicen:
# el pod conforme pasa y el pod inseguro se rechaza. No necesita clúster,
# solo Docker: usa la CLI oficial de Kyverno.
#
# Uso:
#   bash deploy/scripts/validar-kyverno.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

if command -v cygpath >/dev/null 2>&1; then
  HOST_PWD="$(cygpath -m "$PWD")"
  export MSYS_NO_PATHCONV=1
else
  HOST_PWD="$PWD"
fi

IMAGEN="ghcr.io/kyverno/kyverno-cli:latest"
POLITICAS="deploy/security/kyverno"
TESTS="$POLITICAS/tests"

kyverno() {
  docker run --rm -v "$HOST_PWD:/work" -w /work "$IMAGEN" "$@"
}

echo "==> Pod conforme: debe cumplir la línea base"
if ! kyverno apply "$POLITICAS/linea-base-pods.yaml" --resource "$TESTS/pod-conforme.yaml"; then
  echo "FALLO: el pod conforme fue rechazado" >&2
  exit 1
fi

echo "==> Pod inseguro: debe ser rechazado"
if kyverno apply "$POLITICAS/linea-base-pods.yaml" --resource "$TESTS/pod-no-conforme.yaml"; then
  echo "FALLO: el pod inseguro fue aceptado" >&2
  exit 1
fi

echo "==> Firma: una imagen sin digest no debe pasar"
if kyverno apply "$POLITICAS/verificar-firmas.yaml" --resource "$TESTS/pod-conforme.yaml"; then
  echo "FALLO: se aceptó una imagen sin digest firmado" >&2
  exit 1
fi

echo "OK: las políticas de admisión se comportan como se espera"
