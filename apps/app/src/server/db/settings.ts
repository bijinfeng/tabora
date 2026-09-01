import { eq } from "drizzle-orm"

/** 系统设置的默认值（单一事实源）。GET 未设置时回退此处。 */
export const settingDefaults = {
  // 注册与账号策略
  signupEnabled: false,
  defaultRole: "user",
  requireEmailVerification: false,
  // 附件全局默认
  attachmentMaxSizeBytes: 5_242_880,
  attachmentMimeWhitelist: [] as string[],
  // 站点品牌信息
  siteName: "Tabora",
  contactEmail: "",
  // 邮件 provider（secret 单独脱敏）
  smtpHost: "",
  smtpPort: 587,
  smtpFrom: "",
  smtpUser: "",
  smtpPassword: "",
}

export type Settings = typeof settingDefaults
export type SettingKey = keyof Settings

/** GET 时对外脱敏的 key —— 只回显是否已配置，不回显明文。 */
export const SECRET_KEYS: SettingKey[] = ["smtpPassword"]

export function createSettingsQueries(db: any, table: any) {
  return {
    /** 读取全部设置，未存储的 key 回退默认值。 */
    async getAll(): Promise<Settings> {
      const rows = (await db.select().from(table)) as Array<{ key: string; value: unknown }>
      const stored = Object.fromEntries(rows.map((r) => [r.key, r.value]))
      const result = { ...settingDefaults } as Record<string, unknown>
      for (const key of Object.keys(settingDefaults)) {
        if (key in stored) result[key] = stored[key]
      }
      return result as Settings
    },

    /** 读取单个 key（供 hook 使用）。 */
    async get<K extends SettingKey>(key: K): Promise<Settings[K]> {
      const rows = (await db.select().from(table).where(eq(table.key, key)).limit(1)) as Array<{
        value: unknown
      }>
      return rows[0] ? (rows[0].value as Settings[K]) : settingDefaults[key]
    },

    /** 局部更新：只写传入的 key。 */
    async setMany(patch: Partial<Settings>): Promise<void> {
      for (const [key, value] of Object.entries(patch)) {
        const existing = await db
          .select({ key: table.key })
          .from(table)
          .where(eq(table.key, key))
          .limit(1)
        const values = { key, value, updatedAt: new Date() }
        if (existing[0]) {
          await db.update(table).set({ value, updatedAt: new Date() }).where(eq(table.key, key))
        } else {
          await db.insert(table).values(values)
        }
      }
    },
  }
}

export type SettingsQueries = ReturnType<typeof createSettingsQueries>
