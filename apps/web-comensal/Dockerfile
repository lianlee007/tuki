# syntax=docker/dockerfile:1.7
FROM node:22-alpine@sha256:1314fb30ec37592d5845e5a160d522c0e680972aa534549940b8d73bde88481a AS build
RUN corepack enable && corepack prepare pnpm@12.14.0 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages packages
COPY apps/web-comensal/package.json apps/web-comensal/
RUN pnpm install --filter web-comensal... --frozen-lockfile

COPY tsconfig.base.json ./
COPY apps/web-comensal apps/web-comensal
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
RUN pnpm --filter web-comensal build

FROM nginx:1.31.8-alpine@sha256:713fc2ebfd92e8217db451477182ee91944b123d2b1ee9fd5a8c6e91ca6c3a11
COPY infra/docker/nginx-spa.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web-comensal/dist /usr/share/nginx/html
EXPOSE 80
