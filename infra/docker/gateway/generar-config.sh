#!/bin/sh
# Genera el config.js de tiempo de ejecución para los frontends locales.
# El entrypoint de nginx ejecuta este archivo antes de arrancar el servidor.
set -eu

: "${TUKI_API_URL:?TUKI_API_URL es obligatoria}"

cat > /usr/share/nginx/html/config.js <<EOF
window.__TUKI_CONFIG__ = {
  identidad: '${TUKI_API_URL}',
  restaurantes: '${TUKI_API_URL}',
  media: '${TUKI_API_URL}',
  pedidos: '${TUKI_API_URL}',
  resenas: '${TUKI_API_URL}',
  admin: '${TUKI_API_URL}',
  adminPanel: '${TUKI_ADMIN_PANEL_URL:-http://localhost:8083}',
  panel: '${TUKI_PANEL_URL:-http://localhost:8082}',
  web: '${TUKI_WEB_URL:-http://localhost:8081}',
  comensal: '${TUKI_WEB_URL:-http://localhost:8081}',
  ai: '${TUKI_API_URL}'
};
EOF
