# syntax=docker/dockerfile:1.7
FROM node:26-alpine@sha256:6bd9ab43c0ec0190ca7b2d193906cb8b7edf6e7f4afa43ddeccd6452710bffb5 AS base
RUN corepack enable && corepack prepare pnpm@12.14.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/dominio/package.json packages/dominio/
COPY packages/observabilidad-node/package.json packages/observabilidad-node/
COPY services/pedidos-service/package.json services/pedidos-service/
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --filter pedidos-service... --frozen-lockfile

FROM deps AS build
COPY tsconfig.base.json ./
COPY packages/dominio packages/dominio
COPY packages/observabilidad-node packages/observabilidad-node
COPY services/pedidos-service services/pedidos-service
RUN pnpm --filter pedidos-service... build \
    && pnpm --filter pedidos-service deploy --prod /app/deploy

FROM node:26-alpine@sha256:6bd9ab43c0ec0190ca7b2d193906cb8b7edf6e7f4afa43ddeccd6452710bffb5 AS runtime
WORKDIR /app
ENV NODE_ENV=production

# El runtime solo necesita `node`. npm y corepack añaden superficie de ataque y
# arrastran vulnerabilidades de herramientas que no se ejecutan en producción.
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx \
    /usr/local/lib/node_modules/corepack /usr/local/bin/corepack

COPY --from=build /app/deploy/package.json ./
COPY --from=build /app/deploy/node_modules ./node_modules
COPY --from=build /app/deploy/dist ./dist
COPY --from=build /app/services/pedidos-service/db ./db
USER node
EXPOSE 3004
CMD ["node", "--import", "./dist/telemetria.js", "dist/servidor.js"]
