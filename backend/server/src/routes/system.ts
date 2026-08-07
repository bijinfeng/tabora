import { Hono } from "hono"

import type { DbHandle } from "../db"
import type { AppEnv } from "../env"
import type { EmailQueueProcessor } from "../emailQueueProcessor"

type SystemOptions = {
  handle: DbHandle
  env: AppEnv
  startedAt: Date
  emailProcessor: EmailQueueProcessor
}

/** 管理员专用：运行时系统信息。全部经 requireAdmin。 */
export function createSystemRoutes(options: SystemOptions) {
  const { handle, env, startedAt, emailProcessor } = options
  const app = new Hono()

  app.get("/info", async (c) => {
    const uptimeSec = Math.floor((Date.now() - startedAt.getTime()) / 1000)
    const [userCount, syncCount, fileCount] = await Promise.all([
      handle.countUsers(),
      handle.syncedRecords.countsByType().then((m) => Object.values(m).reduce((a, b) => a + b, 0)),
      handle.attachments.listFilesWithRefCount(1, 0).then((r) => r.total),
    ])

    // SMTP 配置状态
    const smtpHost = await handle.settings.get("smtpHost")
    const smtpPort = await handle.settings.get("smtpPort")
    const smtpFrom = await handle.settings.get("smtpFrom")
    const smtpConfigured = smtpHost !== "" && smtpPort > 0 && smtpFrom !== ""

    // 邮件队列状态
    const emailQueueStats = await emailProcessor.getStats()

    // 进程内存使用
    const memoryUsage = process.memoryUsage()

    return c.json({
      server: {
        version: "0.0.0",
        startedAt: startedAt.toISOString(),
        uptimeSec,
        node: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      memory: {
        rss: Math.floor(memoryUsage.rss / 1024 / 1024),
        heapUsed: Math.floor(memoryUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.floor(memoryUsage.heapTotal / 1024 / 1024),
        external: Math.floor(memoryUsage.external / 1024 / 1024),
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
      smtp: {
        configured: smtpConfigured,
        host: smtpConfigured ? smtpHost : null,
        port: smtpConfigured ? smtpPort : null,
        from: smtpConfigured ? smtpFrom : null,
      },
      emailQueue: emailQueueStats,
    })
  })

  return app
}
