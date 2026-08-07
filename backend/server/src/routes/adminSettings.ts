import { Hono } from "hono"

import type { DbHandle } from "../db"
import { SECRET_KEYS, settingDefaults, type SettingKey, type Settings } from "../db/settings"

/** 管理员系统设置：GET(密钥脱敏)、PUT(局部更新)。经 requireAdmin。 */
export function createAdminSettingsRoutes(handle: DbHandle) {
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
      // 空字符串的密钥视为“不修改”，避免脱敏回显覆盖已存明文
      if (SECRET_KEYS.includes(key) && value === "") continue
      ;(patch as Record<string, unknown>)[key] = value
    }
    await q.setMany(patch)
    return c.json({ data: { updated: Object.keys(patch) } })
  })

  return app
}
