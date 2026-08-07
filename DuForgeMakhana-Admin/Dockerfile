# Makhana Admin (Vite + React) — production build, served by nginx

# Build stage
FROM node:24-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund
COPY . .

# Build for production
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
ARG VITE_BASE_PATH=/makhana-admin
ENV VITE_BASE_PATH=${VITE_BASE_PATH}
RUN npm run build

# Serve stage — minimal nginx serving static files
FROM nginx:1.27-alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# SPA fallback: any unknown path serves index.html
RUN echo 'server { \
    listen 5173; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    include /etc/nginx/mime.types; \
    default_type application/octet-stream; \
    location / { try_files $uri $uri/ /index.html; } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 5173
CMD ["nginx", "-g", "daemon off;"]
