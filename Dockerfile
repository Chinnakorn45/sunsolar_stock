# Root Dockerfile for backend deployment
# Builds the backend service from the monorepo root.
FROM node:20-alpine

WORKDIR /app

# Install only production dependencies for faster deploys.
COPY backend/package.json backend/package-lock.json ./backend/
WORKDIR /app/backend
RUN npm ci --omit=dev

COPY backend/ ./

EXPOSE 5000
CMD ["npm", "start"]
