import { createMiddleware } from "hono/factory"

import type { Auth } from "./auth"

/**
 * 管理员鉴权中间件工厂：校验 better-auth 会话且 role 含 admin，否则 401/403。
 */
export function createRequireAdmin(auth: Auth) {
  return createMiddleware(async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers })
    if (!session) {
      return c.json({ error: { message: "未登录" } }, 401)
    }
    const roles = (session.user.role ?? "").split(",")
    if (!roles.includes("admin")) {
      return c.json({ error: { message: "需要管理员权限" } }, 403)
    }
    await next()
  })
}
