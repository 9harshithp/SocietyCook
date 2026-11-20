# =========================================================================
# SocietyCook Enterprise Frontend Dockerfile (Multi-stage, Nginx Alpine)
# =========================================================================

# Stage 1: Build static assets
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production web server
FROM nginx:alpine AS runner
WORKDIR /usr/share/nginx/html

# Clean default nginx files
RUN rm -rf ./*

# Copy built production assets
COPY --from=builder /app/dist .

# Custom hardened nginx configuration
RUN echo 'server {' > /etc/nginx/conf.d/default.conf && \
    echo '  listen 80;' && \
    echo '  server_name localhost;' && \
    echo '  root /usr/share/nginx/html;' && \
    echo '  index index.html;' && \
    echo '  location / {' && \
    echo '    try_files $uri $uri/ /index.html;' && \
    echo '  }' && \
    echo '  location ~* \.(?:css|js|webp|jpg|png|svg|ico)$ {' && \
    echo '    expires 1y;' && \
    echo '    add_header Cache-Control "public, max-age=31536000, immutable";' && \
    echo '  }' && \
    echo '}' >> /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

