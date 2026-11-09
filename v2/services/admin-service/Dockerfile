# syntax=docker/dockerfile:1.7
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@12.14.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/dominio/package.json packages/dominio/
COPY services/admin-service/package.json services/admin-service/
RUN pnpm install --filter admin-service... --frozen-lockfile

FROM deps AS build
COPY tsconfig.base.json ./
COPY packages/dominio packages/dominio
COPY services/admin-service services/admin-service
RUN pnpm --filter admin-service build \
    && pnpm --filter admin-service deploy --prod /app/deploy

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/deploy ./
COPY --from=build /app/services/admin-service/db ./db
USER node
EXPOSE 3006
CMD ["node", "dist/servidor.js"]
