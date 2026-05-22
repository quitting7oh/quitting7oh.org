# syntax=docker/dockerfile:1.7

# -------- Stage 1: build the static site --------
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

# -------- Stage 2: serve with nginx --------
FROM nginx:1.27-alpine AS runtime

# Custom config — handles trailing-slash rewrites, gzip, cache headers, etc.
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Pull the built site out of the builder stage.
COPY --from=builder /build/dist /usr/share/nginx/html

EXPOSE 8080

# Healthcheck for orchestrators (Docker, k8s, Watchtower, Coolify, etc).
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
