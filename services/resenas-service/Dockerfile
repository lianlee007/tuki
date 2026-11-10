# syntax=docker/dockerfile:1.7
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@12.14.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/dominio/package.json packages/dominio/
COPY services/resenas-service/package.json services/resenas-service/
RUN pnpm install --filter resenas-service... --frozen-lockfile

FROM deps AS build
COPY tsconfig.base.json ./
COPY packages/dominio packages/dominio
COPY services/resenas-service services/resenas-service
RUN pnpm --filter resenas-service build \
    && pnpm --filter resenas-service deploy --prod /app/deploy

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/deploy ./
COPY --from=build /app/services/resenas-service/db ./db
USER node
EXPOSE 3005
CMD ["node", "dist/servidor.js"]
