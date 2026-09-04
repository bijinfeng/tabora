import { chat, toServerSentEventsResponse, type AnyServerTool } from "@tanstack/ai"
import type { StreamChunk } from "@tanstack/ai/client"
import { openaiCompatibleText } from "@tanstack/ai-openai/compatible"
import { AiRuntimeError } from "@tabora/plugin-api"
import type { AiGenerateResult, AiStreamChunk } from "@tabora/plugin-api"

import type {
  AiCustomProviderConfig,
  AiGatewayContentPart,
  AiGatewayMessage,
  AiGatewayThinkingPart,
  AiGatewayRequest,
  AiInputModality,
  AiProviderApi,
} from "./contracts"

export { AiRuntimeError } from "@tabora/plugin-api"
export type { AiCustomProviderConfig } from "./contracts"
export { createAttachmentTools } from "./attachmentTools"
export type { AiAttachmentToolResource } from "./attachmentTools"

const MAX_CHAT_MESSAGES = 100
const MAX_CHAT_MESSAGE_CHARS = 32_000
const MAX_CHAT_TOTAL_CHARS = 96_000

export type AiTextGateway = {
  generate(request: AiGatewayRequest): Promise<AiGenerateResult>
  stream(request: AiGatewayRequest): AsyncIterable<AiStreamChunk>
  streamEvents(request: AiGatewayRequest): AsyncIterable<StreamChunk>
}

export type BuiltinAiModel = AiCustomProviderConfig & { id: string }

export type AiGatewayOptions = {
  builtinModels?: BuiltinAiModel[]
  validateCustomProvider?(provider: AiCustomProviderConfig): Promise<void> | void
  /** Resolves host-owned, server-executed tools for the current run. */
  tools?(request: AiGatewayRequest): readonly AnyServerTool[]
}

function providerForRequest(
  request: AiGatewayRequest,
  options: AiGatewayOptions,
): AiCustomProviderConfig {
  if (request.provider === "custom") {
    if (!request.custom?.baseUrl || !request.custom.apiKey || !request.custom.model) {
      throw new AiRuntimeError("ai_not_configured", "Custom AI provider is not configured")
    }
    return request.custom
  }

  const model = options.builtinModels?.find((candidate) => candidate.id === request.modelId)
  if (!model) throw new AiRuntimeError("ai_model_unavailable", "AI model is unavailable")
  return model
}

async function validateProvider(provider: AiCustomProviderConfig, options: AiGatewayOptions) {
  await options.validateCustomProvider?.(provider)
}

function createChatOptions(
  request: AiGatewayRequest,
  provider: AiCustomProviderConfig,
  tools: readonly AnyServerTool[] = [],
) {
  const messages = request.messages?.length
    ? request.messages.map((message) => ({
        role: message.role,
        content: message.parts?.length ? message.parts : message.text,
        ...(message.thinking?.length ? { thinking: message.thinking } : {}),
      }))
    : [{ role: "user" as const, content: request.prompt ?? "" }]
  const modelOptions: Record<string, unknown> = {}
  if (request.temperature !== undefined) modelOptions.temperature = request.temperature
  if (request.maxOutputTokens !== undefined)
    modelOptions.max_output_tokens = request.maxOutputTokens
  if (provider.reasoning?.summary && (provider.api ?? "chat-completions") === "responses") {
    modelOptions.reasoning = {
      summary: "auto",
      ...(provider.reasoning.effort && request.reasoningEffort
        ? { effort: request.reasoningEffort }
        : {}),
    }
    if (provider.reasoning.continuation) {
      modelOptions.include = ["reasoning.encrypted_content"]
    }
  } else if (provider.reasoning?.effort && request.reasoningEffort !== undefined) {
    // Chat Completions-compatible reasoning APIs commonly use this legacy key.
    modelOptions.reasoning_effort = request.reasoningEffort
  }
  return {
    adapter: openaiCompatibleText(provider.model, {
      apiKey: provider.apiKey,
      baseURL: provider.baseUrl,
      api: provider.api ?? "chat-completions",
      fetch(input, init) {
        return fetch(input, { ...init, redirect: "error" })
      },
    }),
    messages,
    ...(request.system || tools.length
      ? {
          systemPrompts: [
            ...([request.system].filter(Boolean) as string[]),
            ...(tools.length
              ? [
                  "The user attached private files. Use the attachment tools when you need their contents. Start with list_attachments, then read only the relevant bounded ranges. Never claim to have read an attachment unless a tool returned its content.",
                ]
              : []),
          ],
        }
      : {}),
    ...(Object.keys(modelOptions).length > 0 ? { modelOptions } : {}),
    ...(tools.length ? { tools: [...tools] } : {}),
  }
}

const CHAT_COMPLETIONS_MODALITIES = new Set<AiInputModality>(["text", "image"])
const RESPONSES_MODALITIES = new Set<AiInputModality>(["text", "image", "audio", "document"])

function allowedModalities(provider: AiCustomProviderConfig): Set<AiInputModality> {
  const adapterModalities =
    (provider.api ?? "chat-completions") === "responses"
      ? RESPONSES_MODALITIES
      : CHAT_COMPLETIONS_MODALITIES
  const configured = provider.inputModalities ?? ["text", "image"]
  return new Set(configured.filter((modality) => adapterModalities.has(modality)))
}

/** Never let browser-provided parts bypass the selected model's declared input contract. */
function assertMessageModalities(
  request: AiGatewayRequest,
  provider: AiCustomProviderConfig,
): void {
  const allowed = allowedModalities(provider)
  for (const message of request.messages ?? []) {
    for (const part of message.parts ?? []) {
      if (!allowed.has(part.type)) {
        throw new AiRuntimeError(
          "ai_request_rejected",
          `The selected AI model does not accept ${part.type} input`,
        )
      }
    }
  }
}

function wrapProviderError(error: unknown): AiRuntimeError {
  if (error instanceof AiRuntimeError) return error
  return new AiRuntimeError("ai_provider_failed", "AI provider request failed", { cause: error })
}

export function createTanstackAiGateway(options: AiGatewayOptions = {}) {
  async function* streamEvents(request: AiGatewayRequest): AsyncIterable<StreamChunk> {
    try {
      const provider = providerForRequest(request, options)
      await validateProvider(provider, options)
      assertMessageModalities(request, provider)
      const stream = chat(
        createChatOptions(request, provider, options.tools?.(request)),
      ) as AsyncIterable<StreamChunk>
      for await (const chunk of stream) yield chunk
    } catch (error) {
      throw wrapProviderError(error)
    }
  }

  return {
    async generate(request: AiGatewayRequest): Promise<AiGenerateResult> {
      try {
        const provider = providerForRequest(request, options)
        await validateProvider(provider, options)
        assertMessageModalities(request, provider)
        const text = await chat({
          ...createChatOptions(request, provider, options.tools?.(request)),
          stream: false,
        })
        return { text }
      } catch (error) {
        throw wrapProviderError(error)
      }
    },

    async *stream(request: AiGatewayRequest): AsyncIterable<AiStreamChunk> {
      for await (const chunk of streamEvents(request)) {
        if (chunk.type === "TEXT_MESSAGE_CONTENT" && chunk.delta) {
          yield { type: "text-delta", text: chunk.delta }
        }
      }
      yield { type: "finish" }
    },

    streamEvents,
  }
}

function rejectRequest(message: string): never {
  throw new AiRuntimeError("ai_request_rejected", message)
}

type AiProviderSelection = {
  provider: "builtin" | "custom"
  modelId?: string
  custom?: AiCustomProviderConfig
}

function parseProviderSelection(input: Record<string, unknown>): AiProviderSelection {
  if (input.provider !== "builtin" && input.provider !== "custom") {
    rejectRequest("Invalid AI provider")
  }
  let customProvider: AiCustomProviderConfig | undefined
  if (input.provider === "custom") {
    const custom = input.custom
    if (!custom || typeof custom !== "object") {
      throw new AiRuntimeError("ai_not_configured", "Custom AI provider is not configured")
    }
    const config = custom as Record<string, unknown>
    if (
      typeof config.baseUrl !== "string" ||
      typeof config.apiKey !== "string" ||
      typeof config.model !== "string" ||
      !config.baseUrl.trim() ||
      !config.apiKey.trim() ||
      !config.model.trim()
    ) {
      throw new AiRuntimeError("ai_not_configured", "Custom AI provider is not configured")
    }
    const api: AiProviderApi | undefined =
      config.api === "chat-completions" || config.api === "responses" ? config.api : undefined
    if (config.api !== undefined && !api) rejectRequest("Invalid AI provider API")
    const inputModalities = config.inputModalities
    if (
      inputModalities !== undefined &&
      (!Array.isArray(inputModalities) ||
        inputModalities.some(
          (value) =>
            value !== "text" && value !== "image" && value !== "audio" && value !== "document",
        ))
    ) {
      rejectRequest("Invalid AI model input modalities")
    }
    const rawReasoning = config.reasoning
    if (
      rawReasoning !== undefined &&
      (!rawReasoning ||
        typeof rawReasoning !== "object" ||
        ("effort" in rawReasoning && typeof rawReasoning.effort !== "boolean") ||
        ("summary" in rawReasoning && typeof rawReasoning.summary !== "boolean") ||
        ("continuation" in rawReasoning && typeof rawReasoning.continuation !== "boolean"))
    ) {
      rejectRequest("Invalid AI reasoning capabilities")
    }
    const reasoning = rawReasoning as
      | { effort?: boolean; summary?: boolean; continuation?: boolean }
      | undefined
    customProvider = {
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
      model: config.model,
      ...(api ? { api } : {}),
      ...(inputModalities ? { inputModalities: [...inputModalities] as AiInputModality[] } : {}),
      ...(reasoning?.effort || reasoning?.summary || reasoning?.continuation
        ? {
            reasoning: {
              ...(reasoning.effort ? { effort: true } : {}),
              ...(reasoning.summary ? { summary: true } : {}),
              ...(reasoning.continuation ? { continuation: true } : {}),
            },
          }
        : {}),
    }
  }
  return {
    provider: input.provider,
    ...(typeof input.modelId === "string" ? { modelId: input.modelId } : {}),
    ...(customProvider ? { custom: customProvider } : {}),
  }
}

function parseGenerationOptions(input: Record<string, unknown>) {
  if (
    input.system !== undefined &&
    (typeof input.system !== "string" || input.system.length > 16_000)
  ) {
    rejectRequest("Invalid AI system prompt")
  }
  if (
    input.temperature !== undefined &&
    (typeof input.temperature !== "number" || input.temperature < 0 || input.temperature > 2)
  ) {
    rejectRequest("Invalid AI temperature")
  }
  const maxOutputTokens = input.maxOutputTokens
  if (
    maxOutputTokens !== undefined &&
    (typeof maxOutputTokens !== "number" ||
      !Number.isInteger(maxOutputTokens) ||
      maxOutputTokens < 1 ||
      maxOutputTokens > 8_192)
  ) {
    rejectRequest("Invalid AI output limit")
  }
  const rawReasoning = input.reasoningEffort
  const reasoningEffort: AiGatewayRequest["reasoningEffort"] =
    rawReasoning === "low" || rawReasoning === "medium" || rawReasoning === "high"
      ? rawReasoning
      : undefined
  if (rawReasoning !== undefined && reasoningEffort === undefined) {
    rejectRequest("Invalid AI reasoning effort")
  }
  const attachmentIds = input.attachmentIds
  if (
    attachmentIds !== undefined &&
    (!Array.isArray(attachmentIds) ||
      attachmentIds.length > 32 ||
      attachmentIds.some((value) => typeof value !== "string" || !/^[1-9]\d{0,15}$/.test(value)))
  ) {
    rejectRequest("Invalid AI attachment references")
  }
  return {
    ...(typeof input.system === "string" ? { system: input.system } : {}),
    ...(typeof input.temperature === "number" ? { temperature: input.temperature } : {}),
    ...(typeof maxOutputTokens === "number" ? { maxOutputTokens } : {}),
    ...(reasoningEffort ? { reasoningEffort } : {}),
    ...(attachmentIds ? { attachmentIds: [...new Set(attachmentIds)] as string[] } : {}),
  }
}

const MAX_INLINE_MEDIA_CHARS = 8_000_000
const MAX_INLINE_MEDIA_TOTAL_CHARS = 12_000_000

function parseInlineDataSource(
  value: unknown,
  kind: "image" | "audio" | "document",
): { type: "data"; value: string; mimeType: string } {
  if (!value || typeof value !== "object") rejectRequest(`Invalid AI ${kind} source`)
  const source = value as Record<string, unknown>
  const mimeType = source.mimeType
  const validMime =
    typeof mimeType === "string" &&
    (kind === "document"
      ? mimeType.split(";", 1)[0]?.toLowerCase() === "application/pdf"
      : mimeType.startsWith(`${kind}/`))
  if (
    source.type !== "data" ||
    typeof source.value !== "string" ||
    !validMime ||
    source.value.length > MAX_INLINE_MEDIA_CHARS
  ) {
    rejectRequest(`Only bounded inline ${kind} data is supported`)
  }
  return { type: "data", value: source.value, mimeType }
}

function parseChatMessageContent(
  value: unknown,
  role: "user" | "assistant" | "system",
): {
  text: string
  parts?: AiGatewayContentPart[]
  thinking?: AiGatewayThinkingPart[]
  mediaChars: number
} {
  if (typeof value === "string") return { text: value, mediaChars: 0 }
  if (!Array.isArray(value) || value.length === 0) {
    rejectRequest("Invalid AI chat message content")
  }

  const parts: AiGatewayContentPart[] = []
  const thinking: AiGatewayThinkingPart[] = []
  let text = ""
  let mediaChars = 0
  for (const rawPart of value) {
    if (!rawPart || typeof rawPart !== "object") rejectRequest("Invalid AI content part")
    const part = rawPart as Record<string, unknown>
    if (part.type === "text") {
      if (typeof part.text !== "string") rejectRequest("Invalid AI text content part")
      text += part.text
      parts.push({ type: "text", content: part.text })
      continue
    }
    if (part.type === "thinking") {
      if (
        role !== "assistant" ||
        typeof part.content !== "string" ||
        !part.content ||
        part.content.length > 32_000 ||
        (part.signature !== undefined &&
          (typeof part.signature !== "string" || part.signature.length > 65_536))
      ) {
        rejectRequest("Invalid AI reasoning content")
      }
      thinking.push({
        content: part.content,
        ...(typeof part.signature === "string" ? { signature: part.signature } : {}),
      })
      continue
    }
    if (part.type !== "image" && part.type !== "audio" && part.type !== "document") {
      rejectRequest("Unsupported AI content part")
    }
    const source = parseInlineDataSource(part.source, part.type)
    mediaChars += source.value.length
    if (part.type === "document") {
      const metadata = part.metadata
      if (
        metadata !== undefined &&
        (!metadata ||
          typeof metadata !== "object" ||
          ("filename" in metadata &&
            typeof (metadata as Record<string, unknown>).filename !== "string"))
      ) {
        rejectRequest("Invalid AI document metadata")
      }
      parts.push({
        type: "document",
        source,
        ...(metadata
          ? { metadata: metadata as { filename?: string; detail?: "auto" | "low" | "high" } }
          : {}),
      })
      continue
    }
    parts.push({ type: part.type, source })
  }
  return {
    text,
    ...(parts.length ? { parts } : {}),
    ...(thinking.length ? { thinking } : {}),
    mediaChars,
  }
}

/**
 * Chat requests arrive as the AG-UI `RunAgentInput` envelope produced by
 * TanStack AI connection adapters: `messages` at the top level in anchor
 * shape and the host provider selection merged into `forwardedProps`.
 */
function parseAiChatRequest(input: Record<string, unknown>): AiGatewayRequest {
  if (typeof input.prompt === "string") {
    rejectRequest("AI requests cannot combine prompt and messages")
  }
  const forwarded = input.forwardedProps
  const props: Record<string, unknown> = {
    ...(forwarded && typeof forwarded === "object" ? (forwarded as Record<string, unknown>) : {}),
    ...(typeof input.provider === "string" ? { provider: input.provider } : {}),
    ...(typeof input.modelId === "string" ? { modelId: input.modelId } : {}),
    ...(input.custom !== undefined ? { custom: input.custom } : {}),
  }
  if (!Array.isArray(input.messages) || input.messages.length === 0) {
    rejectRequest("Invalid AI chat messages")
  }
  if (input.messages.length > MAX_CHAT_MESSAGES) {
    rejectRequest("Too many AI chat messages")
  }
  const selection = parseProviderSelection(props)
  const options = parseGenerationOptions(props)
  const messages: AiGatewayMessage[] = []
  const systemParts: string[] = []
  let totalChars = 0
  let totalMediaChars = 0
  for (const entry of input.messages) {
    if (!entry || typeof entry !== "object") rejectRequest("Invalid AI chat message")
    const anchor = entry as Record<string, unknown>
    const role = anchor.role
    if (role !== "user" && role !== "assistant" && role !== "system") {
      rejectRequest("Unsupported AI chat message role")
    }
    const normalized = parseChatMessageContent(anchor.content, role)
    if (
      !normalized.text.trim() &&
      (normalized.parts?.length ?? 0) === 0 &&
      (normalized.thinking?.length ?? 0) === 0
    )
      rejectRequest("Invalid AI chat message content")
    if (normalized.text.length > MAX_CHAT_MESSAGE_CHARS) {
      rejectRequest("AI chat message is too long")
    }
    totalChars += normalized.text.length
    if (totalChars > MAX_CHAT_TOTAL_CHARS) {
      rejectRequest("AI chat history is too long")
    }
    totalMediaChars += normalized.mediaChars
    if (totalMediaChars > MAX_INLINE_MEDIA_TOTAL_CHARS) {
      rejectRequest("AI chat attachments are too large")
    }
    if (role === "system") {
      if (normalized.parts) rejectRequest("System messages cannot contain media")
      systemParts.push(normalized.text)
      continue
    }
    messages.push({
      role,
      text: normalized.text,
      ...(normalized.parts ? { parts: normalized.parts } : {}),
      ...(normalized.thinking ? { thinking: normalized.thinking } : {}),
    })
  }
  if (messages.at(-1)?.role !== "user") {
    rejectRequest("AI chat must end with a user message")
  }
  const system = [options.system, ...systemParts].filter(Boolean).join("\n\n")
  return {
    ...selection,
    ...options,
    ...(system ? { system } : {}),
    messages,
  }
}

export function parseAiGatewayRequest(value: unknown): AiGatewayRequest {
  if (!value || typeof value !== "object") {
    throw new AiRuntimeError("ai_request_rejected", "Invalid AI request")
  }
  const input = value as Record<string, unknown>
  if (Array.isArray(input.messages)) return parseAiChatRequest(input)
  if (typeof input.prompt !== "string" || !input.prompt.trim() || input.prompt.length > 32_000) {
    throw new AiRuntimeError("ai_request_rejected", "Invalid AI prompt")
  }
  const selection = parseProviderSelection(input)
  return {
    prompt: input.prompt,
    ...selection,
    ...parseGenerationOptions(input),
  }
}

export function aiErrorResponse(error: unknown): Response {
  const runtimeError = wrapProviderError(error)
  return new Response(
    JSON.stringify({ error: { code: runtimeError.code, message: runtimeError.message } }),
    {
      status: runtimeError.code === "ai_auth_required" ? 401 : 400,
      headers: { "content-type": "application/json" },
    },
  )
}

export function aiStreamResponse(gateway: AiTextGateway, request: AiGatewayRequest): Response {
  return toServerSentEventsResponse(gateway.streamEvents(request))
}
