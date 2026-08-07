import { Hono } from "hono"
import { z } from "zod"

import type { DbHandle } from "../db"
import type { AttachmentStorage } from "../attachments/storage"
import { paginated } from "./pagination"
import { parseJsonBody } from "./validate"

type Options = { handle: DbHandle; storage: AttachmentStorage }

const upsertPolicySchema = z.object({
  entity_type: z.string().min(1),
  mime_whitelist: z.array(z.string()).nullable().optional(),
  max_size_bytes: z.number().int().positive().nullable().optional(),
})

/** 管理端附件巡检与策略配置。全部经 requireAdmin。 */
export function createAdminAttachmentRoutes(options: Options) {
  const { handle, storage } = options
  const q = handle.attachments
  const app = new Hono()

  app.get("/files", async (c) => {
    const limit = Math.min(Number(c.req.query("limit") ?? 50) || 50, 200)
    const offset = Math.max(Number(c.req.query("offset") ?? 0) || 0, 0)
    const { rows, total } = await q.listFilesWithRefCount(limit, offset)
    return c.json(paginated(rows, total, limit, offset))
  })

  app.delete("/files/:id", async (c) => {
    const id = Number(c.req.param("id"))
    const file = await q.getFile(id)
    if (file) storage.remove(file.storageKey)
    await q.deleteFile(id)
    return c.body(null, 204)
  })

  app.get("/policies", async (c) => {
    return c.json({ policies: await q.listPolicies() })
  })

  app.put("/policies", async (c) => {
    const result = await parseJsonBody(c, upsertPolicySchema)
    if ("response" in result) return result.response
    const { entity_type, mime_whitelist, max_size_bytes } = result.data
    await q.upsertPolicy({
      id: 0,
      entityType: entity_type,
      mimeWhitelist: mime_whitelist ?? null,
      maxSizeBytes: max_size_bytes ?? null,
    })
    return c.json({ data: { entity_type } })
  })

  return app
}
