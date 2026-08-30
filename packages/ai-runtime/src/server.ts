import { chat, toServerSentEventsResponse } from "@tanstack/ai"
import type { StreamChunk } from "@tanstack/ai/client"
import { openaiCompatibleText } from "@tanstack/ai-openai/compatible"
import { AiRuntimeError } from "@tabora/plugin-api"
import type { AiChatMessage, AiGenerateResult, AiStreamChunk } from "@tabora/plugin-api"

import type { AiCustomProviderConfig, AiGatewayRequest } from "./contracts"

export { AiRuntimeError } from "@tabora/plugin-api"
export type { AiCustomProviderConfig } from "./contracts"

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

function createChatOptions(request: AiGatewayRequest, provider: AiCustomProviderConfig) {
  const messages = request.messages?.length
    ? request.messages.map((message) => ({ role: message.role, content: message.text }))
    : [{ role: "user" as const, content: request.prompt ?? "" }]
  return {
    adapter: openaiCompatibleText(provider.model, {
      apiKey: provider.apiKey,
      baseURL: provider.baseUrl,
      fetch(input, init) {
        return fetch(input, { ...init, redirect: "error" })
      },
    }),
    messages,
    ...(request.system ? { systemPrompts: [request.system] } : {}),
    ...(request.temperature === undefined && request.maxOutputTokens === undefined
      ? {}
      : {
          modelOptions: {
            ...(request.temperature === undefined ? {} : { temperature: request.temperature }),
            ...(request.maxOutputTokens === undefined
              ? {}
              : { max_output_tokens: request.maxOutputTokens }),
          },
        }),
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
      const stream = chat(createChatOptions(request, provider)) as AsyncIterable<StreamChunk>
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
        const text = await chat({ ...createChatOptions(request, provider), stream: false })
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
    customProvider = {
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
      model: config.model,
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
  return {
    ...(typeof input.system === "string" ? { system: input.system } : {}),
    ...(typeof input.temperature === "number" ? { temperature: input.temperature } : {}),
    ...(typeof maxOutputTokens === "number" ? { maxOutputTokens } : {}),
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
  const messages: AiChatMessage[] = []
  const systemParts: string[] = []
  let totalChars = 0
  for (const entry of input.messages) {
    if (!entry || typeof entry !== "object") rejectRequest("Invalid AI chat message")
    const anchor = entry as Record<string, unknown>
    const role = anchor.role
    if (role !== "user" && role !== "assistant" && role !== "system") {
      rejectRequest("Unsupported AI chat message role")
    }
    if (typeof anchor.content !== "string" || !anchor.content.trim()) {
      rejectRequest("Invalid AI chat message content")
    }
    if (anchor.content.length > MAX_CHAT_MESSAGE_CHARS) {
      rejectRequest("AI chat message is too long")
    }
    totalChars += anchor.content.length
    if (totalChars > MAX_CHAT_TOTAL_CHARS) {
      rejectRequest("AI chat history is too long")
    }
    if (role === "system") {
      systemParts.push(anchor.content)
      continue
    }
    messages.push({ role, text: anchor.content })
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
