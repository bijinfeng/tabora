import { getRequestHeaders } from "@tanstack/solid-start/server"

import { getRuntime } from "./runtime"

export type AdminSession = {
  userId: string
  email: string
  isAdmin: boolean
}

/**
 * 服务端读取当前请求的 better-auth 会话。
 * 在 server function / beforeLoad 服务端执行路径中调用；isAdmin 以 role 含 "admin" 判断。
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const { auth } = await getRuntime()
  const headers = getRequestHeaders()
  const session = await auth.api.getSession({ headers })
  if (!session) return null
  const roles = (session.user.role ?? "").split(",")
  return {
    userId: session.user.id,
    email: session.user.email,
    isAdmin: roles.includes("admin"),
  }
}

/**
 * 是否已存在管理员账号（首运行 bootstrap 决策：进注册还是登录页）。
 */
export async function getHasAdmin(): Promise<boolean> {
  const { handle } = await getRuntime()
  return (await handle.countUsers()) > 0
}
