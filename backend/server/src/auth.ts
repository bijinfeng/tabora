import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { APIError } from "better-auth/api"
import { admin } from "better-auth/plugins"

import type { DbHandle } from "./db"
import type { AppEnv } from "./env"

/**
 * 组装 better-auth 实例。
 * 首运行初始化超管：无用户时首个注册者提权为 admin；已有用户时拒绝公开注册。
 */
export function createAuth(handle: DbHandle, env: AppEnv) {
  return betterAuth({
    baseURL: env.baseUrl,
    secret: env.authSecret,
    trustedOrigins: env.corsOrigins,
    database: drizzleAdapter(handle.db, { provider: handle.provider }),
    emailAndPassword: { enabled: true },
    plugins: [admin()],
    databaseHooks: {
      user: {
        create: {
          async before(user, ctx) {
            const count = await handle.countUsers()
            // 首个用户提权为超级管理员
            if (count === 0) {
              return { data: { ...user, role: "admin" } }
            }
            // 已有用户后关闭公开注册；admin 插件的创建（/admin/create-user）放行
            const path = ctx?.path ?? ""
            if (path.startsWith("/sign-up")) {
              throw new APIError("FORBIDDEN", { message: "注册已关闭，请联系管理员创建账号" })
            }
            return undefined
          },
        },
      },
    },
  })
}

export type Auth = ReturnType<typeof createAuth>
