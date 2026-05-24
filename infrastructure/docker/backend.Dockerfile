# Backend Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared-types/package.json ./packages/shared-types/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build shared types
FROM base AS types-builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY packages/shared-types ./packages/shared-types
WORKDIR /app/packages/shared-types
RUN npm run build

# Build backend
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=types-builder /app/packages/shared-types/dist ./packages/shared-types/dist
COPY apps/backend ./apps/backend
COPY packages/shared-types/package.json ./packages/shared-types/

# Generate Prisma Client
WORKDIR /app/apps/backend
RUN npx prisma generate

# Build backend
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 backend

# Copy built application
COPY --from=builder --chown=backend:nodejs /app/apps/backend/dist ./dist
COPY --from=builder --chown=backend:nodejs /app/apps/backend/node_modules ./node_modules
COPY --from=builder --chown=backend:nodejs /app/apps/backend/package.json ./package.json
COPY --from=builder --chown=backend:nodejs /app/apps/backend/prisma ./prisma

USER backend

EXPOSE 3001

CMD ["node", "dist/index.js"]
