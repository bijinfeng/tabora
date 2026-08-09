import { createFileRoute } from "@tanstack/solid-router"

import { SyncedRecordsPage } from "../../pages/synced-records/SyncedRecordsPage"
import { fetchSyncedRecordStats, listSyncedRecords } from "../../server/admin/syncedRecords"

export const Route = createFileRoute("/_authed/synced-records")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData({
        queryKey: ["synced-record-stats"],
        queryFn: () => fetchSyncedRecordStats(),
      }),
      context.queryClient.ensureQueryData({
        queryKey: ["synced-records", { offset: 0 }],
        queryFn: () => listSyncedRecords({ data: { limit: 20, offset: 0 } }),
      }),
    ])
  },
  component: SyncedRecordsPage,
})
