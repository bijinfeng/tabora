import { createFileRoute } from "@tanstack/solid-router"

import { AttachmentPoliciesPage } from "../../pages/attachments/AttachmentPoliciesPage"
import { listPolicies } from "../../server/admin/attachments"

export const Route = createFileRoute("/_authed/attachment-policies")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData({
      queryKey: ["attachment-policies"],
      queryFn: () => listPolicies(),
    })
  },
  component: AttachmentPoliciesPage,
})
