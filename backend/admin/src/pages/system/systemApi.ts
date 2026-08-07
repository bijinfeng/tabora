import { ADMIN_API_BASE_URL } from "../../config"

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

export async function fetchSystemInfo(): Promise<SystemInfo> {
  const res = await fetch(`${ADMIN_API_BASE_URL}/admin-api/system/info`, {
    credentials: "include",
  })
  if (!res.ok) throw new Error(res.status === 403 ? "需要管理员权限" : "加载失败")
  return (await res.json()) as SystemInfo
}
