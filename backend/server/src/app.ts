import { Hono } from "hono"
import { cors } from "hono/cors"

import { createRequireAdmin } from "./adminGuard"
import { createAuth } from "./auth"
import type { DbHandle } from "./db"
import type { AppEnv } from "./env"
import { createSyncedRecordRoutes } from "./routes/adminSyncedRecords"
import { createSyncRecordRoutes } from "./routes/syncRecords"
import { createRequireUser } from "./userGuard"

export type BuildAppOptions = {
  env: AppEnv
  handle: DbHandle
}

/** 组装 Hono 应用：CORS(credentials)、better-auth handler、健康检查与管理端点。 */
export function buildApp(options: BuildAppOptions): Hono {
  const { env, handle } = options
  const auth = createAuth(handle, env)
  const app = new Hono()

  app.use(
    "*",
    cors({
      origin: env.corsOrigins.length > 0 ? env.corsOrigins : "*",
      credentials: true,
      allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
    }),
  )

  app.get("/api/health", (c) => c.json({ status: "ok" }))

  // 是否已存在管理员：决定控制台首屏进注册还是登录
  app.get("/admin-api/status", async (c) => c.json({ hasAdmin: (await handle.countUsers()) > 0 }))

  // better-auth 全部认证端点
  app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw))

  // 管理员专用：跨 owner 同步记录巡检（先过 requireAdmin 中间件）
  const requireAdmin = createRequireAdmin(auth)
  app.use("/admin-api/synced-records/*", requireAdmin)
  app.use("/admin-api/synced-records", requireAdmin)
  app.route("/admin-api/synced-records", createSyncedRecordRoutes(handle))

  // 客户端数据同步：任何登录用户（cookie 或 bearer token），owner 隔离
  const requireUser = createRequireUser(auth)
  app.use("/api/sync/*", requireUser)
  app.route("/api/sync", createSyncRecordRoutes(handle))

  return app
}
