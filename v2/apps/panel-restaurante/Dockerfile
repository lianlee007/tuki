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
ARG VITE_IDENTIDAD_URL=http://localhost:3001
ARG VITE_RESTAURANTES_URL=http://localhost:3002
ARG VITE_MEDIA_URL=http://localhost:3003
ARG VITE_PEDIDOS_URL=http://localhost:3004
ARG VITE_RESENAS_URL=http://localhost:3005
ENV VITE_IDENTIDAD_URL=$VITE_IDENTIDAD_URL \
    VITE_RESTAURANTES_URL=$VITE_RESTAURANTES_URL \
    VITE_MEDIA_URL=$VITE_MEDIA_URL \
    VITE_PEDIDOS_URL=$VITE_PEDIDOS_URL \
    VITE_RESENAS_URL=$VITE_RESENAS_URL
RUN pnpm --filter panel-restaurante build

FROM nginx:1.27-alpine
COPY infra/docker/nginx-spa.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/panel-restaurante/dist /usr/share/nginx/html
EXPOSE 80
