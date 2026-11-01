# syntax=docker/dockerfile:1.7
# =============================================================================
# Tuki — imagen de producción para una SPA de Vite servida por Nginx.
#
# Etapas:
#   deps    -> instala dependencias con el lockfile congelado.
#   build   -> compila con Vite (las variables VITE_* se incrustan en el bundle).
#   runtime -> Nginx sin privilegios (UID/GID 101), rootfs de solo lectura.
#
# Importante: Vite resuelve las variables VITE_* en tiempo de compilación, por
# eso se pasan como build-args y NO como variables de entorno del contenedor.
# =============================================================================

ARG NODE_IMAGE=node:22-alpine@sha256:fe4f6d74e20370acb04ad889077d14d0f64a9c8ea6a42bc60cddf1e844699914
ARG PNPM_VERSION=12.14.0
ARG NGINX_IMAGE=nginxinc/nginx-unprivileged:1.31.7-alpine@sha256:b5047b9b76845eac124358373c6852377c52e4b05834a47647e955dd91cb8f1e

# -----------------------------------------------------------------------------
# Dependencias
# -----------------------------------------------------------------------------
# La imagen base viene de un ARG con la etiqueta y el digest fijados arriba;
# hadolint no puede verificarlo y avisa con DL3006.
# hadolint ignore=DL3006
FROM ${NODE_IMAGE} AS base

ARG PNPM_VERSION
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    CI=true

RUN corepack enable \
    && corepack prepare pnpm@${PNPM_VERSION} --activate

WORKDIR /app

FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --prefer-offline --store-dir /pnpm/store

# -----------------------------------------------------------------------------
# Build
# -----------------------------------------------------------------------------
FROM deps AS build

ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_AI_GATEWAY_URL=/api

ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL} \
    VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY} \
    VITE_AI_GATEWAY_URL=${VITE_AI_GATEWAY_URL}

# Fallar temprano si falta configuración: un bundle sin Supabase arranca pero
# no puede autenticar ni cargar datos, y el error aparecería en producción.
# La IA ya no necesita clave en el cliente: la inyecta el AI Gateway.
RUN set -eu; \
    faltantes=""; \
    for variable in \
        VITE_SUPABASE_URL \
        VITE_SUPABASE_ANON_KEY; do \
        eval "valor=\$$variable"; \
        if [ -z "$valor" ]; then faltantes="$faltantes $variable"; fi; \
    done; \
    if [ -n "$faltantes" ]; then \
        echo "ERROR: faltan variables de compilación:$faltantes" >&2; \
        echo "Pásalas con --build-arg o ejecuta: docker compose --env-file .env.local up -d --build" >&2; \
        exit 1; \
    fi

COPY . .

RUN pnpm build

# -----------------------------------------------------------------------------
# Runtime
# -----------------------------------------------------------------------------
# hadolint ignore=DL3006
FROM ${NGINX_IMAGE} AS runtime

ARG VERSION=0.0.0-dev
ARG REVISION=unknown

LABEL org.opencontainers.image.title="Tuki" \
      org.opencontainers.image.description="Constructor de menús digitales para restaurantes (SPA estática)" \
      org.opencontainers.image.vendor="Tuki" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.revision="${REVISION}" \
      org.opencontainers.image.licenses="Propietaria"

ENV NGINX_ENTRYPOINT_QUIET_LOGS=1

COPY docker/nginx/nginx.conf /etc/nginx/nginx.conf
COPY docker/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf
COPY docker/nginx/snippets/security-headers.conf /etc/nginx/snippets/security-headers.conf

# La imagen base trae páginas por defecto (index.html, 50x.html). Se eliminan
# para que el único contenido servido sea el build de Tuki.
# UID 0 numérico: hadolint (DL3066) exige IDs resolubles por el host.
# `apk upgrade` aplica los parches de seguridad de Alpine publicados después
# de la imagen base. Se ejecuta solo en la etapa runtime y se limpia la caché.
USER 0
RUN apk upgrade --no-cache \
    && rm -rf /usr/share/nginx/html/* \
    && rm -rf /var/cache/apk/*
USER 101:101

COPY --from=build --chown=101:101 /app/dist /usr/share/nginx/html

# La imagen base ya usa UID 101; se declara de forma explícita para que
# Kubernetes y Compose puedan verificar que no se ejecuta como root.
USER 101:101

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD ["wget", "-q", "-O", "/dev/null", "http://127.0.0.1:8080/healthz"]

STOPSIGNAL SIGQUIT

# La configuración es estática: se omite el entrypoint de la imagen base, que
# intenta reescribir archivos en /etc/nginx al arrancar. Así el rootfs puede
# montarse como de solo lectura sin efectos colaterales.
ENTRYPOINT []

CMD ["nginx", "-g", "daemon off;"]
