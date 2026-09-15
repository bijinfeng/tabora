import { createMiddleware } from "@tanstack/solid-start"
import { getRequestHeader, setResponseStatus } from "@tanstack/solid-start/server"

import { getRuntime } from "../runtime"
import { getAdminSession } from "../session"
import { buildDetails, extractResourceId, type AuditDescriptor } from "./auditPayload"

/**
 * 管理员 server function 的授权与审计中间件。
 *
 * 旧 Hono 后端把 adminGuard 与 auditMiddleware 全局挂在 `/admin-api/*` 上。
 * 在 TanStack Start 中每个 server function 编译为独立可直接调用的 HTTP 端点，
 * 路由 beforeLoad 只拦页面导航、拦不住 server function 调用，
 * 因此授权与审计必须挂到每个 admin server function 上。
 */

export { idFrom, redactSensitive } from "./auditPayload"
export type { AuditDescriptor }

/**
 * 授权中间件：未登录 401、非管理员 403，并把 userId 放入 context 供审计复用。
 *
 * 设置响应状态后抛错：Start 会把错误序列化回调用方，
 * 管理端可以展示错误并回到登录页，拒绝路径可恢复。
 */
export const adminAuthMiddleware = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const session = await getAdminSession()
    if (!session) {
      setResponseStatus(401)
      throw new Error("未登录")
    }
    if (!session.isAdmin) {
      setResponseStatus(403)
      throw new Error("需要管理员权限")
    }
    return next({ context: { adminUserId: session.userId } })
  },
)

/**
 * 审计中间件：记录管理员的写操作，成功与失败都记录。
 *
 * 与旧实现的差异：server function 的失败是抛出的错误而不是 HTTP 状态码，
 * 无法还原旧的 `[FAILED 400]` 具体状态，因此失败统一记为 `[FAILED]` 前缀，
 * 并把错误信息写入 details。
 */
export function auditAdminAction(descriptor: AuditDescriptor) {
  // 依赖 adminAuthMiddleware：既让 context.adminUserId 获得类型，
  // 也保证"被审计的操作一定先经过授权"由结构保证而非调用约定。
  return createMiddleware({ type: "function" })
    .middleware([adminAuthMiddleware])
    .server(async ({ data, context, next }) => {
      const { adminUserId } = context
      const input = data as Record<string, unknown> | undefined

      const ipAddress =
        getRequestHeader("x-forwarded-for") ?? getRequestHeader("x-real-ip") ?? "unknown"
      const userAgent = getRequestHeader("user-agent") ?? "unknown"
      const resourceId = extractResourceId(descriptor, input)

      const record = (action: string, errorMessage?: string) => {
        // 异步记录，不阻塞响应
        void getRuntime()
          .then(({ handle }) =>
            handle.auditLog.create({
              userId: adminUserId ?? null,
              action,
              resourceType: descriptor.resourceType,
              resourceId,
              details: buildDetails(input, errorMessage),
              ipAddress,
              userAgent,
            }),
          )
          .catch((err: unknown) => {
            console.error("Failed to log audit entry:", err)
          })
      }

      try {
        const result = await next()
        record(descriptor.action)
        return result
      } catch (error) {
        record(
          `[FAILED] ${descriptor.action}`,
          error instanceof Error ? error.message : String(error),
        )
        throw error
      }
    })
}
