import { createServerFn } from "@tanstack/solid-start"
import { z } from "zod"

import { getAdminSession } from "../session"
import { getRuntime } from "../runtime"
import { adminAuthMiddleware, auditAdminAction, idFrom } from "./middleware"

export type AdminUser = {
  id: string
  email: string
  name: string
  role?: string | null
  banned?: boolean | null
  banReason?: string | null
  createdAt: string | Date
}

const ROLE_VALUES = ["user", "admin"] as const

const listUsersSchema = z.object({
  limit: z.number().int().min(1).max(200).default(20),
  offset: z.number().int().min(0).default(0),
  searchValue: z.string().optional(),
})

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  role: z.enum(ROLE_VALUES).optional(),
})

function hasAdminRole(role: string | null | undefined): boolean {
  return (role ?? "").split(",").includes("admin")
}

export const listUsers = createServerFn({ method: "GET" })
  .validator(listUsersSchema)
  .middleware([adminAuthMiddleware])
  .handler(async ({ data }): Promise<{ users: AdminUser[]; total: number }> => {
    const { handle } = await getRuntime()
    const { rows, total } = await handle.users.getAll(data.limit, data.offset)
    // client-side search filtering when searchValue provided
    const users = data.searchValue
      ? rows.filter((u: AdminUser) =>
          u.email.toLowerCase().includes(data.searchValue!.toLowerCase()),
        )
      : rows
    return { users, total: data.searchValue ? users.length : total }
  })

export const createUser = createServerFn({ method: "POST" })
  .validator(createUserSchema)
  .middleware([
    adminAuthMiddleware,
    auditAdminAction({ action: "POST /admin-api/users", resourceType: "user" }),
  ])
  .handler(async ({ data }): Promise<void> => {
    const { handle, auth } = await getRuntime()
    const existing = await handle.users.getByEmail(data.email)
    if (existing) throw new Error("邮箱已被使用")
    await auth.api.signUpEmail({
      body: { email: data.email, password: data.password, name: data.name },
    })
    if (data.role) {
      const newUser = await handle.users.getByEmail(data.email)
      if (newUser) await handle.users.updateUser(newUser.id, { role: data.role })
    }
  })

export const setRole = createServerFn({ method: "POST" })
  .validator(z.object({ userId: z.string(), role: z.enum(ROLE_VALUES) }))
  .middleware([
    adminAuthMiddleware,
    auditAdminAction({
      action: "POST /admin-api/users/role",
      resourceType: "user",
      resourceId: idFrom("userId"),
    }),
  ])
  .handler(async ({ data }): Promise<void> => {
    const { handle } = await getRuntime()
    const user = await handle.users.getById(data.userId)
    if (!user) throw new Error("用户不存在")
    const demoting = !hasAdminRole(data.role)
    if (demoting && hasAdminRole(user.role)) {
      const session = await getAdminSession()
      if (session?.userId === data.userId) throw new Error("不能降级当前登录的管理员账号")
      const adminCount = await handle.users.countAdmins()
      if (adminCount <= 1) throw new Error("不能降级最后一个管理员")
    }
    await handle.users.updateUser(data.userId, { role: data.role })
  })

export const banUser = createServerFn({ method: "POST" })
  .validator(z.object({ userId: z.string(), banReason: z.string().optional() }))
  .middleware([
    adminAuthMiddleware,
    auditAdminAction({
      action: "POST /admin-api/users/ban",
      resourceType: "user",
      resourceId: idFrom("userId"),
    }),
  ])
  .handler(async ({ data }): Promise<void> => {
    const { handle } = await getRuntime()
    const user = await handle.users.getById(data.userId)
    if (!user) throw new Error("用户不存在")
    await handle.users.banUser(data.userId, data.banReason)
  })

export const unbanUser = createServerFn({ method: "POST" })
  .validator(z.object({ userId: z.string() }))
  .middleware([
    adminAuthMiddleware,
    auditAdminAction({
      action: "POST /admin-api/users/unban",
      resourceType: "user",
      resourceId: idFrom("userId"),
    }),
  ])
  .handler(async ({ data }): Promise<void> => {
    const { handle } = await getRuntime()
    const user = await handle.users.getById(data.userId)
    if (!user) throw new Error("用户不存在")
    await handle.users.unbanUser(data.userId)
  })

export const removeUser = createServerFn({ method: "POST" })
  .validator(z.object({ userId: z.string() }))
  .middleware([
    adminAuthMiddleware,
    auditAdminAction({
      action: "DELETE /admin-api/users",
      resourceType: "user",
      resourceId: idFrom("userId"),
    }),
  ])
  .handler(async ({ data }): Promise<void> => {
    const { handle } = await getRuntime()
    const user = await handle.users.getById(data.userId)
    if (!user) throw new Error("用户不存在")
    const session = await getAdminSession()
    if (session?.userId === data.userId) throw new Error("不能删除当前登录的管理员账号")
    if (hasAdminRole(user.role)) {
      const adminCount = await handle.users.countAdmins()
      if (adminCount <= 1) throw new Error("不能删除最后一个管理员")
    }
    await handle.users.deleteUser(data.userId)
  })
