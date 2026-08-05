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
    default:
      return { permission, risk: "low", description: `未知权限类型: ${permission.type}` }
  }
}

export function computeOverallRisk(assessments: PermissionRiskAssessment[]): PermissionRiskLevel {
  const levels: Record<PermissionRiskLevel, number> = { low: 0, medium: 1, high: 2, critical: 3 }
  return assessments.reduce(
    (max, a) => (levels[a.risk] > levels[max] ? a.risk : max),
    "low" as PermissionRiskLevel,
  )
}
