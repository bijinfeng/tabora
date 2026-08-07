import * as stylex from "@stylexjs/stylex"
import { color, font } from "@tabora/theme/tokens.stylex"
import { useQuery } from "@tanstack/solid-query"
import { Match, Switch } from "solid-js"

import { ADMIN_API_BASE_URL } from "../config"
import { LoginPage } from "./LoginPage"
import { RegisterPage } from "./RegisterPage"

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

async function fetchHasAdmin(): Promise<boolean> {
  const res = await fetch(`${ADMIN_API_BASE_URL}/admin-api/status`)
  const data = await res.json()
  return data.hasAdmin === true
}

/** 未登录入口：探测是否已存在管理员，据此进注册或登录。 */
export function AuthGate(props: { onSuccess: () => void }) {
  const hasAdmin = useQuery(() => ({ queryKey: ["admin-status"], queryFn: fetchHasAdmin }))

  return (
    <Switch fallback={<div {...stylex.attrs(styles.status)}>正在连接管理服务…</div>}>
      <Match when={hasAdmin.error}>
        <LoginPage onSuccess={props.onSuccess} />
      </Match>
      <Match when={hasAdmin.data === false}>
        <RegisterPage onSuccess={props.onSuccess} />
      </Match>
      <Match when={hasAdmin.data === true}>
        <LoginPage onSuccess={props.onSuccess} />
      </Match>
    </Switch>
  )
}
