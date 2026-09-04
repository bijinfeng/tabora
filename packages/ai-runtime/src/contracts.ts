import type {
  AiChatMessage,
  AiGenerateRequest,
  AiGenerateResult,
  AiStreamChunk,
} from "@tabora/plugin-api"

export type AiGatewayContentPart =
  | { type: "text"; content: string }
  | {
      type: "image"
      source: { type: "data"; value: string; mimeType: string } | { type: "url"; value: string }
    }
  | {
      type: "audio"
      source: { type: "data"; value: string; mimeType: string } | { type: "url"; value: string }
    }
  | {
      type: "document"
      source: { type: "data"; value: string; mimeType: string } | { type: "url"; value: string }
      metadata?: { filename?: string; detail?: "auto" | "low" | "high" }
    }

/** A provider-issued opaque signature continues a reasoning turn; it is never display content. */
export type AiGatewayThinkingPart = {
  content: string
  signature?: string
}

export type AiGatewayMessage = AiChatMessage & {
  /** Normalized TanStack multimodal parts; text remains for compatibility and titles. */
  parts?: AiGatewayContentPart[]
  /** Prior visible reasoning and its opaque provider continuation signature. */
  thinking?: AiGatewayThinkingPart[]
}

export type AiProviderMode = "builtin" | "custom"

/** The OpenAI-compatible endpoint shape a configured provider actually implements. */
export type AiProviderApi = "chat-completions" | "responses"

/** Input modalities are declared per model; endpoint compatibility is enforced by the gateway. */
export type AiInputModality = "text" | "image" | "audio" | "document"

/** Declared per model; provider/model names are never used to infer this capability. */
export type AiReasoningCapabilities = {
  /** The provider accepts a reasoning-effort control for this model. */
  effort?: boolean
  /** The provider can return a user-visible reasoning summary. */
  summary?: boolean
  /** The Responses provider can return opaque reasoning state for stateless continuation. */
  continuation?: boolean
}

/** Reasoning effort forwarded to providers that support it; unset uses the model default. */
export type AiReasoningEffort = "low" | "medium" | "high"

export type AiCustomProviderConfig = {
  baseUrl: string
  apiKey: string
  model: string
  /** Absent only for legacy custom settings, which retain the historic Chat Completions path. */
  api?: AiProviderApi
  /** Absent only for legacy custom settings, which retain text/image compatibility. */
  inputModalities?: AiInputModality[]
  reasoning?: AiReasoningCapabilities
}

export type AiGatewayRequest = Pick<
  AiGenerateRequest,
  "system" | "temperature" | "maxOutputTokens"
> & {
  /** Single-turn text request. Mutually exclusive with `messages`. */
  prompt?: string
  provider: AiProviderMode
  modelId?: string
  custom?: AiCustomProviderConfig
  reasoningEffort?: AiReasoningEffort
  /** Opaque, host-authorized attachment resources available to this run's tools. */
  attachmentIds?: string[]
  /** Multi-turn conversation history ending with a user message. Mutually exclusive with `prompt`. */
  messages?: AiGatewayMessage[]
}

export type AiGatewayResponse = AiGenerateResult
export type AiGatewayStreamChunk = AiStreamChunk

export type AiGatewayClientConfig = {
  baseUrl: string
  getRequest(): Promise<Pick<AiGatewayRequest, "provider" | "modelId" | "custom">>
  getAuthorization?(): Promise<string | undefined>
  fetcher?: typeof fetch
}

/** Host-owned options for a TanStack AI ChatClient backed by the Tabora gateway. */
export type AiChatClientConfig = AiGatewayClientConfig
