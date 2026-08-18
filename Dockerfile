# syntax=docker/dockerfile:1.7

# Two ways to build this image:
#
#   1. `docker build .` — the default target (`runtime`) builds the
#      site inside the image via the `builder` stage. Zero host setup;
#      what docs/deploying.md documents for self-hosters.
#   2. `docker build --target runtime-prebuilt .` — copies a `dist/`
#      you already built on the host (`npm run build`). CI uses this:
#      the emulated arm64 leg of the multi-arch build was hitting
#      intermittent SIGILL ("Illegal instruction") running Node's JIT
#      under QEMU, and a prebuilt dist is architecture-independent, so
#      the image assembly runs no JavaScript at all.

# -------- Stage 1: build the static site (default path only) --------
FROM node:22-alpine AS builder

WORKDIR /build

# Install dependencies first for better layer caching.
COPY package.json package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Copy the rest of the source.
COPY . .

# Build Astro and the Pagefind search index (npm run build does both).
RUN npm run build

# -------- Shared nginx runtime shell --------
FROM nginx:1.27-alpine AS nginx-base

# Custom config — handles trailing-slash rewrites, gzip, cache headers, etc.
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

# Healthcheck for orchestrators (Docker, k8s, Watchtower, Coolify, etc).
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

# -------- CI target: dist/ prebuilt on the host --------
FROM nginx-base AS runtime-prebuilt

COPY dist /usr/share/nginx/html

# -------- Default target: dist/ from the in-image build --------
FROM nginx-base AS runtime

COPY --from=builder /build/dist /usr/share/nginx/html
