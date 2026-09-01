import * as stylex from "@stylexjs/stylex"
import { color, font } from "@tabora/theme/tokens.stylex"
import { createFileRoute, redirect } from "@tanstack/solid-router"
import { Match, Switch } from "solid-js"

import { authClient } from "../../auth/authClient"
import { fetchAdminSession, fetchHasAdmin } from "../../auth/serverFns"
import { LoginPage } from "../../auth/LoginPage"
import { RegisterPage } from "../../auth/RegisterPage"

const styles = stylex.create({
  status: {
    alignItems: "center",
    backgroundColor: color.page,
    color: color.textMuted,
    display: "flex",
    fontFamily: font.sans,
    fontSize: 13,
    justifyContent: "center",
    minHeight: "100vh",
    width: "100%",
  },
})

export const Route = createFileRoute("/admin/login")({
  beforeLoad: async () => {
    // 已登录管理员直接跳首页，不再展示登录页
    const session = await fetchAdminSession()
    if (session?.isAdmin) {
      throw redirect({ to: "/admin" })
    }
  },
  loader: async () => {
    const hasAdmin = await fetchHasAdmin()
    return { hasAdmin }
  },
  component: LoginRoute,
})

function LoginRoute() {
  const { hasAdmin } = Route.useLoaderData()()
  const navigate = Route.useNavigate()

  const onSuccess = async () => {
    await navigate({ to: "/admin" })
  }

  return (
    <Switch fallback={<div {...stylex.attrs(styles.status)}>正在连接管理服务…</div>}>
      <Match when={!hasAdmin}>
        <RegisterPage onSuccess={onSuccess} />
      </Match>
      <Match when={hasAdmin}>
        <LoginPage onSuccess={onSuccess} />
      </Match>
    </Switch>
  )
}

export function handleSignOut() {
  return authClient.signOut()
}
