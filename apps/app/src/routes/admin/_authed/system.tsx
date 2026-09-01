import { createFileRoute } from "@tanstack/solid-router"

import { SystemPage } from "../../../pages/system/SystemPage"
import { fetchSystemInfo } from "../../../server/admin/system"

export const Route = createFileRoute("/admin/_authed/system")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData({
      queryKey: ["admin-system-info"],
      queryFn: () => fetchSystemInfo(),
    })
  },
  component: SystemPage,
})
