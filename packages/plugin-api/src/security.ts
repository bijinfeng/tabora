import type { PluginManifest, PluginPermission } from "./manifest"

/**
 * 插件安全架构前置类型定义。
 * 这些类型为不可信远程插件沙箱运行、包完整性校验、权限审核和分发协议建立边界，
 * 在真正实现远程市场前提供类型级合同。
 */

// ============================================================
// 沙箱运行时
// ============================================================

export type SandboxRuntimeKind = "iframe" | "worker" | "realm"

export type SandboxRuntimeConfig = {
  kind: SandboxRuntimeKind
  /** 允许的 origin 白名单 */
  allowedOrigins: string[]
  /** 最大内存限制 (MB) */
  memoryLimitMb: number
  /** 执行超时 (ms) */
  executionTimeoutMs: number
}

export type SandboxMessage = {
  type: "api-call" | "api-response" | "error"
  id: string
  payload: unknown
}

export type SandboxApiSurface = {
  /** 允许调用的宿主 API 方法列表 */
  allowedMethods: string[]
  /** API 调用速率限制 (次/秒) */
  rateLimitPerSecond: number
}

// ============================================================
// 远程插件包
// ============================================================

export type RemotePluginSource = {
  /** 包下载 URL */
  url: string
  /** SHA-256 完整性校验 */
  integrity: string
  /** 包大小上限 (bytes) */
  sizeBytes: number
}

export type PluginSignature = {
  /** 签名算法 */
  algorithm: "ed25519" | "ecdsa"
  /** 签发者公钥指纹 */
  signerKeyFingerprint: string
  /** 签名值 (hex) */
  signature: string
}

export type RemotePluginPackage = {
  /** 包格式版本 */
  schemaVersion: number
  manifest: PluginManifest
  /** 包来源和完整性 */
  source: RemotePluginSource
  /** 可选签名 */
  signature?: PluginSignature
  /** 包发布时间 */
  publishedAt: string
  /** 兼容平台版本范围 */
  compatibleEngineVersions: string
}

// ============================================================
// 权限审核和风险
// ============================================================

export type PermissionRiskLevel = "low" | "medium" | "high" | "critical"

export type PermissionRiskAssessment = {
  permission: PluginPermission
  risk: PermissionRiskLevel
  /** 风险说明 */
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
      return {
        permission,
        risk: "low",
        description: `插件数据存储 (${permission.scope} 范围)`,
      }
    case "workspace":
      return {
        permission,
        risk: "medium",
        description: `工作区 ${permission.access === "write" ? "读写" : "只读"} 访问`,
      }
    case "network":
      return {
        permission,
        risk: "high",
        description: `网络访问: ${permission.hosts.join(", ")}`,
      }
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

export type InstallPermissionReview = {
  manifest: PluginManifest
  assessments: PermissionRiskAssessment[]
  overallRisk: PermissionRiskLevel
  /** 建议：是否允许安装 */
  recommendation: "allow" | "block" | "review"
}

export function reviewInstallPermissions(
  permissions: PluginPermission[],
): PermissionRiskAssessment[] {
  return permissions.map(assessPermissionRisk)
}

export function computeOverallRisk(assessments: PermissionRiskAssessment[]): PermissionRiskLevel {
  const levels: Record<PermissionRiskLevel, number> = {
    low: 0,
    medium: 1,
    high: 2,
    critical: 3,
  }
  const max = assessments.reduce(
    (maxLevel, assessment) =>
      levels[assessment.risk] > levels[maxLevel] ? assessment.risk : maxLevel,
    "low" as PermissionRiskLevel,
  )
  return max
}

// ============================================================
// 插件审核
// ============================================================

export type PluginAuditEntry = {
  pluginId: string
  /** 请求的权限列表 */
  requestedPermissions: PluginPermission[]
  /** 已授权的权限列表 */
  grantedPermissions: PluginPermission[]
  /** 权限使用记录 */
  usageLog: Array<{
    permissionType: PluginPermission["type"]
    accessedAt: string
    success: boolean
  }>
  /** 插件崩溃记录 */
  crashReports: Array<{
    error: string
    timestamp: string
    recovery: "boundary" | "reload"
  }>
}

// ============================================================
// 市场 API（草案）
// ============================================================

export type MarketPluginEntry = {
  id: string
  name: string
  version: string
  description: string
  publisher: string
  /** 市场评级 */
  rating?: number
  /** 下载次数 */
  downloads?: number
  /** 权限摘要 */
  permissionSummary: string[]
  /** 包下载信息 */
  package: RemotePluginSource
  /** 签名信息 */
  signature?: PluginSignature
}
