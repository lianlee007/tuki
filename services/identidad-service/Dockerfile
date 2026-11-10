# syntax=docker/dockerfile:1.7
# Imagen de producción del servicio de identidad.
# Se construye desde la raíz del monorepo para aprovechar el lockfile.

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@12.14.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/identidad-service/package.json services/identidad-service/
RUN pnpm install --filter identidad-service... --frozen-lockfile

FROM deps AS build
COPY tsconfig.base.json ./
COPY services/identidad-service services/identidad-service
RUN pnpm --filter identidad-service build \
    && pnpm --filter identidad-service deploy --prod /app/deploy

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/deploy ./
COPY --from=build /app/services/identidad-service/db ./db
USER node
EXPOSE 3001
CMD ["node", "dist/servidor.js"]
