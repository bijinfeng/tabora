import { Hono } from "hono"

import type { DbHandle } from "../db"
import { SECRET_KEYS, settingDefaults, type SettingKey, type Settings } from "../db/settings"
import type { EmailService } from "../email"

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
    const body = (await c.req.json().catch(() => null)) as Partial<Settings> | null
    if (!body || typeof body !== "object") {
      return c.json({ error: { message: "invalid payload" } }, 400)
    }
    const patch: Partial<Settings> = {}
    for (const key of Object.keys(settingDefaults) as SettingKey[]) {
      if (!(key in body)) continue
      const value = body[key]
      // 空字符串的密钥视为"不修改"，避免脱敏回显覆盖已存明文
      if (SECRET_KEYS.includes(key) && value === "") continue
      ;(patch as Record<string, unknown>)[key] = value
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
    const body = (await c.req.json().catch(() => null)) as { to?: string } | null
    const targetEmail = body?.to

    if (!targetEmail) {
      return c.json({ error: { message: "缺少目标邮箱地址" } }, 400)
    }

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
