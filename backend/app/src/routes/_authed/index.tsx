import { createFileRoute } from "@tanstack/solid-router"

import { OverviewPage } from "../../pages/overview/OverviewPage"
import { fetchSystemInfo } from "../../server/admin/system"
import { fetchSyncedRecordStats } from "../../server/admin/syncedRecords"

export const Route = createFileRoute("/_authed/")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData({
        queryKey: ["admin-system-info"],
        queryFn: () => fetchSystemInfo(),
      }),
      context.queryClient.ensureQueryData({
        queryKey: ["synced-record-stats"],
        queryFn: () => fetchSyncedRecordStats(),
      }),
    ])
  },
  component: OverviewPage,
})
