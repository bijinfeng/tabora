import { buildApp } from "./app"
import { createDb } from "./db"
import { loadEnv } from "./env"

async function start() {
  const env = loadEnv()
  const handle = createDb(env)
  await handle.migrate()

  const app = await buildApp({ env, handle })
  app.addHook("onClose", async () => {
    await handle.close()
  })

  await app.listen({ host: env.host, port: env.port })
  console.warn(`Tabora server on ${env.baseUrl} (${env.databaseClient})`)
}

void start().catch((error: unknown) => {
  console.error("Failed to start Tabora server", error)
  process.exitCode = 1
})
