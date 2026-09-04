import { createFileRoute } from "@tanstack/solid-router"

import { SettingsPage } from "../../../pages/settings/SettingsPage"
import { fetchSettings } from "../../../server/admin/settings"

export const Route = createFileRoute("/admin/_authed/settings")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData({
      queryKey: ["admin-settings"],
      queryFn: () => fetchSettings(),
    })
  },
  component: SettingsPage,
})
