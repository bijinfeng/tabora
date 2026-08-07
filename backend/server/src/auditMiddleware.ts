import type { Context, Next } from "hono"

import type { Auth } from "./auth"
import type { DbHandle } from "./db"

/** admin-api 路径前缀到资源类型的映射（最长前缀优先匹配）。 */
const RESOURCE_TYPE_MAP: Record<string, string> = {
  "/admin-api/users": "user",
  "/admin-api/synced-records": "synced_record",
  "/admin-api/attachments/files": "attachment_file",
  "/admin-api/attachment-policies": "attachment_policy",
  "/admin-api/settings": "settings",
  "/admin-api/audit-log": "audit_log",
  "/admin-api/email-queue": "email_queue",
  "/admin-api/system": "system",
}

/** 需要脱敏的敏感字段名（大小写不敏感匹配）。 */
const SENSITIVE_KEYS = ["password", "secret", "token", "apikey", "api_key", "credential"]

/**
 * 递归脱敏对象中的敏感字段，返回可安全存储的副本。
 */
export function redactSensitive(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redactSensitive)
  }
  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      const isSensitive = SENSITIVE_KEYS.some((s) => key.toLowerCase().includes(s))
      result[key] = isSensitive ? "[REDACTED]" : redactSensitive(val)
    }
    return result
  }
  return value
}

/**
 * 根据路径匹配资源类型与资源 ID。
 * 使用最长前缀匹配，避免 /attachments/files 被 /attachments 抢先命中。
 */
export function resolveResource(path: string): {
  resourceType: string | null
  resourceId: string | null
} {
  const prefixes = Object.keys(RESOURCE_TYPE_MAP).sort((a, b) => b.length - a.length)
  for (const prefix of prefixes) {
    if (path === prefix || path.startsWith(`${prefix}/`)) {
      const rest = path.slice(prefix.length).replace(/^\//, "")
      const resourceId = rest ? (rest.split("/")[0] ?? null) : null
      return { resourceType: RESOURCE_TYPE_MAP[prefix] ?? null, resourceId }
    }
  }
  return { resourceType: null, resourceId: null }
}

/**
 * 读取并脱敏请求体，用于写操作的 details 记录。
 * 使用 clone 避免消费掉下游 handler 需要的请求体。
 */
async function extractDetails(c: Context): Promise<string | null> {
  const contentType = c.req.header("content-type") ?? ""
  if (!contentType.includes("application/json")) {
    return null
  }
  try {
    const cloned = c.req.raw.clone()
    const body = await cloned.json()
    const redacted = redactSensitive(body)
    return JSON.stringify(redacted)
  } catch {
    return null
  }
}

/**
 * 审计日志中间件：自动记录管理员的写操作（成功与失败）。
 */
export function createAuditMiddleware(handle: DbHandle, auth: Auth) {
  return async (c: Context, next: Next) => {
    const method = c.req.method

    // 只记录修改操作（POST/PUT/DELETE/PATCH）
    if (!["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
      return next()
    }

    // 在 handler 消费请求体之前先克隆读取，避免竞争
    const details =
      method === "PUT" || method === "PATCH" || method === "POST" ? await extractDetails(c) : null

    await next()

    const status = c.res.status
    // 记录成功（2xx）与失败（4xx/5xx）；忽略 3xx 重定向
    const isSuccess = status >= 200 && status < 300
    const isFailure = status >= 400
    if (!isSuccess && !isFailure) {
      return
    }

    const session = await auth.api.getSession({ headers: c.req.raw.headers })
    const userId = session?.user?.id

    const path = c.req.path
    const action = isFailure ? `[FAILED ${status}] ${method} ${path}` : `${method} ${path}`
    const ipAddress = c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown"
    const userAgent = c.req.header("user-agent") || "unknown"

    const { resourceType, resourceId } = resolveResource(path)

    // 异步记录，不阻塞响应
    handle.auditLog
      .create({
        userId: userId ?? null,
        action,
        resourceType,
        resourceId,
        details,
        ipAddress,
        userAgent,
      })
      .catch((err) => {
        console.error("Failed to log audit entry:", err)
      })
  }
}
