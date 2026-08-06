import * as stylex from "@stylexjs/stylex"
import type { JSX } from "solid-js"

import { createThemeController } from "../theme/useTheme"
import { AdminSidebar } from "./AdminSidebar"
import { AdminTopbar } from "./AdminTopbar"
import { styles } from "./shell.styles"

type AdminShellProps = {
  adminEmail: string
  onSignOut: () => void
  children: JSX.Element
}

/**
 * 后台 shell 容器：侧栏 + 顶栏 + 内容区。
 * 属 app 级宿主容器，基于 @tabora/ui primitive 组合，不放入 @tabora/ui。
 */
export function AdminShell(props: AdminShellProps) {
  const theme = createThemeController()

  return (
    <div {...stylex.attrs(styles.root)}>
      <AdminSidebar adminEmail={props.adminEmail} onSignOut={props.onSignOut} />
      <div {...stylex.attrs(styles.main)}>
        <AdminTopbar scheme={theme.scheme()} onToggleScheme={theme.toggle} />
        <main {...stylex.attrs(styles.content)}>{props.children}</main>
      </div>
    </div>
  )
}
