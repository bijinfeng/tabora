import type { Core } from "@strapi/strapi"
import { z } from "zod"
import { validateFileAgainstPolicy, type AttachmentPolicy } from "../services/attachment"

const REF_UID = "api::attachment-ref.attachment-ref"
const POLICY_UID = "api::attachment-policy.attachment-policy"
const FILE_UID = "plugin::upload.file"

const prepareSchema = z.object({
  entity_type: z.string().trim().min(1).max(128),
  mime_type: z.string().trim().min(1).max(255),
  size_bytes: z.number().int().positive(),
  filename: z.string().trim().min(1).max(255),
})
const commitSchema = z.object({
  file_id: z.number().int().positive(),
  entity_type: z.string().trim().min(1).max(128),
  entity_id: z.string().trim().min(1).max(512),
})
const bindSchema = z.object({
  entity_type: z.string().trim().min(1).max(128),
  entity_id: z.string().trim().min(1).max(512),
})

const controller = ({ strapi }: { strapi: Core.Strapi }) => {
  async function readPolicy(entityType: string): Promise<AttachmentPolicy | null> {
    const row = await strapi.db.query(POLICY_UID).findOne({ where: { entity_type: entityType } })
    if (!row) return null
    return {
      entity_type: row.entity_type,
      mime_whitelist: row.mime_whitelist ?? null,
      max_size_bytes: row.max_size_bytes != null ? Number(row.max_size_bytes) : null,
    }
  }

  async function countOwnedRefs(fileId: number, userId: number): Promise<number> {
    return strapi.db.query(REF_UID).count({ where: { file: fileId, uploaded_by: userId } })
  }

  async function hasOwnedRef(fileId: number, userId: number): Promise<boolean> {
    const ref = await strapi.db.query(REF_UID).findOne({
      where: { file: fileId, uploaded_by: userId },
    })
    return Boolean(ref)
  }

  async function createRefIfMissing(data: {
    file: number
    uploaded_by: number
    entity_type: string
    entity_id: string
  }): Promise<void> {
    const existing = await strapi.db.query(REF_UID).findOne({ where: data })
    if (!existing) await strapi.db.query(REF_UID).create({ data })
  }

  const handlers = {
    async prepare(ctx: any) {
      if (!ctx.state.user?.id) return ctx.unauthorized()
      const p = prepareSchema.safeParse(ctx.request.body)
      if (!p.success) return ctx.badRequest("invalid payload", p.error.issues)
      const policy = await readPolicy(p.data.entity_type)
      if (policy?.mime_whitelist && !policy.mime_whitelist.includes(p.data.mime_type)) {
        return ctx.badRequest(
          `MIME type ${p.data.mime_type} is not allowed for ${p.data.entity_type}`,
        )
      }
      if (policy?.max_size_bytes != null && p.data.size_bytes > policy.max_size_bytes) {
        return ctx.badRequest(`File size exceeds maximum of ${policy.max_size_bytes} bytes`)
      }
      ctx.body = {
        data: {
          entity_type: p.data.entity_type,
          filename: p.data.filename,
          visibility: "private",
          upload: { method: "strapi-upload", endpoint: "/api/upload" },
          ...(policy ? { policy } : {}),
        },
      }
    },

    async commit(ctx: any) {
      const userId = ctx.state.user?.id
      if (!userId) return ctx.unauthorized()
      const p = commitSchema.safeParse(ctx.request.body)
      if (!p.success) return ctx.badRequest("invalid payload", p.error.issues)

      const file = await strapi.db.query(FILE_UID).findOne({ where: { id: p.data.file_id } })
      if (!file) return ctx.notFound("file not found")
      const policy = await readPolicy(p.data.entity_type)
      try {
        validateFileAgainstPolicy(
          {
            id: file.id,
            mime: file.mime,
            size: typeof file.size === "number" ? Math.round(file.size * 1024) : undefined,
          },
          policy,
        )
      } catch (error) {
        return ctx.badRequest((error as Error).message)
      }
      await createRefIfMissing({
        file: p.data.file_id,
        uploaded_by: userId,
        entity_type: p.data.entity_type,
        entity_id: p.data.entity_id,
      })
      ctx.body = {
        data: {
          file_id: p.data.file_id,
          entity_type: p.data.entity_type,
          entity_id: p.data.entity_id,
          visibility: "private",
          refs_count: await countOwnedRefs(p.data.file_id, userId),
        },
      }
    },

    async access(ctx: any) {
      const userId = ctx.state.user?.id
      if (!userId) return ctx.unauthorized()
      const fileId = Number(ctx.params.id)
      if (!(await hasOwnedRef(fileId, userId))) return ctx.notFound("attachment not found")
      const file = await strapi.db.query(FILE_UID).findOne({ where: { id: fileId } })
      ctx.body = {
        data: { file_id: fileId, visibility: "private", asset_url: file?.url ?? null },
      }
    },

    async bind(ctx: any) {
      const userId = ctx.state.user?.id
      if (!userId) return ctx.unauthorized()
      const fileId = Number(ctx.params.id)
      const p = bindSchema.safeParse(ctx.request.body)
      if (!p.success) return ctx.badRequest("invalid payload", p.error.issues)
      const file = await strapi.db.query(FILE_UID).findOne({ where: { id: fileId } })
      if (!file) return ctx.notFound("file not found")
      const policy = await readPolicy(p.data.entity_type)
      try {
        validateFileAgainstPolicy(
          {
            id: file.id,
            mime: file.mime,
            size: typeof file.size === "number" ? Math.round(file.size * 1024) : undefined,
          },
          policy,
        )
      } catch (error) {
        return ctx.badRequest((error as Error).message)
      }
      await createRefIfMissing({
        file: fileId,
        uploaded_by: userId,
        entity_type: p.data.entity_type,
        entity_id: p.data.entity_id,
      })
      ctx.body = { data: { file_id: fileId, refs_count: await countOwnedRefs(fileId, userId) } }
    },

    async unbind(ctx: any) {
      const userId = ctx.state.user?.id
      if (!userId) return ctx.unauthorized()
      const fileId = Number(ctx.params.id)
      const p = bindSchema.safeParse(ctx.request.body)
      if (!p.success) return ctx.badRequest("invalid payload", p.error.issues)
      await strapi.db.query(REF_UID).delete({
        where: {
          file: fileId,
          uploaded_by: userId,
          entity_type: p.data.entity_type,
          entity_id: p.data.entity_id,
        },
      })
      ctx.body = { data: { file_id: fileId, refs_count: await countOwnedRefs(fileId, userId) } }
    },
  }

  return handlers
}

export default controller
