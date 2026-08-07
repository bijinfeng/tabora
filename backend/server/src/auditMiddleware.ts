import type { Context, Next } from "hono"

import type { Auth } from "./auth"
import type { DbHandle } from "./db"

/**
 * 审计日志中间件：自动记录管理员操作
 */
export function createAuditMiddleware(handle: DbHandle, auth: Auth) {
  return async (c: Context, next: Next) => {
    const method = c.req.method

    // 只记录修改操作（POST/PUT/DELETE/PATCH）
    if (!["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
      return next()
    }

    await next()

    // 只在成功时记录（2xx 状态码）
    if (c.res.status >= 200 && c.res.status < 300) {
      const session = await auth.api.getSession({ headers: c.req.raw.headers })
      const userId = session?.user?.id

      const path = c.req.path
      const action = `${method} ${path}`
      const ipAddress = c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown"
      const userAgent = c.req.header("user-agent") || "unknown"

      // 提取资源类型和 ID
      let resourceType: string | undefined
      let resourceId: string | undefined

      if (path.startsWith("/admin-api/users/")) {
        resourceType = "user"
        const parts = path.split("/")
        resourceId = parts[3]
      } else if (path.startsWith("/admin-api/attachment-policies/")) {
        resourceType = "attachment_policy"
        const parts = path.split("/")
        resourceId = parts[3]
      } else if (path.startsWith("/admin-api/settings")) {
        resourceType = "settings"
      } else if (path.startsWith("/admin-api/synced-records/")) {
        resourceType = "synced_record"
        const parts = path.split("/")
        resourceId = parts[3]
      }

      // 异步记录，不阻塞响应
      handle.auditLog
        .create({
          userId: userId ?? null,
          action,
          resourceType: resourceType ?? null,
          resourceId: resourceId ?? null,
          ipAddress,
          userAgent,
        })
        .catch((err) => {
          console.error("Failed to log audit entry:", err)
        })
    }
  }
}
