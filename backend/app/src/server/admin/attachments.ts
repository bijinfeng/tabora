import { createServerFn } from "@tanstack/solid-start"
import { z } from "zod"

import type { PolicyRow, FileRow } from "../db/attachments"
import { getRuntime } from "../runtime"
import { adminAuthMiddleware, auditAdminAction, idFrom } from "./middleware"

export type AttachmentFile = FileRow & { refsCount: number }
export type AttachmentPolicy = PolicyRow

const createPolicySchema = z.object({
  entityType: z.string().min(1),
  mimeWhitelist: z.array(z.string()).nullable(),
  maxSizeBytes: z.number().int().positive().nullable(),
})

const updatePolicySchema = z.object({
  entityType: z.string().min(1),
  mimeWhitelist: z.array(z.string()).nullable().optional(),
  maxSizeBytes: z.number().int().positive().nullable().optional(),
})

export const listFiles = createServerFn({ method: "GET" })
  .validator(z.object({ limit: z.number().int().min(1).max(200), offset: z.number().int().min(0) }))
  .middleware([adminAuthMiddleware])
  .handler(async ({ data }): Promise<{ files: AttachmentFile[]; total: number }> => {
    const { handle } = await getRuntime()
    const { rows, total } = await handle.attachments.listFilesWithRefCount(data.limit, data.offset)
    return { files: rows, total }
  })

export const deleteFile = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.number().int() }))
  .middleware([
    adminAuthMiddleware,
    auditAdminAction({
      action: "DELETE /admin-api/attachments/files",
      resourceType: "attachment_file",
      resourceId: idFrom("id"),
    }),
  ])
  .handler(async ({ data }): Promise<void> => {
    const { handle } = await getRuntime()
    await handle.attachments.deleteFile(data.id)
  })

export const listPolicies = createServerFn({ method: "GET" })
  .middleware([adminAuthMiddleware])
  .handler(async (): Promise<AttachmentPolicy[]> => {
    const { handle } = await getRuntime()
    return handle.attachments.listPolicies()
  })

export const createPolicy = createServerFn({ method: "POST" })
  .validator(createPolicySchema)
  .middleware([
    adminAuthMiddleware,
    auditAdminAction({
      action: "POST /admin-api/attachment-policies",
      resourceType: "attachment_policy",
      resourceId: idFrom("entityType"),
    }),
  ])
  .handler(async ({ data }): Promise<void> => {
    const { handle } = await getRuntime()
    const existing = await handle.attachments.getPolicy(data.entityType)
    if (existing) throw new Error("该实体类型的策略已存在")
    await handle.attachments.createPolicy(data.entityType, data.mimeWhitelist, data.maxSizeBytes)
  })

export const updatePolicy = createServerFn({ method: "POST" })
  .validator(updatePolicySchema)
  .middleware([
    adminAuthMiddleware,
    auditAdminAction({
      action: "PUT /admin-api/attachment-policies",
      resourceType: "attachment_policy",
      resourceId: idFrom("entityType"),
    }),
  ])
  .handler(async ({ data }): Promise<void> => {
    const { handle } = await getRuntime()
    const policy = await handle.attachments.getPolicy(data.entityType)
    if (!policy) throw new Error("策略不存在")
    const updates: { mimeWhitelist?: string[] | null; maxSizeBytes?: number | null } = {}
    if (data.mimeWhitelist !== undefined) updates.mimeWhitelist = data.mimeWhitelist
    if (data.maxSizeBytes !== undefined) updates.maxSizeBytes = data.maxSizeBytes
    await handle.attachments.updatePolicy(data.entityType, updates)
  })

export const deletePolicy = createServerFn({ method: "POST" })
  .validator(z.object({ entityType: z.string().min(1) }))
  .middleware([
    adminAuthMiddleware,
    auditAdminAction({
      action: "DELETE /admin-api/attachment-policies",
      resourceType: "attachment_policy",
      resourceId: idFrom("entityType"),
    }),
  ])
  .handler(async ({ data }): Promise<void> => {
    const { handle } = await getRuntime()
    const policy = await handle.attachments.getPolicy(data.entityType)
    if (!policy) throw new Error("策略不存在")
    await handle.attachments.deletePolicy(data.entityType)
  })

export const upsertPolicy = createServerFn({ method: "POST" })
  .validator(createPolicySchema)
  .middleware([
    adminAuthMiddleware,
    auditAdminAction({
      action: "PUT /admin-api/attachment-policies",
      resourceType: "attachment_policy",
      resourceId: idFrom("entityType"),
    }),
  ])
  .handler(async ({ data }): Promise<void> => {
    const { handle } = await getRuntime()
    await handle.attachments.upsertPolicy({
      id: 0, // ignored by upsert
      entityType: data.entityType,
      mimeWhitelist: data.mimeWhitelist,
      maxSizeBytes: data.maxSizeBytes,
    })
  })
