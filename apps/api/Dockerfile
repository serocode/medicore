# syntax=docker/dockerfile:1
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

FROM base AS runner
ENV NODE_ENV=production
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY apps/api/package.json apps/api/package.json
COPY packages/dal/package.json packages/dal/package.json
COPY packages/domain/package.json packages/domain/package.json
COPY packages/application/package.json packages/application/package.json
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

COPY --from=builder /app/apps/api/dist ./apps/api/dist

EXPOSE 3000
CMD ["node", "apps/api/dist/index.js"]
