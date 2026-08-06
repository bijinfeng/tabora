import { ADMIN_API_BASE_URL } from "../../config"

export type AttachmentFile = {
  id: number
  filename: string
  mime: string
  sizeBytes: number
  storageKey: string
  createdAt: string | number
  refsCount: number
}

export type AttachmentPolicy = {
  id: number
  entityType: string
  mimeWhitelist: string[] | null
  maxSizeBytes: number | null
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${ADMIN_API_BASE_URL}${path}`, { credentials: "include" })
  if (!res.ok) throw new Error(res.status === 403 ? "需要管理员权限" : "加载失败")
  return (await res.json()) as T
}

export async function listFiles(
  limit: number,
  offset: number,
): Promise<{ files: AttachmentFile[]; total: number }> {
  return get(`/admin-api/attachments/files?limit=${limit}&offset=${offset}`)
}

export async function deleteFile(id: number): Promise<void> {
  const res = await fetch(`${ADMIN_API_BASE_URL}/admin-api/attachments/files/${id}`, {
    method: "DELETE",
    credentials: "include",
  })
  if (!res.ok) throw new Error("删除失败")
}

export async function listPolicies(): Promise<AttachmentPolicy[]> {
  const data = await get<{ policies: AttachmentPolicy[] }>("/admin-api/attachments/policies")
  return data.policies
}

export async function upsertPolicy(input: {
  entityType: string
  mimeWhitelist: string[] | null
  maxSizeBytes: number | null
}): Promise<void> {
  const res = await fetch(`${ADMIN_API_BASE_URL}/admin-api/attachments/policies`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      entity_type: input.entityType,
      mime_whitelist: input.mimeWhitelist,
      max_size_bytes: input.maxSizeBytes,
    }),
  })
  if (!res.ok) throw new Error("保存策略失败")
}
