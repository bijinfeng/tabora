import { Hono } from "hono"
import { z } from "zod"

import type { DbHandle } from "../db"
import { SECRET_KEYS, settingDefaults, type SettingKey, type Settings } from "../db/settings"
import type { EmailService } from "../email"
import { parseJsonBody } from "./validate"

const emailField = z.string().refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
  message: "邮箱格式无效",
})

/** 设置局部更新：全部字段可选，字段级校验（端口范围、邮箱格式、默认角色）内置于此。 */
const updateSettingsSchema = z
  .object({
    signupEnabled: z.boolean(),
    defaultRole: z.literal("user", { message: "默认注册角色只能为 user" }),
    requireEmailVerification: z.boolean(),
    attachmentMaxSizeBytes: z.number().int().nonnegative(),
    attachmentMimeWhitelist: z.array(z.string()),
    siteName: z.string(),
    contactEmail: emailField,
    smtpHost: z.string(),
    smtpPort: z
      .number()
      .int()
      .min(1, "SMTP 端口必须在 1-65535 范围内")
      .max(65535, "SMTP 端口必须在 1-65535 范围内"),
    smtpFrom: emailField,
    smtpUser: z.string(),
    smtpPassword: z.string(),
  })
  .partial()

const testSmtpSchema = z.object({
  to: z.string().min(1, "缺少目标邮箱地址"),
})

/** 管理员系统设置：GET(密钥脱敏)、PUT(局部更新)。经 requireAdmin。 */
export function createAdminSettingsRoutes(handle: DbHandle, emailService: EmailService) {
  const app = new Hono()
  const q = handle.settings

  app.get("/", async (c) => {
    const all = await q.getAll()
    // 敏感字段不回显明文，只报告是否已配置
    const redacted = { ...all } as Record<string, unknown>
    for (const key of SECRET_KEYS) {
      redacted[key] = ""
      redacted[`${key}Configured`] = Boolean(all[key])
    }
    return c.json({ settings: redacted })
  })

  app.put("/", async (c) => {
    const result = await parseJsonBody(c, updateSettingsSchema)
    if ("response" in result) return result.response
    const body = result.data

    const patch: Partial<Settings> = {}
    for (const key of Object.keys(settingDefaults) as SettingKey[]) {
      if (!(key in body)) continue
      const value = body[key]
      // 空字符串的密钥视为"不修改"，避免脱敏回显覆盖已存明文
      if (SECRET_KEYS.includes(key) && value === "") continue
      ;(patch as Record<string, unknown>)[key] = value
    }

    // 验证 SMTP 必填字段完整性：如果配置了任一字段，其他字段也必须配置
    const currentSettings = await q.getAll()
    const effectiveSmtp = {
      smtpHost: patch.smtpHost ?? currentSettings.smtpHost,
      smtpPort: patch.smtpPort ?? currentSettings.smtpPort,
      smtpFrom: patch.smtpFrom ?? currentSettings.smtpFrom,
      smtpUser: patch.smtpUser ?? currentSettings.smtpUser,
      smtpPassword: patch.smtpPassword ?? currentSettings.smtpPassword,
    }

    const hasAnySmtp = Object.values(effectiveSmtp).some((v) => v !== "" && v !== 0)
    if (hasAnySmtp) {
      if (
        !effectiveSmtp.smtpHost ||
        !effectiveSmtp.smtpPort ||
        !effectiveSmtp.smtpFrom ||
        !effectiveSmtp.smtpUser ||
        !effectiveSmtp.smtpPassword
      ) {
        return c.json(
          {
            error: {
              message: "配置 SMTP 时必须填写所有字段：主机、端口、发件人、用户名、密码",
            },
          },
          400,
        )
      }
    }

    await q.setMany(patch)
    // SMTP 配置变更后重置邮件服务缓存
    const smtpKeys = ["smtpHost", "smtpPort", "smtpFrom", "smtpUser", "smtpPassword"] as const
    if (smtpKeys.some((k) => k in patch)) {
      emailService.resetCache()
    }
    return c.json({ data: { updated: Object.keys(patch) } })
  })

  app.post("/test-smtp", async (c) => {
    const result = await parseJsonBody(c, testSmtpSchema)
    if ("response" in result) return result.response
    const targetEmail = result.data.to

    try {
      const siteName = await handle.settings.get("siteName")
      await emailService.sendMail({
        to: targetEmail,
        subject: `${siteName} - SMTP 配置测试`,
        html: `
          <p>您好，</p>
          <p>这是一封 SMTP 配置测试邮件。</p>
          <p>如果您收到此邮件，说明 SMTP 配置正确。</p>
          <p>当前配置：</p>
          <ul>
            <li>SMTP 主机：${await handle.settings.get("smtpHost")}</li>
            <li>SMTP 端口：${await handle.settings.get("smtpPort")}</li>
            <li>发件人：${await handle.settings.get("smtpFrom")}</li>
          </ul>
          <p>此邮件由 ${siteName} 系统自动发送。</p>
        `,
        text: `您好，\n\n这是一封 SMTP 配置测试邮件。\n如果您收到此邮件，说明 SMTP 配置正确。\n\n此邮件由 ${siteName} 系统自动发送。`,
      })
      return c.json({ data: { sent: true, to: targetEmail } })
    } catch (error) {
      const message = error instanceof Error ? error.message : "未知错误"
      return c.json({ error: { message: `邮件发送失败: ${message}` } }, 500)
    }
  })

  return app
}
