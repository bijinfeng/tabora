import type { AttachmentStorage } from "./attachments/storage"
import { validateAgainstPolicy } from "./attachments/storage"
import type { DbHandle } from "./db"

type HandlerResult<T> = { status: number; body: T }

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

/** 上传：multipart/form-data，字段 file + entity_type。entity 专属策略优先，缺失回退系统默认。 */
export async function uploadAttachment(
  handle: DbHandle,
  storage: AttachmentStorage,
  form: { file: unknown; entityType: string },
): Promise<HandlerResult<unknown>> {
  const { file, entityType } = form
  if (!(file instanceof File) || !entityType) {
    return { status: 400, body: { error: { message: "缺少 file 或 entity_type" } } }
  }
  const bytes = new Uint8Array(await file.arrayBuffer())
  const meta = { mime: file.type || "application/octet-stream", sizeBytes: bytes.byteLength }
  let policy = toPolicyInput(await handle.attachments.getPolicy(entityType))
  if (!policy) {
    const maxSize = await handle.settings.get("attachmentMaxSizeBytes")
    const globalMimes = await handle.settings.get("attachmentMimeWhitelist")
    policy = {
      entityType,
      mimeWhitelist: globalMimes.length > 0 ? globalMimes : null,
      maxSizeBytes: maxSize > 0 ? maxSize : null,
    }
  }
  try {
    validateAgainstPolicy(meta, policy)
  } catch (error) {
    return { status: 400, body: { error: { message: (error as Error).message } } }
  }
  const storageKey = storage.save(bytes)
  const fileId = await handle.attachments.createFile({
    filename: file.name || "file",
    mime: meta.mime,
    sizeBytes: meta.sizeBytes,
    storageKey,
  })
  return {
    status: 201,
    body: { data: { file_id: fileId, filename: file.name, visibility: "private" } },
  }
}

/** 绑定附件到业务实体。 */
export async function bindAttachment(
  handle: DbHandle,
  userId: string,
  fileId: number,
  body: { entity_type?: string; entity_id?: string } | null,
): Promise<HandlerResult<unknown>> {
  if (!body?.entity_type || !body?.entity_id) {
    return { status: 400, body: { error: { message: "缺少 entity_type 或 entity_id" } } }
  }
  const file = await handle.attachments.getFile(fileId)
  if (!file) return { status: 404, body: { error: { message: "文件不存在" } } }
  await handle.attachments.addRefIfMissing({
    fileId,
    uploadedBy: userId,
    entityType: body.entity_type,
    entityId: body.entity_id,
  })
  return {
    status: 200,
    body: { data: { file_id: fileId, refs_count: await handle.attachments.refsCount(fileId) } },
  }
}

/** 解绑附件。 */
export async function unbindAttachment(
  handle: DbHandle,
  userId: string,
  fileId: number,
  body: { entity_type?: string; entity_id?: string } | null,
): Promise<HandlerResult<unknown>> {
  if (!body?.entity_type || !body?.entity_id) {
    return { status: 400, body: { error: { message: "缺少 entity_type 或 entity_id" } } }
  }
  await handle.attachments.removeRef({
    fileId,
    uploadedBy: userId,
    entityType: body.entity_type,
    entityId: body.entity_id,
  })
  return {
    status: 200,
    body: { data: { file_id: fileId, refs_count: await handle.attachments.refsCount(fileId) } },
  }
}

/** 访问：仅拥有引用的用户可取 URL。 */
export async function accessAttachment(
  handle: DbHandle,
  storage: AttachmentStorage,
  userId: string,
  fileId: number,
): Promise<HandlerResult<unknown>> {
  if (!(await handle.attachments.ownsRef(fileId, userId))) {
    return { status: 404, body: { error: { message: "附件不存在" } } }
  }
  const file = await handle.attachments.getFile(fileId)
  return {
    status: 200,
    body: {
      data: {
        file_id: fileId,
        visibility: "private",
        asset_url: file ? storage.assetUrl(file.storageKey) : null,
      },
    },
  }
}
