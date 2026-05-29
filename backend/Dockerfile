# =============================================
# Backend Dockerfile — Solar Stock API
# =============================================

# --- Base stage ---
FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

# --- Development stage ---
FROM node:20-alpine AS development
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
EXPOSE 5000
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", "--watch", "src/index.js"]

# --- Production stage ---
FROM node:20-alpine AS production
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY . .
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
RUN mkdir -p /app/uploads
EXPOSE 5000
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", "src/index.js"]
