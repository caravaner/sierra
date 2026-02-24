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
COPY apps/web/package.json             ./apps/web/
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
RUN pnpm --filter @sierra/web build

# ── Runner ────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Standalone server (self-contained Node.js bundle, no extra node_modules needed)
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./

# Static assets (JS/CSS chunks) — must live at <app-root>/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

# Public directory (images, PWA service worker, manifest, etc.)
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]
