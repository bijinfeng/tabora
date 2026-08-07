import { ADMIN_API_BASE_URL } from "../../config"

export type SystemInfo = {
  server: {
    version: string
    startedAt: string
    uptimeSec: number
    node: string
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
}

export async function fetchSystemInfo(): Promise<SystemInfo> {
  const res = await fetch(`${ADMIN_API_BASE_URL}/admin-api/system/info`, {
    credentials: "include",
  })
  if (!res.ok) throw new Error(res.status === 403 ? "需要管理员权限" : "加载失败")
  return (await res.json()) as SystemInfo
}
