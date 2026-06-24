# syntax=docker/dockerfile:1

# ---- base ----
FROM node:22-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# ---- deps ----
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---- builder ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Public env vars must exist at build time (they are inlined into the client bundle).
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY=""
ENV NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY

# Prisma 7 + pg driver adapter: generates the JS client (no native engine needed).
# Dummy URL only satisfies prisma.config at generate time (no DB connection made).
RUN DATABASE_URL="postgresql://localhost:5432/db" npx prisma generate
RUN DATABASE_URL="postgresql://localhost:5432/db" npm run build

# ---- runner ----
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

RUN groupadd --gid 1001 nodejs \
  && useradd --uid 1001 --gid nodejs --shell /bin/bash --create-home nextjs

# Standalone server + static assets + public files.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Ensure the generated Prisma client is present in the traced node_modules.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs
EXPOSE 8080

# Cloud Run sets $PORT (defaults to 8080); Next standalone server reads it.
CMD ["node", "server.js"]
