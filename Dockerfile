# ---- Build stage ----
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Runtime stage ----
FROM node:22-alpine AS runtime

WORKDIR /app

# Install only production deps — no dev tooling, no TypeScript compiler, etc.
COPY package*.json ./
RUN npm ci --omit=dev

# Pull in just the compiled output from the build stage, nothing else
COPY --from=builder /app/dist ./dist

# Don't run as root
RUN addgroup -S nodejs && adduser -S nestjs -G nodejs
USER nestjs

EXPOSE 3000
CMD ["node", "dist/main"]