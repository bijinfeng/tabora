export interface AuditLogRecord {
  id: number
  userId: string | null
  action: string
  resourceType: string | null
  resourceId: string | null
  details: string | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
}

export interface AuditLogFilters {
  userId?: string
  action?: string
  resourceType?: string
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
}

export interface AuditLogListResponse {
  data: AuditLogRecord[]
  meta: {
    total: number
    limit: number
    offset: number
  }
}

export async function fetchAuditLogs(filters: AuditLogFilters = {}): Promise<AuditLogListResponse> {
  const params = new URLSearchParams()
  if (filters.userId) params.set("userId", filters.userId)
  if (filters.action) params.set("action", filters.action)
  if (filters.resourceType) params.set("resourceType", filters.resourceType)
  if (filters.startDate) params.set("startDate", filters.startDate)
  if (filters.endDate) params.set("endDate", filters.endDate)
  params.set("limit", String(filters.limit ?? 50))
  params.set("offset", String(filters.offset ?? 0))

  const res = await fetch(`/admin-api/audit-log?${params}`, {
    credentials: "include",
  })
  if (!res.ok) throw new Error(`Failed to fetch audit logs: ${res.statusText}`)
  return res.json()
}

export async function deleteOldAuditLogs(days: number): Promise<{ deletedCount: number }> {
  const res = await fetch("/admin-api/audit-log/cleanup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ days }),
    credentials: "include",
  })
  if (!res.ok) throw new Error(`Failed to delete old logs: ${res.statusText}`)
  return res.json()
}
