import { mkdirSync } from "node:fs"
import { dirname, resolve } from "node:path"

import cors from "@fastify/cors"
import fastifyStatic from "@fastify/static"
import Database from "better-sqlite3"
import Fastify, { type FastifyInstance } from "fastify"

const localStoreCollections = [
  "plugin-data",
  "plugin-instances",
  "plugin-records",
  "sync-meta",
  "sync-queue",
  "workspace-snapshots",
  "workspaces",
] as const

type LocalStoreCollection = (typeof localStoreCollections)[number]

type FnosServerOptions = {
  databasePath?: string
  frontendDist?: string
}

function isLocalStoreCollection(value: string): value is LocalStoreCollection {
  return (localStoreCollections as readonly string[]).includes(value)
}

function defaultDatabasePath(): string {
  return process.env.FNOS_DATABASE_PATH ?? resolve(process.cwd(), "data", "tabora.db")
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
  return database
}

export function createFnosServer(options: FnosServerOptions = {}): FastifyInstance {
  const database = createLocalStore(options.databasePath ?? defaultDatabasePath())
  const server = Fastify({ logger: false })

  void server.register(cors, { origin: true })

  server.addHook("onClose", async () => {
    database.close()
  })

  server.get("/api/health", async () => ({ status: "ok" }))

  server.get<{ Params: { collection: string } }>(
    "/api/local-store/:collection",
    async (request, reply) => {
      const { collection } = request.params
      if (!isLocalStoreCollection(collection)) {
        return reply.code(404).send()
      }

      const rows = database
        .prepare("SELECT value_json FROM local_store WHERE collection = ? ORDER BY updated_at ASC")
        .all(collection) as Array<{ value_json: string }>
      return { values: rows.map((row) => JSON.parse(row.value_json)) }
    },
  )

  server.get<{ Params: { collection: string; id: string } }>(
    "/api/local-store/:collection/:id",
    async (request, reply) => {
      const { collection, id } = request.params
      if (!isLocalStoreCollection(collection)) {
        return reply.code(404).send()
      }

      const row = database
        .prepare("SELECT value_json FROM local_store WHERE collection = ? AND id = ?")
        .get(collection, id) as { value_json: string } | undefined
      if (!row) {
        return reply.code(404).send()
      }

      return { value: JSON.parse(row.value_json) }
    },
  )

  server.put<{
    Params: { collection: string; id: string }
    Body: { value?: unknown }
  }>("/api/local-store/:collection/:id", async (request, reply) => {
    const { collection, id } = request.params
    if (!isLocalStoreCollection(collection)) {
      return reply.code(404).send()
    }
    if (!("value" in request.body)) {
      return reply.code(400).send({ error: "Missing request body value" })
    }

    database
      .prepare(
        `INSERT INTO local_store (collection, id, value_json, updated_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(collection, id) DO UPDATE SET
           value_json = excluded.value_json,
           updated_at = excluded.updated_at`,
      )
      .run(collection, id, JSON.stringify(request.body.value), new Date().toISOString())
    return reply.code(204).send()
  })

  server.delete<{ Params: { collection: string; id: string } }>(
    "/api/local-store/:collection/:id",
    async (request, reply) => {
      const { collection, id } = request.params
      if (!isLocalStoreCollection(collection)) {
        return reply.code(404).send()
      }

      database
        .prepare("DELETE FROM local_store WHERE collection = ? AND id = ?")
        .run(collection, id)
      return reply.code(204).send()
    },
  )

  const frontendDist = options.frontendDist ?? process.env.FNOS_FRONTEND_DIST
  if (frontendDist) {
    void server.register(fastifyStatic, { root: resolve(frontendDist) })
  }

  return server
}

async function startFnosServer() {
  const server = createFnosServer()
  const port = Number(process.env.FNOS_PORT ?? 43120)
  await server.listen({ host: "127.0.0.1", port })
}

if (process.argv[1]?.endsWith("server.ts")) {
  void startFnosServer()
}
