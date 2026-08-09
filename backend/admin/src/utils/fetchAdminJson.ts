import { ADMIN_API_BASE_URL } from "../config"

export async function fetchAdminJson<T>(path: string): Promise<T> {
  const res = await fetch(`${ADMIN_API_BASE_URL}${path}`, { credentials: "include" })
  if (!res.ok) throw new Error(res.status === 403 ? "需要管理员权限" : "加载失败")
  return (await res.json()) as T
}
