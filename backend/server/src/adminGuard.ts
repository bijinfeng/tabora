import { fromNodeHeaders } from "better-auth/node"
import type { FastifyReply, FastifyRequest } from "fastify"

import type { Auth } from "./auth"

/**
 * 管理员鉴权守卫工厂：校验 better-auth 会话且 role 含 admin。
 * 用作受保护路由的 preHandler。
 */
export function createRequireAdmin(auth: Auth) {
  return async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(request.headers) })
    if (!session) {
      return reply.code(401).send({ error: { message: "未登录" } })
    }
    const roles = (session.user.role ?? "").split(",")
    if (!roles.includes("admin")) {
      return reply.code(403).send({ error: { message: "需要管理员权限" } })
    }
  }
}
