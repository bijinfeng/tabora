import cors from "@fastify/cors"
import { fromNodeHeaders } from "better-auth/node"
import Fastify, { type FastifyInstance } from "fastify"

import { createRequireAdmin } from "./adminGuard"
import { createAuth } from "./auth"
import type { DbHandle } from "./db"
import type { AppEnv } from "./env"
import { adminSyncedRecordRoutes } from "./routes/adminSyncedRecords"

export type BuildAppOptions = {
  env: AppEnv
  handle: DbHandle
}

/** 组装 Fastify：CORS(credentials)、better-auth handler、健康检查与初始化状态。 */
export async function buildApp(options: BuildAppOptions): Promise<FastifyInstance> {
  const { env, handle } = options
  const auth = createAuth(handle, env)
  const app = Fastify({ logger: false })

  await app.register(cors, {
    origin: env.corsOrigins.length > 0 ? env.corsOrigins : true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })

  app.get("/api/health", async () => ({ status: "ok" }))

  // 是否已存在管理员：决定控制台首屏进注册还是登录
  app.get("/admin-api/status", async () => ({ hasAdmin: (await handle.countUsers()) > 0 }))

  // better-auth 全部认证端点
  app.route({
    method: ["GET", "POST"],
    url: "/api/auth/*",
    async handler(request, reply) {
      const url = new URL(request.url, env.baseUrl)
      const hasBody = request.body !== undefined && request.body !== null
      const webRequest = new Request(url.toString(), {
        method: request.method,
        headers: fromNodeHeaders(request.headers),
        ...(hasBody ? { body: JSON.stringify(request.body) } : {}),
      })
      const response = await auth.handler(webRequest)
      reply.status(response.status)
      response.headers.forEach((value, key) => reply.header(key, value))
      return reply.send(response.body ? await response.text() : null)
    },
  })

  // 管理员专用：跨 owner 同步记录巡检
  const requireAdmin = createRequireAdmin(auth)
  await app.register(adminSyncedRecordRoutes, { handle, requireAdmin })

  return app
}
