# syntax=docker/dockerfile:1.6

# ---------- Build stage ----------
FROM node:24.0.0-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# ---------- Runtime stage ----------
FROM node:24.0.0-alpine AS runtime

# Run as non-root for security
RUN addgroup -g 1001 nodejs && adduser -S -u 1001 -G nodejs nodejs

# dumb-init forwards signals properly to Node (PID 1 problem)
RUN apk add --no-cache dumb-init wget

WORKDIR /app

COPY --from=build --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs src/ ./src/
COPY --chown=nodejs:nodejs package.json ./

USER nodejs

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/index.js"]
