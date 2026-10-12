# syntax=docker/dockerfile:1
# Build context MUST be the monorepo root, e.g.:
#   docker build -f apps/web/Dockerfile --build-arg VITE_API_URL=https://api.example.com -t healthcare-web .
FROM node:22-alpine AS builder
RUN corepack enable
WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile --filter @healthcare/web...

COPY tsconfig.json ./
COPY apps/web apps/web

# Vite bakes VITE_* env vars in at build time, not runtime. .env is not in
# the build context (.dockerignore), so this is the only value it sees.
ARG VITE_API_URL
RUN test -n "$VITE_API_URL" || (echo "VITE_API_URL build arg is required" >&2 && exit 1)
ENV VITE_API_URL=$VITE_API_URL

RUN pnpm --filter @healthcare/web build

FROM nginx:1.27-alpine AS runner
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
