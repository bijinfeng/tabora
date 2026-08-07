import { Hono } from "hono"
import { cors } from "hono/cors"

import { createRequireAdmin } from "./adminGuard"
import { createLocalAttachmentStorage } from "./attachments/storage"
import { createAuth } from "./auth"
import type { DbHandle } from "./db"
import { createEmailService } from "./email"
import { createEmailQueueProcessor } from "./emailQueueProcessor"
import type { AppEnv } from "./env"
import { createAdminAttachmentRoutes } from "./routes/adminAttachments"
import { createAdminAttachmentPolicyRoutes } from "./routes/adminAttachmentPolicies"
import { createAdminEmailQueueRoutes } from "./routes/adminEmailQueue"
import { createAdminUserRoutes } from "./routes/adminUsers"
import { createSyncedRecordRoutes } from "./routes/adminSyncedRecords"
import { createAttachmentRoutes } from "./routes/attachments"
import { createAdminSettingsRoutes } from "./routes/adminSettings"
import { createSyncRecordRoutes } from "./routes/syncRecords"
import { createSystemRoutes } from "./routes/system"
import { createRequireUser } from "./userGuard"

export type BuildAppOptions = {
  env: AppEnv
  handle: DbHandle
  startedAt: Date
}

/** 组装 Hono 应用：CORS(credentials)、better-auth handler、健康检查与管理端点。 */
export function buildApp(options: BuildAppOptions): Hono {
  const { env, handle, startedAt } = options
  const emailService = createEmailService(handle)
  const auth = createAuth(handle, env, emailService)
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

  // 管理端用户管理
  app.use("/admin-api/users/*", requireAdmin)
  app.use("/admin-api/users", requireAdmin)
  app.route("/admin-api/users", createAdminUserRoutes(handle, auth))

  // 客户端数据同步：任何登录用户（cookie 或 bearer token），owner 隔离
  const requireUser = createRequireUser(auth)
  app.use("/api/sync/*", requireUser)
  app.route("/api/sync", createSyncRecordRoutes(handle))

  // 附件：用户上传/绑定/访问（登录用户），管理端列文件/策略（管理员）
  const storage = createLocalAttachmentStorage(env.uploadsDir)
  app.use("/api/attachments/*", requireUser)
  app.route("/api/attachments", createAttachmentRoutes({ handle, storage }))
  app.use("/admin-api/attachments/*", requireAdmin)
  app.route("/admin-api/attachments", createAdminAttachmentRoutes({ handle, storage }))

  // 管理端附件策略
  app.use("/admin-api/attachment-policies/*", requireAdmin)
  app.use("/admin-api/attachment-policies", requireAdmin)
  app.route("/admin-api/attachment-policies", createAdminAttachmentPolicyRoutes(handle))

  // 系统监控：运行时信息与统计（管理员专用）
  app.use("/admin-api/system/*", requireAdmin)
  app.route("/admin-api/system", createSystemRoutes({ handle, env, startedAt }))

  // 系统设置：可编辑配置项（管理员专用）
  app.use("/admin-api/settings/*", requireAdmin)
  app.use("/admin-api/settings", requireAdmin)
  app.route("/admin-api/settings", createAdminSettingsRoutes(handle, emailService))

  // 管理端邮件队列历史与清理
  app.use("/admin-api/email-queue/*", requireAdmin)
  app.use("/admin-api/email-queue", requireAdmin)
  app.route("/admin-api/email-queue", createAdminEmailQueueRoutes(handle))

  // 启动邮件队列处理器
  const queueProcessor = createEmailQueueProcessor(handle, emailService)
  queueProcessor.start(5000)

  return app
}
