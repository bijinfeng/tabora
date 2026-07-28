FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable pnpm
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/strapi/package.json ./backend/strapi/
# Increase network timeouts for slow connections and skip prepare scripts
RUN pnpm config set fetch-timeout 600000 && \
    pnpm config set fetch-retries 5 && \
    pnpm install --frozen-lockfile --ignore-scripts

FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable pnpm
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/backend/strapi/node_modules ./backend/strapi/node_modules
COPY . .
RUN cd backend/strapi && pnpm build

FROM node:22-alpine AS runner
WORKDIR /app
RUN corepack enable pnpm

# Copy package files and install production dependencies only
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/strapi/package.json ./backend/strapi/
# Increase network timeouts for slow connections and skip prepare scripts
RUN pnpm config set fetch-timeout 600000 && \
    pnpm config set fetch-retries 5 && \
    pnpm install --frozen-lockfile --prod --ignore-scripts

# Copy built application
COPY --from=build /app/backend/strapi/dist ./backend/strapi/dist
COPY --from=build /app/backend/strapi/config ./backend/strapi/config
COPY --from=build /app/backend/strapi/public ./backend/strapi/public
COPY --from=build /app/backend/strapi/favicon.png ./backend/strapi/
COPY --from=build /app/backend/strapi/package.json ./backend/strapi/

# Set environment and create upload directory
ENV NODE_ENV=production
WORKDIR /app/backend/strapi
RUN mkdir -p public/uploads

# Strapi runs on 1337 by default
EXPOSE 1337

CMD ["pnpm", "start"]
