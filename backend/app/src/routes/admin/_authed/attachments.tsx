import { createFileRoute } from "@tanstack/solid-router"

import { AttachmentsPage } from "../../../pages/attachments/AttachmentsPage"
import { listFiles } from "../../../server/admin/attachments"

export const Route = createFileRoute("/admin/_authed/attachments")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData({
      queryKey: ["admin-files", { offset: 0 }],
      queryFn: () => listFiles({ data: { limit: 20, offset: 0 } }),
    })
  },
  component: AttachmentsPage,
})
