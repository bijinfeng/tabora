import { Hono } from "hono"
import { z } from "zod"

import type { DbHandle } from "../db"
import type { SyncEnv } from "../userGuard"

const createPolicySchema = z.object({
  entityType: z.string().min(1),
  mimeWhitelist: z.array(z.string()).nullable(),
  maxSizeBytes: z.number().int().positive().nullable(),
})

const updatePolicySchema = z.object({
  mimeWhitelist: z.array(z.string()).nullable().optional(),
  maxSizeBytes: z.number().int().positive().nullable().optional(),
})

/**
 * 管理端附件策略路由：列表、创建、更新、删除
 */
export function createAdminAttachmentPolicyRoutes(handle: DbHandle) {
  const app = new Hono<SyncEnv>()

  // 获取所有策略
  app.get("/", async (c) => {
    const policies = await handle.attachments.getAllPolicies()
    return c.json({ data: policies })
  })

  // 获取单个策略
  app.get("/:entityType", async (c) => {
    const entityType = c.req.param("entityType")
    const policy = await handle.attachments.getPolicy(entityType)
    if (!policy) {
      return c.json({ error: { message: "策略不存在" } }, 404)
    }
    return c.json({ data: policy })
  })

  // 创建策略
  app.post("/", async (c) => {
    const body = await c.req.json()
    const parsed = createPolicySchema.safeParse(body)
    if (!parsed.success) {
      return c.json({ error: { message: "参数错误", details: parsed.error.issues } }, 400)
    }

    const { entityType, mimeWhitelist, maxSizeBytes } = parsed.data

    // 检查策略是否已存在
    const existing = await handle.attachments.getPolicy(entityType)
    if (existing) {
      return c.json({ error: { message: "该实体类型的策略已存在" } }, 400)
    }

    await handle.attachments.createPolicy(entityType, mimeWhitelist, maxSizeBytes)
    return c.json({ data: { entityType } }, 201)
  })

  // 更新策略
  app.put("/:entityType", async (c) => {
    const entityType = c.req.param("entityType")
    const body = await c.req.json()
    const parsed = updatePolicySchema.safeParse(body)
    if (!parsed.success) {
      return c.json({ error: { message: "参数错误", details: parsed.error.issues } }, 400)
    }

    const policy = await handle.attachments.getPolicy(entityType)
    if (!policy) {
      return c.json({ error: { message: "策略不存在" } }, 404)
    }

    const updates: { mimeWhitelist?: string[] | null; maxSizeBytes?: number | null } = {}
    if (parsed.data.mimeWhitelist !== undefined) {
      updates.mimeWhitelist = parsed.data.mimeWhitelist
    }
    if (parsed.data.maxSizeBytes !== undefined) {
      updates.maxSizeBytes = parsed.data.maxSizeBytes
    }

    await handle.attachments.updatePolicy(entityType, updates)
    return c.json({ data: { updated: Object.keys(updates) } })
  })

  // 删除策略
  app.delete("/:entityType", async (c) => {
    const entityType = c.req.param("entityType")
    const policy = await handle.attachments.getPolicy(entityType)
    if (!policy) {
      return c.json({ error: { message: "策略不存在" } }, 404)
    }

    await handle.attachments.deletePolicy(entityType)
    return c.json({ data: { deleted: true } })
  })

  return app
}
