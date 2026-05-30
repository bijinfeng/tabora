import type { PluginPermission } from "./manifest"

export type PermissionRiskLevel = "low" | "medium" | "high" | "critical"

export type PermissionRiskAssessment = {
  permission: PluginPermission
  risk: PermissionRiskLevel
  description: string
}

export function assessPermissionRisk(permission: PluginPermission): PermissionRiskAssessment {
  switch (permission.type) {
    case "external-open":
      return {
        permission,
        risk: "medium",
        description: `可打开外部链接: ${permission.hosts.join(", ")}`,
      }
    case "storage":
      return { permission, risk: "low", description: `插件数据存储 (${permission.scope} 范围)` }
    case "workspace":
      return {
        permission,
        risk: "medium",
        description: `工作区 ${permission.access === "write" ? "读写" : "只读"} 访问`,
      }
    case "network":
      return { permission, risk: "high", description: `网络访问: ${permission.hosts.join(", ")}` }
    case "clipboard":
      return {
        permission,
        risk: "high",
        description: `剪贴板 ${permission.access === "write" ? "读写" : "只读"} 访问`,
      }
    case "local-file":
      return {
        permission,
        risk: "critical",
        description: `本地文件系统 ${permission.access === "write" ? "读写" : "只读"} 访问`,
      }
  }
}

export function computeOverallRisk(assessments: PermissionRiskAssessment[]): PermissionRiskLevel {
  const levels: Record<PermissionRiskLevel, number> = { low: 0, medium: 1, high: 2, critical: 3 }
  return assessments.reduce(
    (max, a) => (levels[a.risk] > levels[max] ? a.risk : max),
    "low" as PermissionRiskLevel,
  )
}
