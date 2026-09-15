import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { APIError } from "better-auth/api"
import { admin, bearer } from "better-auth/plugins"

import type { DbHandle } from "./db"
import type { AppEnv } from "./env"
import type { EmailService } from "./email"
import { resolveTrustedOrigins } from "./trustedOrigins"

/**
 * 组装 better-auth 实例。
 * 首运行初始化超管：无用户时首个注册者提权为 admin；已有用户时拒绝公开注册。
 */
export function createAuth(handle: DbHandle, env: AppEnv, emailService: EmailService) {
  return betterAuth({
    baseURL: env.baseUrl,
    secret: env.authSecret,
    trustedOrigins: (request) => resolveTrustedOrigins(env, request),
    database: drizzleAdapter(handle.db, { provider: handle.provider }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      async sendResetPassword({ user, url }) {
        try {
          await emailService.enqueueTemplatedEmail(user.email, "passwordReset", {
            userName: user.name,
            resetUrl: url,
            expiryHours: 24,
          })
        } catch (error) {
          console.error("[Auth] Failed to enqueue password reset email:", error)
          throw new APIError("BAD_REQUEST", {
            message: "密码重置邮件入队失败，请检查系统配置或稍后重试",
          })
        }
      },
    },
    // sendVerificationEmail 必须挂在 emailVerification 上，放进 emailAndPassword 不会被读取。
    emailVerification: {
      async sendVerificationEmail({ user, url }) {
        try {
          await emailService.enqueueTemplatedEmail(user.email, "emailVerification", {
            userName: user.name,
            verificationUrl: url,
            expiryHours: 24,
          })
        } catch (error) {
          console.error("[Auth] Failed to enqueue verification email:", error)
          throw new APIError("BAD_REQUEST", {
            message: "验证邮件入队失败，请检查系统配置或稍后重试",
          })
        }
      },
      autoSignInAfterVerification: true,
    },
    plugins: [admin(), bearer()],
    databaseHooks: {
      user: {
        create: {
          async before(user, ctx) {
            const count = await handle.countUsers()
            // 首个用户始终提权为超级管理员（首运行初始化）。
            //
            // 同时标记邮箱已验证：requireEmailVerification 开启时，未验证账号无法登录，
            // 而验证邮件依赖 SMTP 设置，SMTP 设置又只能登录后台后才能填写 —— 首个管理员
            // 会被锁在死循环外。首运行时能访问空实例的人即部署者，本就被信任提权为超管，
            // 因此这里直接放行；后续用户仍需走正常邮箱验证。
            if (count === 0) {
              return { data: { ...user, role: "admin", emailVerified: true } }
            }
            // admin 插件创建（/admin/create-user）已过人工审核，直接放行且标记已验证。
            // 管理员是手动创建的，不是公开注册，无需等待邮箱验证即可使用。
            const path = ctx?.path ?? ""
            if (!path.startsWith("/sign-up")) {
              return { data: { ...user, emailVerified: true } }
            }
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
