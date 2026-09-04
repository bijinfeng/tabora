import { createServerFn } from "@tanstack/solid-start"
import { z } from "zod"

import { SECRET_KEYS, settingDefaults, type SettingKey, type Settings } from "../db/settings"
import { getRuntime } from "../runtime"
import { adminAuthMiddleware, auditAdminAction } from "./middleware"

export type SettingsView = {
  signupEnabled: boolean
  defaultRole: string
  requireEmailVerification: boolean
  attachmentMaxSizeBytes: number
  attachmentMimeWhitelist: string[]
  siteName: string
  contactEmail: string
  smtpHost: string
  smtpPort: number
  smtpFrom: string
  smtpUser: string
  smtpPassword: string
  aiMonthlyRequestLimit: number
  aiMonthlyTokenLimit: number
  smtpPasswordConfigured?: boolean
}

const emailField = z.string().refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
  message: "邮箱格式无效",
})

const updateSettingsSchema = z
  .object({
    signupEnabled: z.boolean(),
    defaultRole: z.literal("user"),
    requireEmailVerification: z.boolean(),
    attachmentMaxSizeBytes: z.number().int().nonnegative(),
    attachmentMimeWhitelist: z.array(z.string()),
    siteName: z.string(),
    contactEmail: emailField,
    smtpHost: z.string(),
    smtpPort: z.number().int().min(1).max(65535),
    smtpFrom: emailField,
    smtpUser: z.string(),
    smtpPassword: z.string(),
    aiMonthlyRequestLimit: z.number().int().nonnegative(),
    aiMonthlyTokenLimit: z.number().int().nonnegative(),
  })
  .partial()

export const fetchSettings = createServerFn({ method: "GET" })
  .middleware([adminAuthMiddleware])
  .handler(async (): Promise<SettingsView> => {
    const { handle } = await getRuntime()
    const all = await handle.settings.getAll()
    const result = { ...all } as Record<string, unknown>
    for (const key of SECRET_KEYS) {
      result[key] = ""
      result[`${key}Configured`] = Boolean(all[key])
    }
    return result as SettingsView
  })

export const saveSettings = createServerFn({ method: "POST" })
  .validator(updateSettingsSchema)
  .middleware([
    adminAuthMiddleware,
    auditAdminAction({ action: "POST /admin-api/settings", resourceType: "settings" }),
  ])
  .handler(async ({ data }): Promise<void> => {
    const { handle, emailService } = await getRuntime()
    const q = handle.settings

    const patch: Partial<Settings> = {}
    for (const key of Object.keys(settingDefaults) as SettingKey[]) {
      if (!(key in data)) continue
      const value = (data as Record<string, unknown>)[key]
      // 空字符串的密钥视为"不修改"
      if (SECRET_KEYS.includes(key) && value === "") continue
      ;(patch as Record<string, unknown>)[key] = value
    }

    // SMTP 字段完整性校验
    const currentSettings = await q.getAll()
    const effectiveSmtp = {
      smtpHost: patch.smtpHost ?? currentSettings.smtpHost,
      smtpPort: patch.smtpPort ?? currentSettings.smtpPort,
      smtpFrom: patch.smtpFrom ?? currentSettings.smtpFrom,
      smtpUser: patch.smtpUser ?? currentSettings.smtpUser,
      smtpPassword: patch.smtpPassword ?? currentSettings.smtpPassword,
    }
    const hasAnySmtp = Object.values(effectiveSmtp).some((v) => v !== "" && v !== 0)
    if (
      hasAnySmtp &&
      (!effectiveSmtp.smtpHost ||
        !effectiveSmtp.smtpPort ||
        !effectiveSmtp.smtpFrom ||
        !effectiveSmtp.smtpUser ||
        !effectiveSmtp.smtpPassword)
    ) {
      throw new Error("配置 SMTP 时必须填写所有字段：主机、端口、发件人、用户名、密码")
    }

    await q.setMany(patch)
    const smtpKeys = ["smtpHost", "smtpPort", "smtpFrom", "smtpUser", "smtpPassword"] as const
    if (smtpKeys.some((k) => k in patch)) {
      emailService.resetCache()
    }
  })

export const testSmtp = createServerFn({ method: "POST" })
  .validator(z.object({ to: z.string().min(1) }))
  .middleware([
    adminAuthMiddleware,
    auditAdminAction({
      action: "POST /admin-api/settings/test-smtp",
      resourceType: "settings",
    }),
  ])
  .handler(async ({ data }): Promise<void> => {
    const { handle, emailService } = await getRuntime()
    const siteName = await handle.settings.get("siteName")
    try {
      await emailService.sendMail({
        to: data.to,
        subject: `${siteName} - SMTP 配置测试`,
        html: `<p>这是一封 SMTP 配置测试邮件。如果您收到此邮件，说明 SMTP 配置正确。</p>`,
        text: `这是一封 SMTP 配置测试邮件。如果您收到此邮件，说明 SMTP 配置正确。`,
      })
    } catch (err) {
      throw new Error(`邮件发送失败: ${err instanceof Error ? err.message : "未知错误"}`)
    }
  })
