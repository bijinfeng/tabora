import { Route, Router } from "@solidjs/router"
import { createMemo, Show, type JSX } from "solid-js"

import { authClient } from "./auth/authClient"
import { AuthGate } from "./auth/AuthGate"
import { AdminShell } from "./shell/AdminShell"
import { OverviewPage } from "./pages/overview/OverviewPage"
import { PlaceholderPage } from "./pages/PlaceholderPage"
import { UsersPage } from "./pages/users/UsersPage"
import { SyncedRecordsPage } from "./pages/synced-records/SyncedRecordsPage"
import { AttachmentsPage } from "./pages/attachments/AttachmentsPage"
import { AttachmentPoliciesPage } from "./pages/attachments/AttachmentPoliciesPage"

function SystemPage() {
  return (
    <PlaceholderPage title="系统监控" description="运行时信息、Provider 配置与错误日志，待接入。" />
  )
}

export function App() {
  const session = authClient.useSession()

  const ShellLayout = (props: { children?: JSX.Element }) => {
    const email = createMemo(() => session().data?.user?.email ?? "")
    return (
      <AdminShell adminEmail={email()} onSignOut={() => authClient.signOut()}>
        {props.children}
      </AdminShell>
    )
  }

  return (
    <Show when={session().data} fallback={<AuthGate onSuccess={() => session().refetch()} />}>
      <Router root={ShellLayout}>
        <Route path="/" component={OverviewPage} />
        <Route path="/users" component={UsersPage} />
        <Route path="/synced-records" component={SyncedRecordsPage} />
        <Route path="/attachments" component={AttachmentsPage} />
        <Route path="/attachment-policies" component={AttachmentPoliciesPage} />
        <Route path="/system" component={SystemPage} />
      </Router>
    </Show>
  )
}
