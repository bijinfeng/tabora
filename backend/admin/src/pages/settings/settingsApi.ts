import { ADMIN_API_BASE_URL } from "../../config"

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
  smtpPasswordConfigured?: boolean
}

export async function fetchSettings(): Promise<SettingsView> {
  const res = await fetch(`${ADMIN_API_BASE_URL}/admin-api/settings`, { credentials: "include" })
  if (!res.ok) throw new Error(res.status === 403 ? "需要管理员权限" : "加载失败")
  return (await res.json()).settings as SettingsView
}

export async function saveSettings(patch: Partial<SettingsView>): Promise<void> {
  const res = await fetch(`${ADMIN_API_BASE_URL}/admin-api/settings`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  })
  if (!res.ok) throw new Error("保存失败")
}
