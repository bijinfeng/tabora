import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { createServer } from "vite"

const scriptsDirectory = dirname(fileURLToPath(import.meta.url))
const backendRoot = resolve(scriptsDirectory, "../backend/app")

const server = await createServer({
  root: backendRoot,
  configFile: resolve(backendRoot, "vite.config.ts"),
  server: { middlewareMode: true },
})

await server.close()
