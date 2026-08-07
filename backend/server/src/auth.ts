import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { APIError } from "better-auth/api"
import { admin, bearer } from "better-auth/plugins"

import type { DbHandle } from "./db"
import type { AppEnv } from "./env"
import type { EmailService } from "./email"

/**
 * 组装 better-auth 实例。
 * 首运行初始化超管：无用户时首个注册者提权为 admin；已有用户时拒绝公开注册。
 */
export function createAuth(handle: DbHandle, env: AppEnv, emailService: EmailService) {
  return betterAuth({
    baseURL: env.baseUrl,
    secret: env.authSecret,
    trustedOrigins: env.corsOrigins,
    database: drizzleAdapter(handle.db, { provider: handle.provider }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      async sendResetPassword({ user, url }) {
        try {
          await emailService.sendTemplatedEmail(user.email, "passwordReset", {
            userName: user.name,
            resetUrl: url,
            expiryHours: 24,
          })
        } catch (error) {
          console.error("[Auth] Failed to send password reset email:", error)
          throw new APIError("BAD_REQUEST", {
            message: "密码重置邮件发送失败，请检查 SMTP 配置或稍后重试",
          })
        }
      },
      async sendVerificationEmail({ user, url }: { user: any; url: string }) {
        try {
          await emailService.sendTemplatedEmail(user.email, "emailVerification", {
            userName: user.name,
            verificationUrl: url,
            expiryHours: 24,
          })
        } catch (error) {
          console.error("[Auth] Failed to send verification email:", error)
          throw new APIError("BAD_REQUEST", {
            message: "验证邮件发送失败，请检查 SMTP 配置或稍后重试",
          })
        }
      },
    },
    plugins: [admin(), bearer()],
    databaseHooks: {
      user: {
        create: {
          async before(user, ctx) {
            const count = await handle.countUsers()
            // 首个用户始终提权为超级管理员（首运行初始化）
            if (count === 0) {
              return { data: { ...user, role: "admin" } }
            }
            // admin 插件创建（/admin/create-user）始终放行
            const path = ctx?.path ?? ""
            if (!path.startsWith("/sign-up")) return undefined
            // 公开注册按系统设置开关；开启时套用默认角色
            const signupEnabled = await handle.settings.get("signupEnabled")
            if (!signupEnabled) {
              throw new APIError("FORBIDDEN", { message: "注册已关闭，请联系管理员创建账号" })
            }
            const defaultRole = await handle.settings.get("defaultRole")
            return { data: { ...user, role: defaultRole } }
          },
        },
      },
    },
  })
}

export type Auth = ReturnType<typeof createAuth>
