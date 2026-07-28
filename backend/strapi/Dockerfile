FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile && pnpm --dir backend/strapi build

FROM node:20-alpine
WORKDIR /app/backend/strapi
RUN corepack enable
COPY --from=build /app/backend/strapi ./
ENV NODE_ENV=production
EXPOSE 1337
CMD ["pnpm", "start"]
