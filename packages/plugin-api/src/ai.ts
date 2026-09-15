export type AiPermissionAccess = "generate" | "context" | "tools"

import type { PluginAiToolHandler } from "./aiTools"
import type { AiToolContribution } from "./manifest"

export type AiTokenUsage = {
  inputTokens?: number
  outputTokens?: number
  totalTokens?: number
}

export type AiUsageStats = {
  requestCount: number
  failureCount: number
  inputTokens: number
  outputTokens: number
  totalTokens: number
  estimatedCost?: number
  periodStartedAt: string
}

export type AiBudget = {
  maxRequests?: number
  maxTotalTokens?: number
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

export type AiGenerateRequest = {
  prompt: string
  system?: string
  temperature?: number
  maxOutputTokens?: number
  abortSignal?: AbortSignal
}

export type AiGenerateResult = {
  text: string
  finishReason?: string
  usage?: AiTokenUsage
}

export type AiStreamChunk =
  | { type: "text-delta"; text: string }
  | { type: "finish"; finishReason?: string; usage?: AiTokenUsage }

export type AiChatMessage = {
  role: "user" | "assistant"
  text: string
}

export type AiChatClientOptions = {
  onMessagesChange?(messages: AiChatMessage[]): void
  onLoadingChange?(loading: boolean): void
  onError?(error: Error): void
}

/** A host-owned text session. Provider, credentials, and transport remain host private. */
export type AiChatClient = {
  send(prompt: string, request?: Omit<AiGenerateRequest, "prompt" | "abortSignal">): Promise<void>
  stop(): void
  dispose(): void
  getMessages(): AiChatMessage[]
}

/** Run-scoped metadata a TanStack AI client passes alongside the conversation. */
export type AiChatConnectionRunContext = {
  threadId?: string
  runId?: string
  parentRunId?: string
  forwardedProps?: Record<string, unknown>
}

/** A host-owned file made available to an AI run without exposing a storage path or URL. */
export type AiChatAttachmentResource = {
  id: string
  filename: string
  mimeType: string
  size: number
}

/** Upload selected files into the host's private AI-attachment scope. */
export type AiChatAttachmentPreparation = {
  conversationId: string
}

/**
 * Host-owned chat transport for TanStack AI clients. `connect` receives the
 * full conversation and yields the AG-UI protocol events produced by the
 * Tabora gateway. The shape mirrors TanStack AI's `ConnectionAdapter` but is
 * declared here without TanStack imports; consumers bridge it into
 * `@tanstack/ai-solid` / `@tanstack/ai-client` with a single structural cast.
 */
export type AiChatConnection = {
  connect(
    messages: readonly unknown[],
    data: Record<string, unknown> | undefined,
    abortSignal: AbortSignal | undefined,
    runContext: AiChatConnectionRunContext | undefined,
  ): AsyncIterable<unknown>
}

export type AiRuntimeErrorCode =
  | "ai_not_configured"
  | "ai_budget_exceeded"
  | "ai_auth_required"
  | "ai_model_unavailable"
  | "ai_request_rejected"
  | "ai_provider_failed"

export class AiRuntimeError extends Error {
  readonly code: AiRuntimeErrorCode

  constructor(code: AiRuntimeErrorCode, message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = "AiRuntimeError"
    this.code = code
  }
}

/** A summary of an aiTool registered by a plugin, surfaced to consumer plugins. */
export type RegisteredAiTool = {
  pluginId: string
  id: string
  name: string
  description: string
}

/**
 * A plugin-registered aiTool with its handler, returned only when the caller
 * shares the same JS thread as the plugin registry (host shell / extension
 * service worker). Shape duck-matches `@tabora/ai-runtime/server`'s
 * `PluginToolEntryLike` so consumers can cast directly.
 */
export type RegisteredPluginAiToolEntry = {
  ref: {
    pluginId: string
    id: string
    kind: "ai-tool"
    contribution: Omit<AiToolContribution, "id">
  }
  handler: PluginAiToolHandler
}

export type AiRuntimeBridge = {
  generate(request: AiGenerateRequest): Promise<AiGenerateResult>
  stream(request: AiGenerateRequest): AsyncIterable<AiStreamChunk>
  createChatClient?(options?: AiChatClientOptions): AiChatClient
  createChatConnection?(): AiChatConnection
  /**
   * Makes files available to server-side agent tools. Returned IDs are opaque
   * to plugins and can only be resolved in the owning user's AI run.
   */
  prepareChatAttachments?(
    files: readonly File[],
    preparation: AiChatAttachmentPreparation,
  ): Promise<AiChatAttachmentResource[]>
  /**
   * Lists aiTools registered by any enabled plugin in the current workspace.
   * Returns a fresh array on each call so consumers can safely mutate it.
   */
  listRegisteredAiTools?(): RegisteredAiTool[]
  /**
   * Returns the full aiTool entries (including handlers) for tools that can
   * be dispatched in the current JavaScript thread. Only callers inside the
   * host shell / runtime should rely on handlers being non-stub. Cross-thread
   * runtimes (e.g. a pure HTTP client) should return `undefined` and use the
   * server gateway's tool injection path instead.
   */
  listRegisteredPluginToolEntries?(): RegisteredPluginAiToolEntry[]
}
