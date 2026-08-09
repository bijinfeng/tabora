import type { Component, ComponentProps } from "solid-js"
import Activity from "lucide-solid/icons/activity"
import FileText from "lucide-solid/icons/file-text"
import LayoutDashboard from "lucide-solid/icons/layout-dashboard"
import Paperclip from "lucide-solid/icons/paperclip"
import RefreshCw from "lucide-solid/icons/refresh-cw"
import Settings from "lucide-solid/icons/settings"
import ShieldCheck from "lucide-solid/icons/shield-check"
import Users from "lucide-solid/icons/users"

type IconComponent = Component<ComponentProps<typeof LayoutDashboard>>

export type NavItem = {
  path: string
  label: string
  icon: IconComponent
}

/** 运维后台的一级导航。 */
export const navItems: NavItem[] = [
  { path: "/", label: "概览", icon: LayoutDashboard },
  { path: "/users", label: "用户", icon: Users },
  { path: "/synced-records", label: "同步记录", icon: RefreshCw },
  { path: "/attachments", label: "附件", icon: Paperclip },
  { path: "/attachment-policies", label: "附件策略", icon: ShieldCheck },
  { path: "/system", label: "系统监控", icon: Activity },
  { path: "/audit-log", label: "审计日志", icon: FileText },
  { path: "/settings", label: "系统设置", icon: Settings },
]
