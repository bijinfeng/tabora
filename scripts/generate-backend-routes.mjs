import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { createServer } from "vite"

const scriptsDirectory = dirname(fileURLToPath(import.meta.url))
const appRoot = resolve(scriptsDirectory, "../apps/app")

const server = await createServer({
  root: appRoot,
  configFile: resolve(appRoot, "vite.config.ts"),
  server: { middlewareMode: true },
})

await server.close()
