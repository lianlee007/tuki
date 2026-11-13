# syntax=docker/dockerfile:1.7
FROM node:25-alpine@sha256:bdf2cca6fe3dabd014ea60163eca3f0f7015fbd5c7ee1b0e9ccb4ced6eb02ef4 AS base
RUN corepack enable && corepack prepare pnpm@12.14.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/dominio/package.json packages/dominio/
COPY packages/observabilidad-node/package.json packages/observabilidad-node/
COPY services/restaurantes-service/package.json services/restaurantes-service/
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --filter restaurantes-service... --frozen-lockfile

FROM deps AS build
COPY tsconfig.base.json ./
COPY packages/dominio packages/dominio
COPY packages/observabilidad-node packages/observabilidad-node
COPY services/restaurantes-service services/restaurantes-service
RUN pnpm --filter restaurantes-service... build \
    && pnpm --filter restaurantes-service deploy --prod /app/deploy

FROM node:25-alpine@sha256:bdf2cca6fe3dabd014ea60163eca3f0f7015fbd5c7ee1b0e9ccb4ced6eb02ef4 AS runtime
WORKDIR /app
ENV NODE_ENV=production

# El runtime solo necesita `node`. npm y corepack añaden superficie de ataque y
# arrastran vulnerabilidades de herramientas que no se ejecutan en producción.
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx \
    /usr/local/lib/node_modules/corepack /usr/local/bin/corepack

COPY --from=build /app/deploy/package.json ./
COPY --from=build /app/deploy/node_modules ./node_modules
COPY --from=build /app/deploy/dist ./dist
COPY --from=build /app/services/restaurantes-service/db ./db
USER node
EXPOSE 3002
CMD ["node", "--import", "./dist/telemetria.js", "dist/servidor.js"]
