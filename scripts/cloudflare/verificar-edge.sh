#!/usr/bin/env bash
# Comprueba que la capa edge de Cloudflare está delante y aplicando reglas.
#
# Uso:
#   bash scripts/cloudflare/verificar-edge.sh https://tuki.app
#
# Sale con código 1 si falta la cabecera de Cloudflare o si la API se cachea.
set -euo pipefail

BASE="${1:-https://tuki.app}"
BASE="${BASE%/}"
fallos=0

comprobar() {
  local nombre="$1" esperado="$2" valor="$3"
  if [[ "$valor" == *"$esperado"* ]]; then
    echo "[OK]   $nombre"
  else
    echo "[FALLA] $nombre (esperaba '$esperado', obtuve '$valor')"
    fallos=$((fallos + 1))
  fi
}

cabeceras_home=$(curl -sSI "$BASE/" | tr -d '\r')
comprobar "Cloudflare delante (cf-ray)" "cf-ray" "$cabeceras_home"

cabeceras_api=$(curl -sSI "$BASE/api/healthz" | tr -d '\r')
comprobar "API sin caché" "cf-cache-status: DYNAMIC" "$cabeceras_api"

# Un asset real: se toma el primero que anuncie el index.
asset=$(curl -sS "$BASE/" | grep -oE '/assets/[^" ]+\.(js|css)' | head -n1 || true)
if [[ -n "$asset" ]]; then
  cabeceras_asset=$(curl -sSI "$BASE$asset" | tr -d '\r')
  comprobar "Asset cacheado en el edge" "cf-cache-status: HIT" "$cabeceras_asset"
fi

codigo=$(curl -sS -o /dev/null -w '%{http_code}' -X PUT "$BASE/api/healthz")
if [[ "$codigo" == "403" || "$codigo" == "405" ]]; then
  echo "[OK]   Método no permitido bloqueado ($codigo)"
else
  echo "[FALLA] PUT /api/healthz devolvió $codigo (esperaba 403 de Cloudflare)"
  fallos=$((fallos + 1))
fi

echo
if [[ "$fallos" -eq 0 ]]; then
  echo "Edge verificado."
else
  echo "$fallos comprobaciones fallaron."
  exit 1
fi
