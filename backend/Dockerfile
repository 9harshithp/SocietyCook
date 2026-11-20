# =========================================================================
# SocietyCook Enterprise Backend Dockerfile (Multi-stage, Least-Privilege)
# =========================================================================

# Stage 1: Dependency resolution
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Stage 2: Production runtime image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install minimal tools for healthcheck
RUN apk add --no-cache wget

# Create non-root application user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 societycook

# Copy dependencies and application source
COPY --from=deps --chown=societycook:nodejs /app/node_modules ./node_modules
COPY --chown=societycook:nodejs . .

# Switch to unprivileged user
USER societycook

EXPOSE 5000

# Container Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

CMD ["node", "server.js"]
