# syntax=docker/dockerfile:1.7
FROM node:22-alpine@sha256:1314fb30ec37592d5845e5a160d522c0e680972aa534549940b8d73bde88481a AS build
RUN corepack enable && corepack prepare pnpm@12.14.0 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages packages
COPY apps/admin-plataforma/package.json apps/admin-plataforma/
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --filter admin-plataforma... --frozen-lockfile

COPY tsconfig.base.json ./
COPY apps/admin-plataforma apps/admin-plataforma
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
RUN pnpm --filter admin-plataforma build

FROM nginx:1.31.9-alpine@sha256:fb4658584bd9a916ffb6f6e365f97c25cfdb2923801f551ea08356e695f14ff7
COPY infra/docker/nginx-spa.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/admin-plataforma/dist /usr/share/nginx/html
EXPOSE 80
