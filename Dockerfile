FROM node:24-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache libc6-compat \
  && npm install -g wrangler@4.79.0
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 8787
CMD ["wrangler", "dev", "--config", "wrangler.toml", "--ip", "0.0.0.0", "--port", "8787"]
