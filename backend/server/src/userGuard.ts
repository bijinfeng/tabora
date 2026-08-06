import { createMiddleware } from "hono/factory"

import type { Auth } from "./auth"

export type SyncUser = { id: string }
export type SyncEnv = { Variables: { userId: string } }

/**
 * 普通用户鉴权中间件：任何有效 better-auth 会话即可（cookie 或 bearer token）。
 * 通过后把 userId 写入 c.var.userId，供同步端点做 owner 隔离。
 */
export function createRequireUser(auth: Auth) {
  return createMiddleware<SyncEnv>(async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers })
    if (!session) {
      return c.json({ error: { message: "未登录" } }, 401)
    }
    c.set("userId", session.user.id)
    await next()
  })
}
