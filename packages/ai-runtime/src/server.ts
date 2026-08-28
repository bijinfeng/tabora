import { chat, toServerSentEventsResponse } from "@tanstack/ai"
import type { StreamChunk } from "@tanstack/ai/client"
import { openaiCompatibleText } from "@tanstack/ai-openai/compatible"
import { AiRuntimeError } from "@tabora/plugin-api"
import type { AiGenerateResult, AiStreamChunk } from "@tabora/plugin-api"

import type { AiCustomProviderConfig, AiGatewayRequest } from "./contracts"

export { AiRuntimeError } from "@tabora/plugin-api"
export type { AiCustomProviderConfig } from "./contracts"

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
  return {
    adapter: openaiCompatibleText(provider.model, {
      apiKey: provider.apiKey,
      baseURL: provider.baseUrl,
      fetch(input, init) {
        return fetch(input, { ...init, redirect: "error" })
      },
    }),
    messages: [{ role: "user" as const, content: request.prompt }],
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

export function parseAiGatewayRequest(value: unknown): AiGatewayRequest {
  if (!value || typeof value !== "object") {
    throw new AiRuntimeError("ai_request_rejected", "Invalid AI request")
  }
  const input = value as Record<string, unknown>
  if (typeof input.prompt !== "string" || !input.prompt.trim() || input.prompt.length > 32_000) {
    throw new AiRuntimeError("ai_request_rejected", "Invalid AI prompt")
  }
  if (input.provider !== "builtin" && input.provider !== "custom") {
    throw new AiRuntimeError("ai_request_rejected", "Invalid AI provider")
  }
  if (
    input.system !== undefined &&
    (typeof input.system !== "string" || input.system.length > 16_000)
  ) {
    throw new AiRuntimeError("ai_request_rejected", "Invalid AI system prompt")
  }
  if (
    input.temperature !== undefined &&
    (typeof input.temperature !== "number" || input.temperature < 0 || input.temperature > 2)
  ) {
    throw new AiRuntimeError("ai_request_rejected", "Invalid AI temperature")
  }
  const maxOutputTokens = input.maxOutputTokens
  if (
    maxOutputTokens !== undefined &&
    (typeof maxOutputTokens !== "number" ||
      !Number.isInteger(maxOutputTokens) ||
      maxOutputTokens < 1 ||
      maxOutputTokens > 8_192)
  ) {
    throw new AiRuntimeError("ai_request_rejected", "Invalid AI output limit")
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
    prompt: input.prompt,
    provider: input.provider,
    ...(typeof input.system === "string" ? { system: input.system } : {}),
    ...(typeof input.temperature === "number" ? { temperature: input.temperature } : {}),
    ...(typeof maxOutputTokens === "number" ? { maxOutputTokens } : {}),
    ...(typeof input.modelId === "string" ? { modelId: input.modelId } : {}),
    ...(customProvider ? { custom: customProvider } : {}),
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
