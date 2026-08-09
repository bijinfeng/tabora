import { createServerFn } from "@tanstack/solid-start"
import { z } from "zod"

import type { AuditLogRecord, AuditLogFilters } from "../db/auditLog"
import { getRuntime } from "../runtime"
import type { PaginatedResponse } from "../../utils/pagination"
import { adminAuthMiddleware, auditAdminAction, idFrom } from "./middleware"

export type { AuditLogRecord, AuditLogFilters }

const filtersSchema = z.object({
  userId: z.string().optional(),
  action: z.string().optional(),
  resourceType: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.number().int().min(1).max(200).default(50),
  offset: z.number().int().min(0).default(0),
})

export const fetchAuditLogs = createServerFn({ method: "GET" })
  .validator(filtersSchema)
  .middleware([adminAuthMiddleware])
  .handler(async ({ data }): Promise<PaginatedResponse<AuditLogRecord>> => {
    const { handle } = await getRuntime()
    const filters: AuditLogFilters = {
      ...(data.userId ? { userId: data.userId } : {}),
      ...(data.action ? { action: data.action } : {}),
      ...(data.resourceType ? { resourceType: data.resourceType } : {}),
      ...(data.startDate ? { startDate: new Date(data.startDate) } : {}),
      ...(data.endDate ? { endDate: new Date(data.endDate) } : {}),
    }
    const { rows, total } = await handle.auditLog.list(filters, data.limit, data.offset)
    return {
      data: rows,
      meta: { total, limit: data.limit, offset: data.offset },
    }
  })

export const deleteOldAuditLogs = createServerFn({ method: "POST" })
  .validator(z.object({ days: z.number().int().min(1) }))
  .middleware([
    adminAuthMiddleware,
    auditAdminAction({
      action: "DELETE /admin-api/audit-log",
      resourceType: "audit_log",
      resourceId: idFrom("days"),
    }),
  ])
  .handler(async ({ data }): Promise<{ deletedCount: number }> => {
    const { handle } = await getRuntime()
    const deletedCount = await handle.auditLog.deleteOld(data.days)
    return { deletedCount }
  })
