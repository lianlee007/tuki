# syntax=docker/dockerfile:1.7
FROM node:22-alpine AS build
RUN corepack enable && corepack prepare pnpm@12.14.0 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages packages
COPY apps/web-comensal/package.json apps/web-comensal/
RUN pnpm install --filter web-comensal... --frozen-lockfile

COPY tsconfig.base.json ./
COPY apps/web-comensal apps/web-comensal
RUN pnpm --filter web-comensal build

FROM nginx:1.27-alpine
COPY infra/docker/nginx-spa.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web-comensal/dist /usr/share/nginx/html
EXPOSE 80
