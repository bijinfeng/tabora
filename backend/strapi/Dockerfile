# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

FROM deps AS build
WORKDIR /app
COPY . .
RUN npm run build \
  && npm prune --omit=dev

FROM node:22-alpine AS runner
WORKDIR /app

# Run Strapi with a stable non-root UID/GID so mounted uploads remain writable.
RUN addgroup --system --gid 1001 strapi \
  && adduser --system --uid 1001 --ingroup strapi strapi

# The build stage prunes development dependencies after compiling native
# modules, so the runner never needs the compiler toolchain or npm cache.
COPY --chown=strapi:strapi package*.json ./

# Copy only runtime application files from the build stage.
COPY --from=build --chown=strapi:strapi /app/node_modules ./node_modules
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
