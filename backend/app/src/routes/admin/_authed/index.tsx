import { createFileRoute } from "@tanstack/solid-router"

import { OverviewPage } from "../../../pages/overview/OverviewPage"
import { fetchSystemInfo } from "../../../server/admin/system"
import { fetchSyncedRecordStats } from "../../../server/admin/syncedRecords"

export const Route = createFileRoute("/admin/_authed/")({
  loader: async ({ context }) => {
    await Promise.allSettled([
      context.queryClient.ensureQueryData({
        queryKey: ["system", "info"],
        queryFn: () => fetchSystemInfo(),
      }),
      context.queryClient.ensureQueryData({
        queryKey: ["synced-records", "stats"],
        queryFn: () => fetchSyncedRecordStats(),
      }),
    ])
  },
  component: OverviewPage,
})
