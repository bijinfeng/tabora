import { createFileRoute } from "@tanstack/solid-router"

import { UsersPage } from "../../../pages/users/UsersPage"
import { listUsers } from "../../../server/admin/users"

export const Route = createFileRoute("/admin/_authed/users")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData({
      queryKey: ["users", { search: "", offset: 0 }],
      queryFn: () => listUsers({ data: { limit: 20, offset: 0 } }),
    })
  },
  component: UsersPage,
})
