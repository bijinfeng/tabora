import { createFileRoute } from "@tanstack/solid-router"

import { ModelManagementPage } from "../../pages/models/ModelManagementPage"
import { listModelManagement } from "../../server/admin/models"

export const Route = createFileRoute("/_authed/models")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData({
      queryKey: ["model-management"],
      queryFn: listModelManagement,
    })
  },
  component: ModelManagementPage,
})
