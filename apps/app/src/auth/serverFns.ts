import { createServerFn } from "@tanstack/solid-start"

import { getAdminSession, getHasAdmin, type AdminSession } from "../server/session"

/**
 * 读取当前请求的管理员会话。
 * 在登录守卫和 _authed layout beforeLoad 中调用。
 */
export const fetchAdminSession = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdminSession | null> => {
    return getAdminSession()
  },
)

/**
 * 检测是否已有管理员账号。
 * 登录路由 loader 用此决定显示登录还是注册页。
 */
export const fetchHasAdmin = createServerFn({ method: "GET" }).handler(
  async (): Promise<boolean> => {
    return getHasAdmin()
  },
)
