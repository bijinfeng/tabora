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
      async sendResetPassword({ user, url }) {
        const siteName = await handle.settings.get("siteName")
        await emailService.sendMail({
          to: user.email,
          subject: `${siteName} - 重置密码`,
          html: `
            <p>您好，</p>
            <p>您请求重置密码。请点击下方链接完成重置：</p>
            <p><a href="${url}">${url}</a></p>
            <p>如果您没有请求重置密码，请忽略此邮件。</p>
            <p>此链接将在一段时间后失效。</p>
          `,
          text: `您好，\n\n您请求重置密码。请访问以下链接完成重置：\n\n${url}\n\n如果您没有请求重置密码，请忽略此邮件。\n此链接将在一段时间后失效。`,
        })
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
