import { Hono } from "hono"

import type { DbHandle } from "../db"
import type { AttachmentStorage } from "../attachments/storage"
import { validateAgainstPolicy } from "../attachments/storage"
import type { SyncEnv } from "../userGuard"

type Options = { handle: DbHandle; storage: AttachmentStorage }

function toPolicyInput(
  row: {
    entityType: string
    mimeWhitelist: string[] | null
    maxSizeBytes: number | null
  } | null,
) {
  return row
    ? {
        entityType: row.entityType,
        mimeWhitelist: row.mimeWhitelist,
        maxSizeBytes: row.maxSizeBytes,
      }
    : null
}

/** 用户附件端点：上传、绑定、访问。owner 隔离，全部经 requireUser。 */
export function createAttachmentRoutes(options: Options) {
  const { handle, storage } = options
  const q = handle.attachments
  const app = new Hono<SyncEnv>()

  // 上传：multipart/form-data，字段 file + entity_type
  app.post("/upload", async (c) => {
    const form = await c.req.parseBody()
    const file = form.file
    const entityType = typeof form.entity_type === "string" ? form.entity_type : ""
    if (!(file instanceof File) || !entityType) {
      return c.json({ error: { message: "缺少 file 或 entity_type" } }, 400)
    }
    const bytes = new Uint8Array(await file.arrayBuffer())
    const meta = { mime: file.type || "application/octet-stream", sizeBytes: bytes.byteLength }
    try {
      validateAgainstPolicy(meta, toPolicyInput(await q.getPolicy(entityType)))
    } catch (error) {
      return c.json({ error: { message: (error as Error).message } }, 400)
    }
    const storageKey = storage.save(bytes)
    const fileId = await q.createFile({
      filename: file.name || "file",
      mime: meta.mime,
      sizeBytes: meta.sizeBytes,
      storageKey,
    })
    return c.json({ data: { file_id: fileId, filename: file.name, visibility: "private" } }, 201)
  })

  // 绑定附件到业务实体
  app.post("/:id/bind", async (c) => {
    const userId = c.get("userId")
    const fileId = Number(c.req.param("id"))
    const body = (await c.req.json().catch(() => null)) as {
      entity_type?: string
      entity_id?: string
    } | null
    if (!body?.entity_type || !body?.entity_id) {
      return c.json({ error: { message: "缺少 entity_type 或 entity_id" } }, 400)
    }
    const file = await q.getFile(fileId)
    if (!file) return c.json({ error: { message: "文件不存在" } }, 404)
    await q.addRefIfMissing({
      fileId,
      uploadedBy: userId,
      entityType: body.entity_type,
      entityId: body.entity_id,
    })
    return c.json({ data: { file_id: fileId, refs_count: await q.refsCount(fileId) } })
  })

  app.post("/:id/unbind", async (c) => {
    const userId = c.get("userId")
    const fileId = Number(c.req.param("id"))
    const body = (await c.req.json().catch(() => null)) as {
      entity_type?: string
      entity_id?: string
    } | null
    if (!body?.entity_type || !body?.entity_id) {
      return c.json({ error: { message: "缺少 entity_type 或 entity_id" } }, 400)
    }
    await q.removeRef({
      fileId,
      uploadedBy: userId,
      entityType: body.entity_type,
      entityId: body.entity_id,
    })
    return c.json({ data: { file_id: fileId, refs_count: await q.refsCount(fileId) } })
  })

  // 访问：仅拥有引用的用户可取 URL
  app.get("/:id/access", async (c) => {
    const userId = c.get("userId")
    const fileId = Number(c.req.param("id"))
    if (!(await q.ownsRef(fileId, userId))) {
      return c.json({ error: { message: "附件不存在" } }, 404)
    }
    const file = await q.getFile(fileId)
    return c.json({
      data: {
        file_id: fileId,
        visibility: "private",
        asset_url: file ? storage.assetUrl(file.storageKey) : null,
      },
    })
  })

  return app
}
