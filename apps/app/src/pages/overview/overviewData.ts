import type { BadgeVariant } from "@tabora/ui/badge"

import type { SystemInfo } from "../../server/admin/system"

export type HealthStatus = {
  label: string
  value: string
  variant: Extract<BadgeVariant, "success" | "warning" | "danger" | "neutral">
}

export type Metric = {
  label: string
  value: string
  hint?: string
}

function formatUptime(sec: number): string {
  const d = Math.floor(sec / 86400)
  const h = Math.floor((sec % 86400) / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const parts: string[] = []
  if (d > 0) parts.push(`${d}d`)
  if (h > 0) parts.push(`${h}h`)
  parts.push(`${m}m`)
  return parts.join(" ")
}

export function deriveHealthStatuses(sys: SystemInfo | undefined): HealthStatus[] {
  if (!sys) {
    return [
      { label: "服务", value: "…", variant: "neutral" },
      { label: "数据库", value: "…", variant: "neutral" },
      { label: "邮件", value: "…", variant: "neutral" },
      { label: "存储", value: "…", variant: "neutral" },
    ]
  }
  return [
    { label: "服务", value: `运行中 · ${formatUptime(sys.server.uptimeSec)}`, variant: "success" },
    {
      label: "数据库",
      value: sys.database.client === "postgres" ? "PostgreSQL" : "SQLite",
      variant: "success",
    },
    {
      label: "邮件",
      value: sys.smtp.configured ? (sys.smtp.host ?? "已配置") : "未配置 SMTP",
      variant: sys.smtp.configured ? "success" : "warning",
    },
    {
      label: "存储",
      value: sys.storage.provider,
      variant: sys.storage.provider === "local" ? "warning" : "success",
    },
    {
      label: "认证密钥",
      value: sys.auth.secretConfigured ? "已配置" : "未配置",
      variant: sys.auth.secretConfigured ? "success" : "danger",
    },
    {
      label: "邮件队列",
      value: sys.emailQueue.failed > 0 ? `${sys.emailQueue.failed} 条失败` : "正常",
      variant: sys.emailQueue.failed > 0 ? "danger" : "success",
    },
  ]
}
