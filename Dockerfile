FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build 2>/dev/null || echo "No build script, skipping"

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=2083

RUN apk add --no-cache \
    openssl \
    nginx \
    postfix \
    dovecot \
    mariadb-client \
    docker-cli \
    curl \
    bash \
    sudo \
    shadow

COPY --from=builder /app /app

RUN npm ci --omit=dev 2>/dev/null || true

RUN mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled \
    /var/mail/vhosts \
    /etc/dovecot \
    /etc/postfix \
    /home/dursun/.config/ocp-panel \
    /opt/ocp-panel/ssl

EXPOSE 2083 80 443

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -kf https://localhost:2083/api/stats || exit 1

CMD ["sh", "-c", " \
  if [ ! -f /app/ssl/ocp-panel.key ]; then \
    openssl req -x509 -newkey rsa:2048 -nodes -keyout /app/ssl/ocp-panel.key -out /app/ssl/ocp-panel.crt \
      -days 365 -subj '/CN=localhost' -addext 'subjectAltName=DNS:localhost,IP:127.0.0.1' 2>/dev/null; \
  fi; \
  node /app/server/server.js \
"]