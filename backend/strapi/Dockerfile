# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS build
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app

# Run Strapi with a stable non-root UID/GID so mounted uploads remain writable.
RUN addgroup --system --gid 1001 strapi \
  && adduser --system --uid 1001 --ingroup strapi strapi

# Install the production tree from the lockfile rather than copying build
# dependencies. The build-only SQLite driver is omitted because production
# deployments use PostgreSQL.
COPY --chown=strapi:strapi package*.json ./
COPY --from=build --chown=strapi:strapi /app/scripts/prune-production-files.mjs ./scripts/prune-production-files.mjs
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev \
  && node scripts/prune-production-files.mjs node_modules \
  && rm -rf scripts

# Copy only runtime application files from the build stage.
COPY --from=build --chown=strapi:strapi /app/dist ./dist
COPY --from=build --chown=strapi:strapi /app/config ./config
COPY --from=build --chown=strapi:strapi /app/public ./public
COPY --from=build --chown=strapi:strapi /app/favicon.png ./favicon.png

# Create the volume mount point before dropping privileges.
ENV NODE_ENV=production
RUN mkdir -p public/uploads \
  && chown strapi:strapi public/uploads

USER strapi

# Strapi runs on 1337 by default
EXPOSE 1337

CMD ["npm", "start"]
