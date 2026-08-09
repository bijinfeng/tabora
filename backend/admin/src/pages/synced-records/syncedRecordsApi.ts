import { ADMIN_API_BASE_URL } from "../../config"
import { fetchAdminJson } from "../../utils/fetchAdminJson"
import type { PaginatedResponse } from "../../utils/pagination"

export type SyncedRecord = {
  id: string
  ownerId: string
  ownerEmail: string | null
  recordType: string
  recordId: string
  data: unknown
  version: number
  deviceId: string
  deleted: boolean
  recordUpdatedAt: string | number
}

export type SyncedRecordStats = {
  byType: Record<string, number>
  tombstones: number
  total: number
}

export type ListQuery = {
  type?: string
  deleted?: boolean
  search?: string
  limit: number
  offset: number
}

export async function listSyncedRecords(
  query: ListQuery,
): Promise<{ records: SyncedRecord[]; total: number }> {
  const params = new URLSearchParams()
  if (query.type) params.set("type", query.type)
  if (query.deleted !== undefined) params.set("deleted", String(query.deleted))
  if (query.search) params.set("search", query.search)
  params.set("limit", String(query.limit))
  params.set("offset", String(query.offset))
  const res = await fetchAdminJson<PaginatedResponse<SyncedRecord>>(
    `/admin-api/synced-records?${params.toString()}`,
  )
  return { records: res.data, total: res.meta.total }
}

export async function fetchSyncedRecordStats(): Promise<SyncedRecordStats> {
  return fetchAdminJson("/admin-api/synced-records/stats")
}

export async function fetchSyncedRecordById(id: string): Promise<SyncedRecord> {
  return fetchAdminJson(`/admin-api/synced-records/${id}`)
}

export async function deleteSyncedRecord(id: string): Promise<void> {
  const res = await fetch(`${ADMIN_API_BASE_URL}/admin-api/synced-records/${id}`, {
    method: "DELETE",
    credentials: "include",
  })
  if (!res.ok) throw new Error("删除失败")
}
