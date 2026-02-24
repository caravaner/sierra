# ── Base ──────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# ── Dependencies ──────────────────────────────────────────────────────────────
# Copy only package manifests so this layer is cached until they change
FROM base AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/admin/package.json           ./apps/admin/
COPY packages/api/package.json         ./packages/api/
COPY packages/auth/package.json        ./packages/auth/
COPY packages/db/package.json          ./packages/db/
COPY packages/domain/package.json      ./packages/domain/
COPY packages/shared/package.json      ./packages/shared/

RUN pnpm install --frozen-lockfile

# ── Builder ───────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app

# Bring installed node_modules from deps stage
COPY --from=deps /app .
# Overlay full source
COPY . .

# Generate Prisma client
RUN pnpm --filter @sierra/db generate

# Build — Next.js transpiles the local packages via transpilePackages
RUN pnpm --filter @sierra/admin build

# ── Runner ────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Standalone server (self-contained Node.js bundle, no extra node_modules needed)
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin/.next/standalone ./

# Static assets (JS/CSS chunks)
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin/.next/static ./apps/admin/.next/static

# Public directory
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin/public ./apps/admin/public

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/admin/server.js"]
