import { Hono } from "hono"

import type { DbHandle } from "../db"
import type { AppEnv } from "../env"

type SystemOptions = { handle: DbHandle; env: AppEnv; startedAt: Date }

/** 管理员专用：运行时系统信息。全部经 requireAdmin。 */
export function createSystemRoutes(options: SystemOptions) {
  const { handle, env, startedAt } = options
  const app = new Hono()

  app.get("/info", async (c) => {
    const uptimeSec = Math.floor((Date.now() - startedAt.getTime()) / 1000)
    const [userCount, syncCount, fileCount] = await Promise.all([
      handle.countUsers(),
      handle.syncedRecords.countsByType().then((m) => Object.values(m).reduce((a, b) => a + b, 0)),
      handle.attachments.listFilesWithRefCount(1, 0).then((r) => r.total),
    ])

    return c.json({
      server: {
        version: "0.0.0",
        startedAt: startedAt.toISOString(),
        uptimeSec,
        node: process.version,
      },
      database: {
        client: env.databaseClient,
        file: env.databaseClient === "sqlite" ? env.databaseFile : null,
        url:
          env.databaseClient === "postgres"
            ? env.databaseUrl.replace(/:\/\/.*@/, "://<hidden>@")
            : null,
      },
      storage: {
        provider: "local",
        uploadsDir: env.uploadsDir,
      },
      counts: { users: userCount, syncRecords: syncCount, attachmentFiles: fileCount },
      auth: {
        baseUrl: env.baseUrl,
        secretConfigured: env.authSecret.length >= 32,
      },
    })
  })

  return app
}
