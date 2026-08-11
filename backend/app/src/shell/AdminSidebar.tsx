import * as stylex from "@stylexjs/stylex"
import { TaboraMark } from "@tabora/brand"
import { Link, useLocation } from "@tanstack/solid-router"
import { IconButton } from "@tabora/ui/button"
import { For, Show } from "solid-js"
import LogOut from "lucide-solid/icons/log-out"

import { navItems } from "./navigation"
import { styles } from "./shell.styles"

type AdminSidebarProps = {
  adminEmail: string
  collapsed: boolean
  onSignOut: () => void
}

function isActive(currentPath: string, itemPath: string): boolean {
  if (itemPath === "/") return currentPath === "/"
  return currentPath === itemPath || currentPath.startsWith(`${itemPath}/`)
}

export function AdminSidebar(props: AdminSidebarProps) {
  const location = useLocation()

  return (
    <aside {...stylex.attrs(styles.sidebar)}>
      <div {...stylex.attrs(styles.brand, props.collapsed && styles.brandCollapsed)}>
        <TaboraMark {...stylex.attrs(styles.brandMark)} />
        <Show when={!props.collapsed}>
          <span {...stylex.attrs(styles.brandName)}>Tabora Admin</span>
        </Show>
      </div>
      <nav {...stylex.attrs(styles.nav)} aria-label="主导航">
        <For each={navItems}>
          {(item) => (
            <Link
              to={item.path as never}
              aria-label={props.collapsed ? item.label : undefined}
              {...stylex.attrs(
                styles.navItem,
                props.collapsed && styles.navItemCollapsed,
                isActive(location().pathname, item.path) && styles.navItemActive,
              )}
            >
              <item.icon size={18} />
              <Show when={!props.collapsed}>
                <span>{item.label}</span>
              </Show>
            </Link>
          )}
        </For>
      </nav>
      <div
        {...stylex.attrs(styles.sidebarFooter, props.collapsed && styles.sidebarFooterCollapsed)}
      >
        <Show when={!props.collapsed}>
          <div {...stylex.attrs(styles.footerIdentity)}>
            <span {...stylex.attrs(styles.footerRole)}>运维者</span>
            <Show
              when={props.adminEmail}
              fallback={<span {...stylex.attrs(styles.footerEmail)}>本地会话</span>}
            >
              <span {...stylex.attrs(styles.footerEmail)}>{props.adminEmail}</span>
            </Show>
          </div>
        </Show>
        <IconButton variant="ghost" size="sm" aria-label="退出登录" onClick={props.onSignOut}>
          <LogOut size={16} />
        </IconButton>
      </div>
    </aside>
  )
}
