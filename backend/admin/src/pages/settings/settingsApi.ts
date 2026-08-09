import { ADMIN_API_BASE_URL } from "../../config"
import { fetchAdminJson } from "../../utils/fetchAdminJson"

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
  const data = await fetchAdminJson<{ settings: SettingsView }>("/admin-api/settings")
  return data.settings
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

export async function testSmtp(to: string): Promise<void> {
  const res = await fetch(`${ADMIN_API_BASE_URL}/admin-api/settings/test-smtp`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error?.message || "测试邮件发送失败")
  }
}
