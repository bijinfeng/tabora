import { createFileRoute, Outlet, redirect } from "@tanstack/solid-router"

import { authClient } from "../auth/authClient"
import { fetchAdminSession } from "../auth/serverFns"
import { AdminShell } from "../shell/AdminShell"
import { ToastProvider } from "../contexts/ToastContext"

export const Route = createFileRoute("/_authed")({
  beforeLoad: async () => {
    const session = await fetchAdminSession()
    if (!session) {
      throw redirect({ to: "/login" })
    }
    if (!session.isAdmin) {
      // 有会话但非管理员：跳回登录，可恢复
      throw redirect({ to: "/login" })
    }
    return { adminEmail: session.email }
  },
  component: AuthedLayout,
})

function AuthedLayout() {
  const { adminEmail } = Route.useRouteContext()()

  function handleSignOut() {
    void authClient.signOut().then(() => {
      window.location.href = "/login"
    })
  }

  return (
    <ToastProvider>
      <AdminShell adminEmail={adminEmail} onSignOut={handleSignOut}>
        <Outlet />
      </AdminShell>
    </ToastProvider>
  )
}
