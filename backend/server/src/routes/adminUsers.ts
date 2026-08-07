import { Hono } from "hono"
import { z } from "zod"

import type { DbHandle } from "../db"
import type { SyncEnv } from "../userGuard"

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.string().optional(),
})

const banUserSchema = z.object({
  reason: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
})

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  role: z.string().optional(),
})

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8),
})

/**
 * 管理端用户管理路由：列表、创建、编辑、禁用、删除、重置密码
 */
export function createAdminUserRoutes(handle: DbHandle, auth: any) {
  const app = new Hono<SyncEnv>()

  // 获取用户列表（分页）
  app.get("/", async (c) => {
    const limit = Number(c.req.query("limit")) || 100
    const offset = Number(c.req.query("offset")) || 0
    const { rows, total } = await handle.users.getAll(limit, offset)
    return c.json({ data: { rows, total, limit, offset } })
  })

  // 获取单个用户详情
  app.get("/:id", async (c) => {
    const id = c.req.param("id")
    const user = await handle.users.getById(id)
    if (!user) {
      return c.json({ error: { message: "用户不存在" } }, 404)
    }
    return c.json({ data: user })
  })

  // 创建新用户
  app.post("/", async (c) => {
    const body = await c.req.json()
    const parsed = createUserSchema.safeParse(body)
    if (!parsed.success) {
      return c.json({ error: { message: "参数错误", details: parsed.error.issues } }, 400)
    }

    const { email, password, name, role } = parsed.data

    // 检查邮箱是否已存在
    const existing = await handle.users.getByEmail(email)
    if (existing) {
      return c.json({ error: { message: "邮箱已被使用" } }, 400)
    }

    // 使用 better-auth 内部 API 创建用户
    await auth.api.signUpEmail({
      body: { email, password, name },
    })

    // 如果指定了角色，更新角色
    if (role) {
      const newUser = await handle.users.getByEmail(email)
      if (newUser) {
        await handle.users.updateUser(newUser.id, { role })
      }
    }

    return c.json({ data: { email, name } }, 201)
  })

  // 更新用户信息
  app.put("/:id", async (c) => {
    const id = c.req.param("id")
    const body = await c.req.json()
    const parsed = updateUserSchema.safeParse(body)
    if (!parsed.success) {
      return c.json({ error: { message: "参数错误", details: parsed.error.issues } }, 400)
    }

    const user = await handle.users.getById(id)
    if (!user) {
      return c.json({ error: { message: "用户不存在" } }, 404)
    }

    const updates: { name?: string; email?: string; role?: string } = {}
    if (parsed.data.name !== undefined) updates.name = parsed.data.name
    if (parsed.data.email !== undefined) updates.email = parsed.data.email
    if (parsed.data.role !== undefined) updates.role = parsed.data.role

    await handle.users.updateUser(id, updates)
    return c.json({ data: { updated: Object.keys(updates) } })
  })

  // 禁用用户
  app.post("/:id/ban", async (c) => {
    const id = c.req.param("id")
    const body = await c.req.json().catch(() => ({}))
    const parsed = banUserSchema.safeParse(body)
    if (!parsed.success) {
      return c.json({ error: { message: "参数错误", details: parsed.error.issues } }, 400)
    }

    const user = await handle.users.getById(id)
    if (!user) {
      return c.json({ error: { message: "用户不存在" } }, 404)
    }

    const expiresAt = parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined
    await handle.users.banUser(id, parsed.data.reason, expiresAt)
    return c.json({ data: { banned: true } })
  })

  // 解除禁用
  app.post("/:id/unban", async (c) => {
    const id = c.req.param("id")
    const user = await handle.users.getById(id)
    if (!user) {
      return c.json({ error: { message: "用户不存在" } }, 404)
    }

    await handle.users.unbanUser(id)
    return c.json({ data: { banned: false } })
  })

  // 删除用户
  app.delete("/:id", async (c) => {
    const id = c.req.param("id")
    const user = await handle.users.getById(id)
    if (!user) {
      return c.json({ error: { message: "用户不存在" } }, 404)
    }

    await handle.users.deleteUser(id)
    return c.json({ data: { deleted: true } })
  })

  // 重置用户密码
  app.post("/:id/reset-password", async (c) => {
    const id = c.req.param("id")
    const body = await c.req.json()
    const parsed = resetPasswordSchema.safeParse(body)
    if (!parsed.success) {
      return c.json({ error: { message: "参数错误", details: parsed.error.issues } }, 400)
    }

    const user = await handle.users.getById(id)
    if (!user) {
      return c.json({ error: { message: "用户不存在" } }, 404)
    }

    // 使用 better-auth 更新密码
    await auth.api.changePassword({
      body: {
        newPassword: parsed.data.newPassword,
        currentPassword: "", // 管理员重置不需要旧密码
      },
      headers: new Headers(),
      query: {},
      asUser: user.id,
    })

    return c.json({ data: { passwordReset: true } })
  })

  return app
}
