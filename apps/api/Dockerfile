# syntax=docker/dockerfile:1
# Build context MUST be the monorepo root, e.g.:
#   docker build -f apps/api/Dockerfile -t healthcare-api .
FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS builder
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY apps/api/package.json apps/api/package.json
COPY packages/dal/package.json packages/dal/package.json
COPY packages/domain/package.json packages/domain/package.json
COPY packages/application/package.json packages/application/package.json
RUN pnpm install --frozen-lockfile

COPY tsconfig.json ./
COPY apps/api apps/api
COPY packages/dal packages/dal
COPY packages/domain packages/domain
COPY packages/application packages/application
RUN pnpm --filter @healthcare/api build

# Full source and dev dependencies (tsx, drizzle-kit) for the one-off DAL
# scripts - db:migrate and db:seed. docker-compose.prod.yml's `migrate`
# service builds this target; it never serves traffic.
FROM builder AS tools

FROM base AS runner
ENV NODE_ENV=production
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY apps/api/package.json apps/api/package.json
COPY packages/dal/package.json packages/dal/package.json
COPY packages/domain/package.json packages/domain/package.json
COPY packages/application/package.json packages/application/package.json
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Patient uploads (ID documents) live here, on a volume in production. The
# directory is created owned by `node` so a fresh named volume inherits that
# ownership on first mount and the non-root process can write to it.
RUN mkdir -p /app/uploads && chown node:node /app/uploads
ENV UPLOAD_DIR=/app/uploads

USER node
EXPOSE 3000
CMD ["node", "apps/api/dist/index.js"]
