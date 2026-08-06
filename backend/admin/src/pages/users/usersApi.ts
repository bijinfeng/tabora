import { authClient } from "../../auth/authClient"

/** 用户记录（对齐 better-auth admin 插件的 UserWithRole）。 */
export type AdminUser = {
  id: string
  email: string
  name: string
  role?: string | null
  banned?: boolean | null
  banReason?: string | null
  createdAt: string | Date
}

export type ListUsersResult = {
  users: AdminUser[]
  total: number
}

type AdminApi = {
  listUsers: (args: { query: Record<string, unknown> }) => Promise<{
    data?: { users?: AdminUser[]; total?: number } | null
    error?: { message?: string } | null
  }>
  createUser: (args: Record<string, unknown>) => Promise<{ error?: { message?: string } | null }>
  setRole: (args: Record<string, unknown>) => Promise<{ error?: { message?: string } | null }>
  banUser: (args: Record<string, unknown>) => Promise<{ error?: { message?: string } | null }>
  unbanUser: (args: Record<string, unknown>) => Promise<{ error?: { message?: string } | null }>
  removeUser: (args: Record<string, unknown>) => Promise<{ error?: { message?: string } | null }>
}

// better-auth admin client 方法为动态推断，这里收敛为稳定的调用面。
const admin = (authClient as unknown as { admin: AdminApi }).admin

export async function listUsers(query: Record<string, unknown>): Promise<ListUsersResult> {
  const res = await admin.listUsers({ query })
  if (res.error) throw new Error(res.error.message ?? "加载用户失败")
  return { users: res.data?.users ?? [], total: res.data?.total ?? 0 }
}

export async function createUser(input: {
  email: string
  password: string
  name: string
  role: string
}): Promise<void> {
  const res = await admin.createUser(input)
  if (res.error) throw new Error(res.error.message ?? "创建用户失败")
}

export async function setRole(userId: string, role: string): Promise<void> {
  const res = await admin.setRole({ userId, role })
  if (res.error) throw new Error(res.error.message ?? "设置角色失败")
}

export async function banUser(userId: string, banReason: string): Promise<void> {
  const res = await admin.banUser({ userId, banReason })
  if (res.error) throw new Error(res.error.message ?? "封禁失败")
}

export async function unbanUser(userId: string): Promise<void> {
  const res = await admin.unbanUser({ userId })
  if (res.error) throw new Error(res.error.message ?? "解封失败")
}

export async function removeUser(userId: string): Promise<void> {
  const res = await admin.removeUser({ userId })
  if (res.error) throw new Error(res.error.message ?? "删除用户失败")
}
