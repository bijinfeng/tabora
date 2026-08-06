import { Hono } from "hono"

import type { DbHandle } from "../db"
import type { AttachmentStorage } from "../attachments/storage"

type Options = { handle: DbHandle; storage: AttachmentStorage }

/** 管理端附件巡检与策略配置。全部经 requireAdmin。 */
export function createAdminAttachmentRoutes(options: Options) {
  const { handle, storage } = options
  const q = handle.attachments
  const app = new Hono()

  app.get("/files", async (c) => {
    const limit = Math.min(Number(c.req.query("limit") ?? 50) || 50, 200)
    const offset = Math.max(Number(c.req.query("offset") ?? 0) || 0, 0)
    const { rows, total } = await q.listFilesWithRefCount(limit, offset)
    return c.json({ files: rows, total })
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
    const body = (await c.req.json().catch(() => null)) as {
      entity_type?: string
      mime_whitelist?: string[] | null
      max_size_bytes?: number | null
    } | null
    if (!body?.entity_type) {
      return c.json({ error: { message: "缺少 entity_type" } }, 400)
    }
    await q.upsertPolicy({
      id: 0,
      entityType: body.entity_type,
      mimeWhitelist: Array.isArray(body.mime_whitelist) ? body.mime_whitelist : null,
      maxSizeBytes: typeof body.max_size_bytes === "number" ? body.max_size_bytes : null,
    })
    return c.json({ data: { entity_type: body.entity_type } })
  })

  return app
}
