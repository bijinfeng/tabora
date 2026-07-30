# syntax=docker/dockerfile:1.7

FROM node:22-alpine3.24 AS node-runtime

FROM node-runtime AS build
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

COPY . .
RUN npm run build

FROM node-runtime AS production-dependencies
WORKDIR /app
COPY package*.json ./
COPY scripts/prune-production-files.mjs ./scripts/prune-production-files.mjs
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev \
  && node scripts/prune-production-files.mjs node_modules \
  && rm -rf scripts

FROM alpine:3.24 AS runner
WORKDIR /app

# The final image needs only the Node executable and its C++ runtime libraries.
RUN addgroup --system --gid 1001 strapi \
  && adduser --system --uid 1001 --ingroup strapi strapi
COPY --from=node-runtime /usr/local/bin/node /usr/local/bin/node
COPY --from=node-runtime /usr/lib/libgcc_s.so.1 /usr/lib/libgcc_s.so.1
COPY --from=node-runtime /usr/lib/libstdc++.so.6* /usr/lib/

# Run Strapi with a stable non-root UID/GID so mounted uploads remain writable.
COPY --chown=strapi:strapi package*.json ./
COPY --from=production-dependencies --chown=strapi:strapi /app/node_modules ./node_modules

# Copy only runtime application files from the build stage.
COPY --from=build --chown=strapi:strapi /app/tsconfig.json ./tsconfig.json
COPY --from=build --chown=strapi:strapi /app/dist ./dist
COPY --from=build --chown=strapi:strapi /app/public ./public
COPY --from=build --chown=strapi:strapi /app/favicon.png ./favicon.png

# Create the volume mount point before dropping privileges.
ENV NODE_ENV=production
RUN mkdir -p public/uploads database/migrations \
  && chown -R strapi:strapi public/uploads database

USER strapi

# Strapi runs on 1337 by default
EXPOSE 1337

CMD ["node", "node_modules/@strapi/strapi/bin/strapi.js", "start"]
