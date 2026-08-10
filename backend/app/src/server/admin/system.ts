import { createServerFn } from "@tanstack/solid-start"

import { DEV_PLACEHOLDER_SECRET } from "../env"
import { getRuntime } from "../runtime"
import { adminAuthMiddleware } from "./middleware"

export type SystemInfo = {
  server: {
    version: string
    startedAt: string
    uptimeSec: number
    node: string
    platform: string
    arch: string
  }
  memory: {
    rss: number
    heapUsed: number
    heapTotal: number
    external: number
  }
  database: {
    client: "sqlite" | "postgres"
    file: string | null
    url: string | null
  }
  storage: {
    provider: string
    uploadsDir: string
  }
  counts: {
    users: number
    syncRecords: number
    attachmentFiles: number
  }
  auth: {
    baseUrl: string
    secretConfigured: boolean
  }
  smtp: {
    configured: boolean
    host: string | null
    port: number | null
    from: string | null
  }
  emailQueue: {
    pending: number
    active: number
    completed: number
    failed: number
  }
}

export const fetchSystemInfo = createServerFn({ method: "GET" })
  .middleware([adminAuthMiddleware])
  .handler(async (): Promise<SystemInfo> => {
    const { handle, env, startedAt, emailProcessor } = await getRuntime()

    const uptimeSec = Math.floor((Date.now() - startedAt.getTime()) / 1000)
    const [userCount, syncCount, fileResult] = await Promise.all([
      handle.countUsers(),
      handle.syncedRecords.countsByType().then((m) => Object.values(m).reduce((a, b) => a + b, 0)),
      handle.attachments.listFilesWithRefCount(1, 0),
    ])

    const [smtpHost, smtpPort, smtpFrom] = await Promise.all([
      handle.settings.get("smtpHost"),
      handle.settings.get("smtpPort"),
      handle.settings.get("smtpFrom"),
    ])
    const smtpConfigured = smtpHost !== "" && smtpPort > 0 && smtpFrom !== ""
    const emailQueueStats = await emailProcessor.getStats()
    const mem = process.memoryUsage()

    return {
      server: {
        version: "0.0.0",
        startedAt: startedAt.toISOString(),
        uptimeSec,
        node: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      memory: {
        rss: Math.floor(mem.rss / 1024 / 1024),
        heapUsed: Math.floor(mem.heapUsed / 1024 / 1024),
        heapTotal: Math.floor(mem.heapTotal / 1024 / 1024),
        external: Math.floor(mem.external / 1024 / 1024),
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
      counts: { users: userCount, syncRecords: syncCount, attachmentFiles: fileResult.total },
      auth: {
        baseUrl: env.baseUrl,
        secretConfigured: env.authSecret.length >= 32 && env.authSecret !== DEV_PLACEHOLDER_SECRET,
      },
      smtp: {
        configured: smtpConfigured,
        host: smtpConfigured ? smtpHost : null,
        port: smtpConfigured ? smtpPort : null,
        from: smtpConfigured ? smtpFrom : null,
      },
      emailQueue: {
        pending: emailQueueStats.pending,
        active: emailQueueStats.processing,
        completed: emailQueueStats.sent,
        failed: emailQueueStats.failed,
      },
    }
  })
