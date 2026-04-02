FROM node:24-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p /app/data
EXPOSE 8787
CMD ["npm", "run", "start:local-prod"]
