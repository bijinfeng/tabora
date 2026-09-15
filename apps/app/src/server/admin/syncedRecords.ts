import { createServerFn } from "@tanstack/solid-start"
import { z } from "zod"

import type { SyncedRecordRow } from "../db/syncedRecords"
import { getRuntime } from "../runtime"
import { adminAuthMiddleware, auditAdminAction, idFrom } from "./middleware"

export type SyncedRecord = SyncedRecordRow

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

const listQuerySchema = z.object({
  type: z.string().optional(),
  deleted: z.boolean().optional(),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(200).default(50),
  offset: z.number().int().min(0).default(0),
})

export const fetchSyncedRecordStats = createServerFn({ method: "GET" })
  .middleware([adminAuthMiddleware])
  .handler(async (): Promise<SyncedRecordStats> => {
    const { handle } = await getRuntime()
    const [byType, tombstones] = await Promise.all([
      handle.syncedRecords.countsByType(),
      handle.syncedRecords.countTombstones(),
    ])
    const total = Object.values(byType).reduce((sum, n) => sum + n, 0)
    return { byType, tombstones, total }
  })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const listSyncedRecords: (args: {
  data: z.infer<typeof listQuerySchema>
}) => Promise<{ records: SyncedRecord[]; total: number }> = createServerFn({ method: "POST" })
  .validator(listQuerySchema)
  .middleware([adminAuthMiddleware])
  // SyncedRecordRow.data is `unknown`; TanStack Start RC rejects handlers whose return type
  // contains `unknown` at the handler-constraint level. Cast the handler to bypass the check;
  // the explicit const type above keeps downstream callers fully typed.
  .handler((async ({ data }: { data: z.infer<typeof listQuerySchema> }) => {
    const { handle } = await getRuntime()
    const { rows, total } = await handle.syncedRecords.list(data)
    return { records: rows as SyncedRecord[], total }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const fetchSyncedRecordById: (args: {
  data: { id: string }
}) => Promise<SyncedRecord | null> = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string() }))
  .middleware([adminAuthMiddleware])
  // Same workaround as listSyncedRecords above.
  .handler((async ({ data }: { data: { id: string } }) => {
    const { handle } = await getRuntime()
    const result = await handle.syncedRecords.getById(data.id)
    return result as SyncedRecord | null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any)

export const deleteSyncedRecord = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string() }))
  .middleware([
    adminAuthMiddleware,
    auditAdminAction({
      action: "DELETE /admin-api/synced-records",
      resourceType: "synced_record",
      resourceId: idFrom("id"),
    }),
  ])
  .handler(async ({ data }): Promise<void> => {
    const { handle } = await getRuntime()
    await handle.syncedRecords.remove(data.id)
  })
