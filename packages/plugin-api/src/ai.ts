export type AiPermissionAccess = "generate" | "context" | "tools"

export type AiTokenUsage = {
  inputTokens?: number
  outputTokens?: number
  totalTokens?: number
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

export type AiRuntimeBridge = {
  generate(request: AiGenerateRequest): Promise<AiGenerateResult>
  stream(request: AiGenerateRequest): AsyncIterable<AiStreamChunk>
  createChatClient?(options?: AiChatClientOptions): AiChatClient
  createChatConnection?(): AiChatConnection
}
