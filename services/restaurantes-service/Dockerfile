# syntax=docker/dockerfile:1.7
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@12.14.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/dominio/package.json packages/dominio/
COPY services/restaurantes-service/package.json services/restaurantes-service/
RUN pnpm install --filter restaurantes-service... --frozen-lockfile

FROM deps AS build
COPY tsconfig.base.json ./
COPY packages/dominio packages/dominio
COPY services/restaurantes-service services/restaurantes-service
RUN pnpm --filter restaurantes-service build \
    && pnpm --filter restaurantes-service deploy --prod /app/deploy

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/deploy ./
COPY --from=build /app/services/restaurantes-service/db ./db
USER node
EXPOSE 3002
CMD ["node", "dist/servidor.js"]
