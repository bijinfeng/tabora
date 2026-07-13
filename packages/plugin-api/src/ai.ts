export type AiPermissionAccess = "generate" | "context" | "tools"

export type AiTokenUsage = {
  inputTokens?: number
  outputTokens?: number
  totalTokens?: number
}

export type AiGenerateRequest = {
  prompt: string
  system?: string
  model?: string
  temperature?: number
  maxOutputTokens?: number
  abortSignal?: AbortSignal
  tools?: AiToolDefinition[]
}

export type AiGenerateResult = {
  text: string
  finishReason?: string
  usage?: AiTokenUsage
}

export type AiStreamChunk =
  | { type: "text-delta"; text: string }
  | { type: "finish"; finishReason?: string; usage?: AiTokenUsage }

export type AiToolDefinition = {
  id: string
  description?: string
  inputSchema?: unknown
  requiresConfirmation?: boolean
  execute?: (input: unknown) => Promise<unknown> | unknown
}

export type AiToolApprovalRequest = {
  toolId: string
  input: unknown
  description?: string
}

export type AiToolApprovalResult = {
  approved: boolean
  reason?: string
}

export type AiWorkspaceContextSummary = {
  workspaceId: string
  workspaceName: string
  activeLayoutId: string
  widgets: Array<{
    instanceId: string
    pluginId: string
    contributionId: string
    title?: string
  }>
}

export type AiRuntimeBridge = {
  generate(request: AiGenerateRequest): Promise<AiGenerateResult>
  stream(request: AiGenerateRequest): AsyncIterable<AiStreamChunk>
  requestToolApproval?(request: AiToolApprovalRequest): Promise<AiToolApprovalResult>
  getWorkspaceContext?(): Promise<AiWorkspaceContextSummary>
}
