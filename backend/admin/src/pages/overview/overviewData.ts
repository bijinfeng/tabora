import type { BadgeVariant } from "@tabora/ui/badge"

/**
 * 概览页占位数据。
 * TODO(server): 接入自建服务端管理端点后，替换为 health / 计数聚合 / 错误摘要真实数据。
 */

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

export type RecentError = {
  id: string
  summary: string
  detail: string
  at: string
}

export const healthStatuses: HealthStatus[] = [
  { label: "服务", value: "运行中", variant: "success" },
  { label: "数据库", value: "已连接", variant: "success" },
  { label: "邮件 Provider", value: "sendmail", variant: "neutral" },
  { label: "上传 Provider", value: "local", variant: "warning" },
]

export const recentErrors: RecentError[] = []
