import { mkdirSync, rmSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { createAdaptorServer, type ServerType } from "@hono/node-server"
import { serveStatic } from "@hono/node-server/serve-static"
import Database from "better-sqlite3"
import { Hono } from "hono"
import { cors } from "hono/cors"
import {
  AiRuntimeError,
  aiErrorResponse,
  aiStreamResponse,
  createTanstackAiGateway,
  parseAiGatewayRequest,
  type AiCustomProviderConfig,
} from "@tabora/ai-runtime/server"

const localStoreCollections = [
  "plugin-data",
  "plugin-instances",
  "plugin-records",
  "workspaces",
] as const

type LocalStoreCollection = (typeof localStoreCollections)[number]

type FnosServerOptions = {
  databasePath?: string
  frontendDist?: string
  gatewayPrefix?: string
}

function isLocalStoreCollection(value: string): value is LocalStoreCollection {
  return (localStoreCollections as readonly string[]).includes(value)
}

function defaultDatabasePath(): string {
  return process.env.FNOS_DATABASE_PATH ?? resolve(process.cwd(), "data", "tabora.db")
}

function normalizeGatewayPrefix(value: string | undefined): string {
  const prefix = value?.trim().replace(/\/$/, "") ?? ""
  if (!prefix) return ""
  if (!prefix.startsWith("/") || prefix.includes("..")) {
    throw new Error(`Invalid FNOS gateway prefix: ${value}`)
  }
  return prefix
}

function isTrustedLocalOrigin(origin: string): boolean {
  try {
    const url = new URL(origin)
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      (url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "[::1]")
    )
  } catch {
    return false
  }
}

function createLocalStore(databasePath: string): Database.Database {
  if (databasePath !== ":memory:") {
    mkdirSync(dirname(databasePath), { recursive: true })
  }
  const database = new Database(databasePath)
  database.pragma("journal_mode = WAL")
  database.exec(`
    CREATE TABLE IF NOT EXISTS local_store (
      collection TEXT NOT NULL,
      id TEXT NOT NULL,
      value_json TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (collection, id)
    )
  `)
  database.exec(`
    CREATE TABLE IF NOT EXISTS ai_provider_config (
      id TEXT PRIMARY KEY,
      base_url TEXT NOT NULL,
      api_key TEXT NOT NULL,
      model TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `)
  return database
}

function readAiProviderConfig(database: Database.Database): AiCustomProviderConfig | undefined {
  const row = database
    .prepare("SELECT base_url, api_key, model FROM ai_provider_config WHERE id = 'device'")
    .get() as { base_url: string; api_key: string; model: string } | undefined
  return row ? { baseUrl: row.base_url, apiKey: row.api_key, model: row.model } : undefined
}

function publicAiProviderConfig(config: AiCustomProviderConfig | undefined) {
  return config
    ? { configured: true, baseUrl: config.baseUrl, model: config.model, hasApiKey: true }
    : { configured: false, baseUrl: "", model: "", hasApiKey: false }
}

function validateFnosProvider(config: AiCustomProviderConfig): void {
  let url: URL
  try {
    url = new URL(config.baseUrl)
  } catch {
    throw new AiRuntimeError("ai_request_rejected", "Invalid custom AI base URL")
  }
  if ((url.protocol !== "http:" && url.protocol !== "https:") || url.username || url.password) {
    throw new AiRuntimeError("ai_request_rejected", "Custom AI base URL is not allowed")
  }
}

function fnosAiInput(value: unknown, database: Database.Database) {
  if (!value || typeof value !== "object") {
    throw new AiRuntimeError("ai_request_rejected", "Invalid AI request")
  }
  const raw = value as Record<string, unknown>
  if (raw.provider === "builtin") {
    throw new AiRuntimeError("ai_model_unavailable", "FNOS does not provide built-in AI models")
  }
  const provider = readAiProviderConfig(database)
  if (!provider)
    throw new AiRuntimeError("ai_not_configured", "Device AI provider is not configured")
  validateFnosProvider(provider)
  return parseAiGatewayRequest({ ...raw, provider: "custom", custom: provider })
}
function registerLocalStoreRoutes(app: Hono, database: Database.Database, prefix: string) {
  app.get(`${prefix}/api/health`, (c) => c.json({ status: "ok" }))

  app.get(`${prefix}/api/local-store/:collection`, (c) => {
    const collection = c.req.param("collection")
    if (!isLocalStoreCollection(collection)) return c.body(null, 404)
    const rows = database
      .prepare("SELECT value_json FROM local_store WHERE collection = ? ORDER BY updated_at ASC")
      .all(collection) as Array<{ value_json: string }>
    return c.json({ values: rows.map((row) => JSON.parse(row.value_json)) })
  })

  app.get(`${prefix}/api/local-store/:collection/:id`, (c) => {
    const collection = c.req.param("collection")
    if (!isLocalStoreCollection(collection)) return c.body(null, 404)
    const row = database
      .prepare("SELECT value_json FROM local_store WHERE collection = ? AND id = ?")
      .get(collection, c.req.param("id")) as { value_json: string } | undefined
    if (!row) return c.body(null, 404)
    return c.json({ value: JSON.parse(row.value_json) })
  })

  app.put(`${prefix}/api/local-store/:collection/:id`, async (c) => {
    const collection = c.req.param("collection")
    if (!isLocalStoreCollection(collection)) return c.body(null, 404)
    const body = (await c.req.json().catch(() => null)) as { value?: unknown } | null
    if (!body || !("value" in body)) {
      return c.json({ error: "Missing request body value" }, 400)
    }
    database
      .prepare(
        `INSERT INTO local_store (collection, id, value_json, updated_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(collection, id) DO UPDATE SET
           value_json = excluded.value_json,
           updated_at = excluded.updated_at`,
      )
      .run(collection, c.req.param("id"), JSON.stringify(body.value), new Date().toISOString())
    return c.body(null, 204)
  })

  app.delete(`${prefix}/api/local-store/:collection/:id`, (c) => {
    const collection = c.req.param("collection")
    if (!isLocalStoreCollection(collection)) return c.body(null, 404)
    database
      .prepare("DELETE FROM local_store WHERE collection = ? AND id = ?")
      .run(collection, c.req.param("id"))
    return c.body(null, 204)
  })

  app.get(`${prefix}/api/ai/config`, (c) =>
    c.json(publicAiProviderConfig(readAiProviderConfig(database))),
  )

  app.put(`${prefix}/api/ai/config`, async (c) => {
    const body = (await c.req.json().catch(() => null)) as Partial<AiCustomProviderConfig> | null
    if (
      !body ||
      typeof body.baseUrl !== "string" ||
      typeof body.apiKey !== "string" ||
      typeof body.model !== "string"
    ) {
      return aiErrorResponse(
        new AiRuntimeError("ai_request_rejected", "Invalid device AI configuration"),
      )
    }
    const config = {
      baseUrl: body.baseUrl.trim(),
      apiKey: body.apiKey.trim(),
      model: body.model.trim(),
    }
    if (!config.baseUrl || !config.apiKey || !config.model) {
      return aiErrorResponse(
        new AiRuntimeError("ai_not_configured", "Device AI provider is not configured"),
      )
    }
    try {
      validateFnosProvider(config)
      database
        .prepare(
          `INSERT INTO ai_provider_config (id, base_url, api_key, model, updated_at)
           VALUES ('device', ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET base_url = excluded.base_url, api_key = excluded.api_key,
             model = excluded.model, updated_at = excluded.updated_at`,
        )
        .run(config.baseUrl, config.apiKey, config.model, new Date().toISOString())
      return c.json(publicAiProviderConfig(config))
    } catch (error) {
      return aiErrorResponse(error)
    }
  })

  app.post(`${prefix}/api/ai/generate`, async (c) => {
    try {
      const input = fnosAiInput(await c.req.json().catch(() => null), database)
      const result = await createTanstackAiGateway().generate(input)
      return c.json(result)
    } catch (error) {
      return aiErrorResponse(error)
    }
  })

  app.post(`${prefix}/api/ai/stream`, async (c) => {
    try {
      const input = fnosAiInput(await c.req.json().catch(() => null), database)
      return aiStreamResponse(createTanstackAiGateway(), input)
    } catch (error) {
      return aiErrorResponse(error)
    }
  })
}
export type FnosApp = { app: Hono; close: () => void }

export function createFnosApp(options: FnosServerOptions = {}): FnosApp {
  const database = createLocalStore(options.databasePath ?? defaultDatabasePath())
  const app = new Hono()
  const gatewayPrefix = normalizeGatewayPrefix(
    options.gatewayPrefix ?? process.env.FNOS_GATEWAY_PREFIX,
  )
  const routePrefixes = gatewayPrefix ? ["", gatewayPrefix] : [""]

  app.use("*", cors({ origin: (origin) => (isTrustedLocalOrigin(origin) ? origin : null) }))

  for (const routePrefix of routePrefixes) {
    registerLocalStoreRoutes(app, database, routePrefix)
  }

  const frontendDist = options.frontendDist ?? process.env.FNOS_FRONTEND_DIST
  if (frontendDist) {
    const root = resolve(frontendDist)
    const mount = gatewayPrefix ? `${gatewayPrefix}/*` : "/*"
    app.use(
      mount,
      serveStatic({
        root,
        rewriteRequestPath: (path) =>
          gatewayPrefix && path.startsWith(gatewayPrefix)
            ? path.slice(gatewayPrefix.length) || "/"
            : path,
      }),
    )
  }

  return { app, close: () => database.close() }
}
type InjectOptions = {
  url: string
  method?: string
  payload?: unknown
  headers?: Record<string, string>
}

type InjectResponse = {
  statusCode: number
  body: string
  headers: Record<string, string>
  json: () => unknown
}

/**
 * 兼容门面：保留 createFnosServer 的 inject/listen/close 接口，
 * 内部改由 Hono 承载。inject 走 app.request（Web fetch），listen 用 node adaptor。
 */
export function createFnosServer(options: FnosServerOptions = {}) {
  const { app, close } = createFnosApp(options)
  let httpServer: ServerType | undefined

  return {
    async inject(opts: InjectOptions): Promise<InjectResponse> {
      const method = opts.method ?? "GET"
      const hasBody = opts.payload !== undefined
      const res = await app.request(opts.url, {
        method,
        headers: {
          ...(hasBody ? { "Content-Type": "application/json" } : {}),
          ...opts.headers,
        },
        ...(hasBody ? { body: JSON.stringify(opts.payload) } : {}),
      })
      const body = await res.text()
      const headers: Record<string, string> = {}
      res.headers.forEach((value, key) => {
        headers[key] = value
      })
      return {
        statusCode: res.status,
        body,
        headers,
        json: () => (body ? JSON.parse(body) : null),
      }
    },
    listen({ host, port }: { host: string; port: number }): Promise<string> {
      httpServer = createAdaptorServer(app)
      return new Promise((done) => {
        httpServer!.listen(port, host, () => {
          const address = httpServer!.address()
          const actualPort = typeof address === "object" && address ? address.port : port
          done(`http://${host}:${actualPort}`)
        })
      })
    },
    close(): Promise<void> {
      return new Promise((done) => {
        close()
        if (httpServer) httpServer.close(() => done())
        else done()
      })
    },
  }
}

async function startFnosServer() {
  const { app } = createFnosApp()
  const server = createAdaptorServer(app)
  const socketPath = process.env.FNOS_SOCKET_PATH?.trim()
  if (socketPath) {
    mkdirSync(dirname(socketPath), { recursive: true })
    rmSync(socketPath, { force: true })
    await new Promise<void>((done) => server.listen(socketPath, done))
    return
  }
  const port = Number(process.env.FNOS_PORT ?? 43120)
  await new Promise<void>((done) => server.listen(port, "127.0.0.1", done))
}

const entryPath = process.argv[1] ? resolve(process.argv[1]) : undefined
if (entryPath === fileURLToPath(import.meta.url)) {
  void startFnosServer().catch((error: unknown) => {
    console.error("Failed to start FNOS server", error)
    process.exitCode = 1
  })
}
