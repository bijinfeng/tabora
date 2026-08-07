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
  const data = await get<{ data: AttachmentPolicy[] }>("/admin-api/attachment-policies")
  return data.data
}

export async function createPolicy(input: {
  entityType: string
  mimeWhitelist: string[] | null
  maxSizeBytes: number | null
}): Promise<void> {
  const res = await fetch(`${ADMIN_API_BASE_URL}/admin-api/attachment-policies`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message || "创建策略失败")
  }
}

export async function updatePolicy(
  entityType: string,
  input: {
    mimeWhitelist?: string[] | null
    maxSizeBytes?: number | null
  },
): Promise<void> {
  const res = await fetch(`${ADMIN_API_BASE_URL}/admin-api/attachment-policies/${entityType}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error("更新策略失败")
}

export async function deletePolicy(entityType: string): Promise<void> {
  const res = await fetch(`${ADMIN_API_BASE_URL}/admin-api/attachment-policies/${entityType}`, {
    method: "DELETE",
    credentials: "include",
  })
  if (!res.ok) throw new Error("删除策略失败")
}

export async function upsertPolicy(input: {
  entityType: string
  mimeWhitelist: string[] | null
  maxSizeBytes: number | null
}): Promise<void> {
  // 检查是否已存在，决定创建还是更新
  const policies = await listPolicies()
  const existing = policies.find((p) => p.entityType === input.entityType)
  if (existing) {
    await updatePolicy(input.entityType, {
      mimeWhitelist: input.mimeWhitelist,
      maxSizeBytes: input.maxSizeBytes,
    })
  } else {
    await createPolicy(input)
  }
}
