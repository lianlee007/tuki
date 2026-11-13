# syntax=docker/dockerfile:1.7
FROM node:22-alpine@sha256:1314fb30ec37592d5845e5a160d522c0e680972aa534549940b8d73bde88481a AS base
RUN corepack enable && corepack prepare pnpm@12.14.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/dominio/package.json packages/dominio/
COPY packages/observabilidad-node/package.json packages/observabilidad-node/
COPY services/media-service/package.json services/media-service/
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --filter media-service... --frozen-lockfile

FROM deps AS build
COPY tsconfig.base.json ./
COPY packages/dominio packages/dominio
COPY packages/observabilidad-node packages/observabilidad-node
COPY services/media-service services/media-service
RUN pnpm --filter media-service... build \
    && pnpm --filter media-service deploy --prod /app/deploy

FROM node:22-alpine@sha256:1314fb30ec37592d5845e5a160d522c0e680972aa534549940b8d73bde88481a AS runtime
WORKDIR /app
ENV NODE_ENV=production

# El runtime solo necesita `node`. npm y corepack añaden superficie de ataque y
# arrastran vulnerabilidades de herramientas que no se ejecutan en producción.
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx \
    /usr/local/lib/node_modules/corepack /usr/local/bin/corepack

COPY --from=build /app/deploy/package.json ./
COPY --from=build /app/deploy/node_modules ./node_modules
COPY --from=build /app/deploy/dist ./dist
COPY --from=build /app/services/media-service/db ./db
USER node
EXPOSE 3003
CMD ["node", "--import", "./dist/telemetria.js", "dist/servidor.js"]
