import type {
  AiChatClient,
  AiChatClientOptions as PublicAiChatClientOptions,
  AiChatConnection,
  AiChatMessage,
  AiGenerateRequest,
  AiRuntimeBridge,
  AiStreamChunk,
} from "@tabora/plugin-api"
import { AiRuntimeError } from "@tabora/plugin-api"
import { ChatClient, fetchServerSentEvents } from "@tanstack/ai-client"
import type { ChatClientOptions, ChatFetcherInput, ConnectionAdapter } from "@tanstack/ai-client"

import type {
  AiChatClientConfig,
  AiGatewayClientConfig,
  AiGatewayRequest,
  AiGatewayResponse,
} from "./contracts"

export * from "./contracts"

export type TanstackAiChatClientOptions = Pick<
  ChatClientOptions,
  "onMessagesChange" | "onLoadingChange" | "onError"
>

function apiUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/$/, "")}${path}`
}

async function requestBody(
  config: AiGatewayClientConfig,
  request: AiGenerateRequest,
): Promise<AiGatewayRequest> {
  return { ...(await config.getRequest()), ...request }
}

async function headers(config: AiGatewayClientConfig): Promise<HeadersInit> {
  const authorization = await config.getAuthorization?.()
  return {
    "content-type": "application/json",
    ...(authorization ? { authorization } : {}),
  }
}

async function throwResponseError(response: Response): Promise<never> {
  const body = (await response.json().catch(() => null)) as {
    error?: { code?: string; message?: string }
  } | null
  const code = body?.error?.code
  const message = body?.error?.message
  if (
    code === "ai_not_configured" ||
    code === "ai_auth_required" ||
    code === "ai_model_unavailable" ||
    code === "ai_request_rejected" ||
    code === "ai_provider_failed"
  ) {
    throw new AiRuntimeError(code, message ?? "AI request failed")
  }
  throw new AiRuntimeError("ai_provider_failed", message ?? "AI request failed")
}

export function createHttpAiRuntime(config: AiGatewayClientConfig): AiRuntimeBridge {
  const fetcher = config.fetcher ?? fetch

  return {
    async generate(request) {
      const response = await fetcher(apiUrl(config.baseUrl, "/api/ai/generate"), {
        method: "POST",
        headers: await headers(config),
        body: JSON.stringify(await requestBody(config, request)),
        ...(request.abortSignal ? { signal: request.abortSignal } : {}),
      })
      if (!response.ok) return throwResponseError(response)
      return (await response.json()) as AiGatewayResponse
    },

    async *stream(request): AsyncIterable<AiStreamChunk> {
      const queue: AiStreamChunk[] = []
      let wake: (() => void) | undefined
      let complete = false
      let failure: Error | undefined
      const client = new ChatClient({
        fetcher: async (_input, { signal }) => {
          const response = await fetcher(apiUrl(config.baseUrl, "/api/ai/stream"), {
            method: "POST",
            headers: await headers(config),
            body: JSON.stringify(await requestBody(config, request)),
            signal,
          })
          if (!response.ok) await throwResponseError(response)
          return response
        },
        onChunk(chunk) {
          const event = chunk as unknown as { type?: string; delta?: string }
          if (event.type === "TEXT_MESSAGE_CONTENT" && event.delta) {
            queue.push({ type: "text-delta", text: event.delta })
            wake?.()
          }
        },
        onError(error) {
          failure = error
          wake?.()
        },
      })
      const abort = () => client.stop()
      request.abortSignal?.addEventListener("abort", abort, { once: true })
      void client.sendMessage(request.prompt).finally(() => {
        complete = true
        wake?.()
      })
      try {
        while (!complete || queue.length) {
          if (queue.length) {
            yield queue.shift()!
            continue
          }
          if (failure) throw failure
          await new Promise<void>((resolve) => {
            wake = resolve
          })
          wake = undefined
        }
        if (failure) throw failure
        yield { type: "finish" }
      } finally {
        request.abortSignal?.removeEventListener("abort", abort)
        client.dispose()
      }
    },

    createChatClient(options = {}) {
      return createPublicAiChatClient(config, options)
    },

    createChatConnection() {
      // The adapter is a TanStack ConnectionAdapter by construction; the
      // bridge narrows it to the TanStack-free AiChatConnection protocol, and
      // consumers bridge it back with a single structural cast.
      return createAiChatConnection(config) as unknown as AiChatConnection
    },
  }
}

/**
 * Create the TanStack-compatible connection adapter for the Tabora AI
 * gateway. The host resolves provider selection and authorization per run;
 * the conversation itself travels in the AG-UI request envelope.
 */
export function createAiChatConnection(config: AiGatewayClientConfig): ConnectionAdapter {
  return fetchServerSentEvents(apiUrl(config.baseUrl, "/api/ai/stream"), async () => {
    const providerRequest = await config.getRequest()
    const authorization = await config.getAuthorization?.()
    return {
      headers: authorization ? { authorization } : {},
      body: providerRequest,
      fetchClient: gatewayFetchClient(config.fetcher ?? fetch),
    }
  })
}

/** Surface normalized AI runtime errors instead of opaque stream failures. */
function gatewayFetchClient(fetcher: typeof fetch): typeof fetch {
  return async (input, init) => {
    const response = await fetcher(input, init)
    if (!response.ok) await throwResponseError(response)
    return response
  }
}

function textFromMessage(message: ChatFetcherInput["messages"][number]): string {
  return message.parts
    .filter((part): part is { type: "text"; content: string } => part.type === "text")
    .map((part) => part.content)
    .join("")
}

function latestPrompt(input: ChatFetcherInput): string {
  const message = [...input.messages].reverse().find((candidate) => candidate.role === "user")
  return message ? textFromMessage(message) : ""
}

/**
 * Create a TanStack `ChatClient` whose transport is owned by the host and
 * whose stream is the Tabora AG-UI gateway. Consumers should observe the
 * client's callbacks/getMessages rather than maintaining a parallel stream
 * queue or loading state.
 */
export function createHttpAiChatClient(
  config: AiChatClientConfig,
  options: TanstackAiChatClientOptions = {},
): ChatClient {
  const fetcher = config.fetcher ?? fetch
  return new ChatClient({
    ...(options.onMessagesChange
      ? { onMessagesChange: (messages) => options.onMessagesChange?.(messages) }
      : {}),
    ...(options.onLoadingChange
      ? { onLoadingChange: (loading) => options.onLoadingChange?.(loading) }
      : {}),
    ...(options.onError ? { onError: (error) => options.onError?.(error) } : {}),
    fetcher: async (input, requestOptions) => {
      const providerRequest = await config.getRequest()
      const requestHeaders = new Headers(await headers(config))
      for (const [key, value] of Object.entries(requestOptions.headers ?? {})) {
        requestHeaders.set(key, value)
      }
      const response = await fetcher(apiUrl(config.baseUrl, "/api/ai/stream"), {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify({
          ...providerRequest,
          prompt: latestPrompt(input),
          ...(typeof input.data?.system === "string" ? { system: input.data.system } : {}),
          ...(typeof input.data?.temperature === "number"
            ? { temperature: input.data.temperature }
            : {}),
          ...(typeof input.data?.maxOutputTokens === "number"
            ? { maxOutputTokens: input.data.maxOutputTokens }
            : {}),
          ...(input.data?.reasoningEffort === "low" ||
          input.data?.reasoningEffort === "medium" ||
          input.data?.reasoningEffort === "high"
            ? { reasoningEffort: input.data.reasoningEffort }
            : {}),
          ...(typeof input.data?.modelId === "string" ? { modelId: input.data.modelId } : {}),
        } satisfies AiGatewayRequest),
        signal: requestOptions.signal,
      })
      if (!response.ok) await throwResponseError(response)
      return response
    },
  })
}

function textFromParts(message: ReturnType<ChatClient["getMessages"]>[number]): string {
  return message.parts
    .filter((part): part is { type: "text"; content: string } => part.type === "text")
    .map((part) => part.content)
    .join("")
}

function publicMessages(messages: ReturnType<ChatClient["getMessages"]>): AiChatMessage[] {
  const result: AiChatMessage[] = []
  for (const message of messages) {
    if (message.role === "user" || message.role === "assistant") {
      result.push({ role: message.role, text: textFromParts(message) })
    }
  }
  return result
}

function createPublicAiChatClient(
  config: AiChatClientConfig,
  options: PublicAiChatClientOptions,
): AiChatClient {
  const client = createHttpAiChatClient(config, {
    onMessagesChange(messages) {
      options.onMessagesChange?.(publicMessages(messages))
    },
    ...(options.onLoadingChange
      ? { onLoadingChange: (loading) => options.onLoadingChange?.(loading) }
      : {}),
    ...(options.onError ? { onError: (error) => options.onError?.(error) } : {}),
  })
  return {
    send(prompt, request) {
      return client.sendMessage(prompt, request)
    },
    stop() {
      client.stop()
    },
    dispose() {
      client.dispose()
    },
    getMessages() {
      return publicMessages(client.getMessages())
    },
  }
}
