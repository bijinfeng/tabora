FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built application
COPY --from=build /app/dist ./dist
COPY --from=build /app/config ./config
COPY --from=build /app/public ./public
COPY --from=build /app/favicon.png ./

# Set environment and create upload directory
ENV NODE_ENV=production
RUN mkdir -p public/uploads

# Strapi runs on 1337 by default
EXPOSE 1337

CMD ["npm", "start"]
