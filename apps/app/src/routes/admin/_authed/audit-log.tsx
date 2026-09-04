import { createFileRoute } from "@tanstack/solid-router"

import { AuditLogPage } from "../../../pages/audit-log/AuditLogPage"
import { fetchAuditLogs } from "../../../server/admin/auditLog"

export const Route = createFileRoute("/admin/_authed/audit-log")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData({
      queryKey: ["audit-logs", { offset: 0 }],
      queryFn: () => fetchAuditLogs({ data: { limit: 20, offset: 0 } }),
    })
  },
  component: AuditLogPage,
})
