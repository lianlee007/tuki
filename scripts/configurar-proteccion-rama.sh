#!/usr/bin/env bash
# Activa la protección de la rama main en GitHub.
#
# Requiere la CLI de GitHub autenticada con permisos de administración:
#   gh auth login
#   gh auth status
#
# Uso:
#   bash scripts/configurar-proteccion-rama.sh
#   REPO=dueno/repositorio RAMA=main bash scripts/configurar-proteccion-rama.sh
#
# Deja main con: PR obligatorio, una revisión, checks del pipeline en verde,
# historial lineal, sin force push y sin borrado.
set -euo pipefail

if ! command -v gh >/dev/null 2>&1; then
  echo "Falta la CLI de GitHub. Instálala con: winget install --id GitHub.cli" >&2
  exit 2
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "La CLI no está autenticada. Ejecuta: gh auth login" >&2
  exit 2
fi

REPO="${REPO:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}"
RAMA="${RAMA:-main}"

# Nombres exactos de los jobs de .github/workflows/contenedor.yml.
CHECKS=(
  "Web · build y Dockerfile"
  "Gateway · tests y lint"
  "Dependencias · pip-audit + pnpm audit"
  "Secretos · gitleaks"
  "Kubernetes · kubeconform + kube-linter + conftest"
  "Catálogo · Backstage YAML"
  "Workflows · actionlint + shellcheck"
  "Web · imagen, SBOM, escaneo y firma"
  "Gateway · imagen, SBOM, escaneo y firma"
)

json_checks="$(printf '%s\n' "${CHECKS[@]}" | sed 's/.*/"&"/' | paste -sd, -)"

CUERPO="$(mktemp)"
cat > "$CUERPO" <<JSON
{
  "required_status_checks": {
    "strict": true,
    "contexts": [$json_checks]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": true
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_linear_history": true,
  "required_conversation_resolution": true
}
JSON

echo "==> Protegiendo $RAMA en $REPO"
gh api -X PUT "repos/$REPO/branches/$RAMA/protection" --input "$CUERPO" >/dev/null
rm -f "$CUERPO"

echo "==> Estado"
gh api "repos/$REPO/branches/$RAMA/protection" \
  --jq '{checks: .required_status_checks.contexts, revisiones: .required_pull_request_reviews.required_approving_review_count, force_push: .allow_force_pushes.enabled}'
echo "OK: protección aplicada"
