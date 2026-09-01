import type { Component, ComponentProps } from "solid-js"
import Activity from "lucide-solid/icons/activity"
import FileText from "lucide-solid/icons/file-text"
import LayoutDashboard from "lucide-solid/icons/layout-dashboard"
import Bot from "lucide-solid/icons/bot"
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
  { path: "/admin", label: "概览", icon: LayoutDashboard },
  { path: "/admin/users", label: "用户", icon: Users },
  { path: "/admin/synced-records", label: "同步记录", icon: RefreshCw },
  { path: "/admin/attachments", label: "附件", icon: Paperclip },
  { path: "/admin/attachment-policies", label: "附件策略", icon: ShieldCheck },
  { path: "/admin/models", label: "模型管理", icon: Bot },
  { path: "/admin/system", label: "系统监控", icon: Activity },
  { path: "/admin/audit-log", label: "审计日志", icon: FileText },
  { path: "/admin/settings", label: "系统设置", icon: Settings },
]
