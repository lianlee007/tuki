# syntax=docker/dockerfile:1.7
FROM node:22-alpine AS build
RUN corepack enable && corepack prepare pnpm@12.14.0 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages packages
COPY apps/panel-restaurante/package.json apps/panel-restaurante/
RUN pnpm install --filter panel-restaurante... --frozen-lockfile

COPY tsconfig.base.json ./
COPY apps/panel-restaurante apps/panel-restaurante
RUN pnpm --filter panel-restaurante build

FROM nginx:1.27-alpine
COPY infra/docker/nginx-spa.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/panel-restaurante/dist /usr/share/nginx/html
EXPOSE 80
