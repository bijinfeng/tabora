import type { BadgeVariant } from "@tabora/ui/badge"

export type ModelManagementView = "models" | "providers"
export type ResourceStatus = "draft" | "active" | "disabled"
export type TestState = "idle" | "testing" | "passed" | "failed"

export type AdminAiProvider = {
  id: string
  label: string
  baseUrl: string
  credentialConfigured: boolean
  status: ResourceStatus | "deleted"
  lastTestStatus: TestState | null
  modelCount: number
}

export type AdminAiModel = {
  id: string
  label: string
  providerId: string
  upstreamModelId: string
  providerLabel: string
  status: ResourceStatus | "deleted"
  lastTestStatus: TestState | null
}

export function statusBadge(
  status: ResourceStatus,
  provider = false,
): {
  label: string
  variant: BadgeVariant
} {
  if (status === "active") return { label: provider ? "已启用" : "已上线", variant: "success" }
  if (status === "disabled") return { label: provider ? "已停用" : "已下线", variant: "warning" }
  return { label: "草稿", variant: "neutral" }
}
