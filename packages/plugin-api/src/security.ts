import type { AiPermissionAccess } from "./ai"
import type { PluginPermission } from "./manifest"

export type PermissionRiskLevel = "low" | "medium" | "high" | "critical"

export type PermissionRiskAssessment = {
  permission: PluginPermission
  risk: PermissionRiskLevel
  description: string
}

const AI_ACCESS_LABELS: Record<AiPermissionAccess, string> = {
  generate: "生成内容",
  context: "访问上下文",
  tools: "调用工具",
}

export function assessPermissionRisk(permission: PluginPermission): PermissionRiskAssessment {
  switch (permission.type) {
    case "external-open":
      return {
        permission,
        risk: "medium",
        description: `可打开外部链接: ${permission.hosts.join(", ")}`,
      }
    case "network":
      return {
        permission,
        risk: "high",
        description: `可访问网络资源: ${permission.hosts.join(", ")}`,
      }
    case "ai":
      return {
        permission,
        risk: "high",
        description: `使用 AI 能力: ${permission.access.map((access) => AI_ACCESS_LABELS[access]).join("、")}`,
      }
    default:
      return {
        permission,
        risk: "low",
        description: `未知权限类型: ${(permission as PluginPermission).type}`,
      }
  }
}

/**
 * Whether `granted` already authorizes everything `requested` asks for. Host lists and AI access
 * lists are treated as scopes, so a broader grant covers a narrower request.
 */
export function permissionCovers(granted: PluginPermission, requested: PluginPermission): boolean {
  if (granted.type !== requested.type) return false
  if (granted.type === "ai" && requested.type === "ai") {
    return requested.access.every((access) => granted.access.includes(access))
  }
  if (
    (granted.type === "external-open" || granted.type === "network") &&
    (requested.type === "external-open" || requested.type === "network")
  ) {
    return requested.hosts.every((host) => granted.hosts.includes(host))
  }
  return true
}

export function computeOverallRisk(assessments: PermissionRiskAssessment[]): PermissionRiskLevel {
  const levels: Record<PermissionRiskLevel, number> = { low: 0, medium: 1, high: 2, critical: 3 }
  return assessments.reduce(
    (max, a) => (levels[a.risk] > levels[max] ? a.risk : max),
    "low" as PermissionRiskLevel,
  )
}
