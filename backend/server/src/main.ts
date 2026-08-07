import { serve } from "@hono/node-server"

import { buildApp } from "./app"
import { createDb } from "./db"
import { loadEnv } from "./env"

async function start() {
  const env = loadEnv()
  const handle = createDb(env)
  await handle.migrate()

  const app = buildApp({ env, handle, startedAt: new Date() })
  const server = serve({ fetch: app.fetch, hostname: env.host, port: env.port })
  console.warn(`Tabora server on ${env.baseUrl} (${env.databaseClient})`)

  const shutdown = () => {
    server.close(() => {
      void handle.close()
      process.exit(0)
    })
  }
  process.on("SIGINT", shutdown)
  process.on("SIGTERM", shutdown)
}

void start().catch((error: unknown) => {
  console.error("Failed to start Tabora server", error)
  process.exitCode = 1
})
