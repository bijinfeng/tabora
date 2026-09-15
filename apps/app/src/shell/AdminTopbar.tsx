import * as stylex from "@stylexjs/stylex"
import { IconButton } from "@tabora/ui/button"
import { useLocation } from "@tanstack/solid-router"
import { createMemo, Show } from "solid-js"
import Moon from "lucide-solid/icons/moon"
import PanelLeftClose from "lucide-solid/icons/panel-left-close"
import PanelLeftOpen from "lucide-solid/icons/panel-left-open"
import Sun from "lucide-solid/icons/sun"

import type { ColorScheme } from "../theme/useTheme"
import { navItems } from "./navigation"
import { styles } from "./shell.styles"

type AdminTopbarProps = {
  scheme: ColorScheme
  sidebarCollapsed: boolean
  onToggleScheme: () => void
  onToggleSidebar: () => void
}

function currentTitle(pathname: string): string {
  const match = navItems.find((item) =>
    item.path === "/admin"
      ? pathname === "/admin" || pathname === "/admin/"
      : pathname.startsWith(item.path),
  )
  return match?.label ?? "概览"
}

export function AdminTopbar(props: AdminTopbarProps) {
  const location = useLocation()
  const title = createMemo(() => currentTitle(location().pathname))

  return (
    <header {...stylex.attrs(styles.topbar)}>
      <div {...stylex.attrs(styles.topbarTitleGroup)}>
        <IconButton
          variant="ghost"
          aria-label={props.sidebarCollapsed ? "展开侧边栏" : "收起侧边栏"}
          onClick={props.onToggleSidebar}
        >
          <Show when={props.sidebarCollapsed} fallback={<PanelLeftClose size={18} />}>
            <PanelLeftOpen size={18} />
          </Show>
        </IconButton>
        <span {...stylex.attrs(styles.topbarTitle)}>{title()}</span>
      </div>
      <div {...stylex.attrs(styles.topbarActions)}>
        <span {...stylex.attrs(styles.envBadge)}>self-hosted · 开发环境</span>
        <IconButton
          variant="ghost"
          aria-label={props.scheme === "dark" ? "切换到亮色主题" : "切换到暗色主题"}
          onClick={props.onToggleScheme}
        >
          <Show when={props.scheme === "dark"} fallback={<Moon size={16} />}>
            <Sun size={16} />
          </Show>
        </IconButton>
      </div>
    </header>
  )
}
