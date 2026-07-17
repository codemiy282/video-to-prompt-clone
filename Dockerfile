# ---- Frontend (Next.js 16) ----
# Multi-stage build using `output: "standalone"` for a minimal runtime image.
# Next 16 requires Node.js >= 20.9 (18 is no longer supported).

FROM node:20-slim AS base
ENV NODE_ENV=production

# 1) Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 2) Build the app (Turbopack is default in Next 16)
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 3) Minimal runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
# next start reads HOSTNAME/PORT from the standalone server
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
