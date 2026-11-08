# syntax=docker/dockerfile:1.7
FROM node:22-alpine AS build
RUN corepack enable && corepack prepare pnpm@12.14.0 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages packages
COPY apps/admin-plataforma/package.json apps/admin-plataforma/
RUN pnpm install --filter admin-plataforma... --frozen-lockfile

COPY tsconfig.base.json ./
COPY apps/admin-plataforma apps/admin-plataforma
RUN pnpm --filter admin-plataforma build

FROM nginx:1.27-alpine
COPY infra/docker/nginx-spa.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/admin-plataforma/dist /usr/share/nginx/html
EXPOSE 80
