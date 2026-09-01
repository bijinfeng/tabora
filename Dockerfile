# syntax=docker/dockerfile:1.7
FROM node:22-bookworm AS build

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

WORKDIR /workspace
RUN corepack enable

COPY . .
RUN --mount=type=cache,id=tabora-pnpm-store,target=/pnpm/store \
  pnpm install --frozen-lockfile
RUN pnpm --filter @tabora/app build
RUN pnpm --filter @tabora/app --prod deploy --legacy /opt/tabora

FROM node:22-bookworm-slim AS runtime

WORKDIR /app
RUN groupadd --system tabora \
  && useradd --system --gid tabora --create-home --home-dir /app tabora \
  && mkdir /data \
  && chown tabora:tabora /data

COPY --from=build --chown=tabora:tabora /opt/tabora/node_modules ./node_modules
COPY --from=build --chown=tabora:tabora /workspace/backend/app/package.json ./package.json
COPY --from=build --chown=tabora:tabora /workspace/backend/app/serve.mjs ./serve.mjs
COPY --from=build --chown=tabora:tabora /workspace/backend/app/dist ./dist

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4000
ENV DATABASE_FILE=/data/tabora.db
ENV UPLOADS_DIR=/data/uploads

VOLUME ["/data"]
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4000/api/health').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"

USER tabora
CMD ["node", "serve.mjs"]
