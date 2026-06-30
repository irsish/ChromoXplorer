# Build stage
ARG NODE_VERSION=22.14.0

FROM node:${NODE_VERSION}-alpine AS builder
WORKDIR /app

# Declare build-time variables passed from docker-compose (must be before RUN npm run build)
ARG VITE_API_BASE_URL
ARG VITE_COGNITO_AUTHORITY
ARG VITE_COGNITO_CLIENT_ID
ARG VITE_COGNITO_DOMAIN
ARG VITE_SITE_URL
ARG VITE_GOOGLE_SITE_VERIFICATION
ARG VITE_SUPPORT_EMAIL

# Promote ARGs to ENV so Vite can read them during the build
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_COGNITO_AUTHORITY=$VITE_COGNITO_AUTHORITY
ENV VITE_COGNITO_CLIENT_ID=$VITE_COGNITO_CLIENT_ID
ENV VITE_COGNITO_DOMAIN=$VITE_COGNITO_DOMAIN
ENV VITE_SITE_URL=$VITE_SITE_URL
ENV VITE_GOOGLE_SITE_VERIFICATION=$VITE_GOOGLE_SITE_VERIFICATION
ENV VITE_SUPPORT_EMAIL=$VITE_SUPPORT_EMAIL

# Install deps first
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN NODE_OPTIONS=--max-old-space-size=4096 npm run build

# Dev stage — runs Vite dev server with HMR; used with docker compose watch
FROM node:${NODE_VERSION}-alpine AS dev
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 80
CMD ["npm", "run", "dev", "--", "--host", "--port", "80"]

# Runtime stage
FROM nginx:1.27-alpine AS runtime

# Ensure file-level certificate mounts have a stable target path at runtime.
RUN mkdir -p /etc/ssl/app /var/www/certbot

# Replace default nginx site config (SPA-friendly)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files (Vite outputs to /app/dist by default)
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
