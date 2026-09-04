import { describe, expect, it } from "vitest"

import type { ConnectConnectionAdapter, UIMessage } from "@tanstack/ai-client"
import type { AiGatewayClientConfig } from "./contracts"
import {
  createAiChatConnection,
  createHttpAiChatClient,
  createHttpAiRuntime,
} from "./httpAiRuntime"

function requestJson(init: RequestInit | undefined): Record<string, unknown> {
  if (typeof init?.body !== "string") throw new Error("Expected JSON request body")
  return JSON.parse(init.body) as Record<string, unknown>
}

describe("createHttpAiRuntime", () => {
  it("sends only the host-selected provider configuration to the gateway", async () => {
    let init: RequestInit | undefined
    const runtime = createHttpAiRuntime({
      baseUrl: "https://tabora.test/",
      getRequest: async () => ({ provider: "builtin", modelId: "platform-text" }),
      getAuthorization: async () => "Bearer user-token",
      fetcher: async (_input, next) => {
        init = next
        return Response.json({ text: "summary" })
      },
    })

    await expect(runtime.generate({ prompt: "hello" })).resolves.toEqual({ text: "summary" })
    expect(init?.headers).toMatchObject({ authorization: "Bearer user-token" })
    expect(requestJson(init)).toEqual({
      provider: "builtin",
      modelId: "platform-text",
      prompt: "hello",
    })
  })

  it("maps SSE text deltas and terminal chunks to the public bridge", async () => {
    const encoder = new TextEncoder()
    const runtime = createHttpAiRuntime({
      baseUrl: "https://tabora.test",
      getRequest: async () => ({ provider: "builtin", modelId: "platform-text" }),
      fetcher: async () =>
        new Response(
          new ReadableStream({
            start(controller) {
              controller.enqueue(
                encoder.encode(
                  'data: {"type":"RUN_STARTED","threadId":"thread-1","runId":"run-1"}\n\n',
                ),
              )
              controller.enqueue(
                encoder.encode(
                  'data: {"type":"TEXT_MESSAGE_START","messageId":"message-1","role":"assistant"}\n\n',
                ),
              )
              controller.enqueue(
                encoder.encode(
                  'data: {"type":"TEXT_MESSAGE_CONTENT","messageId":"message-1","delta":"hel"}\n\n',
                ),
              )
              controller.enqueue(
                encoder.encode('data: {"type":"TEXT_MESSAGE_END","messageId":"message-1"}\n\n'),
              )
              controller.enqueue(
                encoder.encode(
                  'data: {"type":"RUN_FINISHED","threadId":"thread-1","runId":"run-1"}\n\n',
                ),
              )
              controller.close()
            },
          }),
        ),
    })

    const chunks = []
    for await (const chunk of runtime.stream({ prompt: "hello" })) chunks.push(chunk)
    expect(chunks).toEqual([{ type: "text-delta", text: "hel" }, { type: "finish" }])
  })

  it("cancels the TanStack client request when the public stream is aborted", async () => {
    const abortController = new AbortController()
    let requestStarted: (() => void) | undefined
    const started = new Promise<void>((resolve) => {
      requestStarted = resolve
    })
    let aborted = false
    const runtime = createHttpAiRuntime({
      baseUrl: "https://tabora.test",
      getRequest: async () => ({ provider: "builtin", modelId: "platform-text" }),
      fetcher: async (_input, init) =>
        new Promise<Response>((_resolve, reject) => {
          requestStarted?.()
          init?.signal?.addEventListener(
            "abort",
            () => {
              aborted = true
              const error = new Error("Request was cancelled")
              error.name = "AbortError"
              reject(error)
            },
            { once: true },
          )
        }),
    })

    const iterator = runtime
      .stream({ prompt: "hello", abortSignal: abortController.signal })
      [Symbol.asyncIterator]()
    const next = iterator.next()
    await started
    abortController.abort()

    await expect(next).resolves.toEqual({ value: { type: "finish" }, done: false })
    expect(aborted).toBe(true)
    await expect(iterator.next()).resolves.toEqual({ value: undefined, done: true })
  })

  it("exposes a TanStack ChatClient transport for host-owned session state", async () => {
    let body: Record<string, unknown> | undefined
    const encoder = new TextEncoder()
    const client = createHttpAiChatClient({
      baseUrl: "https://tabora.test",
      getRequest: async () => ({ provider: "builtin", modelId: "platform-text" }),
      fetcher: async (_input, init) => {
        body = requestJson(init)
        return new Response(
          new ReadableStream({
            start(controller) {
              controller.enqueue(
                encoder.encode(
                  'data: {"type":"RUN_STARTED","threadId":"thread-1","runId":"run-1"}\n\n',
                ),
              )
              controller.enqueue(
                encoder.encode(
                  'data: {"type":"TEXT_MESSAGE_START","messageId":"message-1","role":"assistant"}\n\n',
                ),
              )
              controller.enqueue(
                encoder.encode(
                  'data: {"type":"TEXT_MESSAGE_CONTENT","messageId":"message-1","delta":"done"}\n\n',
                ),
              )
              controller.enqueue(
                encoder.encode('data: {"type":"TEXT_MESSAGE_END","messageId":"message-1"}\n\n'),
              )
              controller.enqueue(
                encoder.encode(
                  'data: {"type":"RUN_FINISHED","threadId":"thread-1","runId":"run-1"}\n\n',
                ),
              )
              controller.close()
            },
          }),
        )
      },
    })

    await client.sendMessage("summarize this")
    expect(body).toMatchObject({
      provider: "builtin",
      modelId: "platform-text",
      prompt: "summarize this",
    })
    expect(client.getMessages().at(-1)?.parts).toEqual([{ type: "text", content: "done" }])
    client.dispose()
  })
})

describe("createAiChatConnection", () => {
  const SSE_RESPONSE = (delta: string) =>
    new Response(
      new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder()
          controller.enqueue(
            encoder.encode('data: {"type":"RUN_STARTED","threadId":"t","runId":"r"}\n\n'),
          )
          controller.enqueue(
            encoder.encode(
              `data: {"type":"TEXT_MESSAGE_CONTENT","messageId":"message-1","delta":"${delta}"}\n\n`,
            ),
          )
          controller.enqueue(
            encoder.encode('data: {"type":"RUN_FINISHED","threadId":"t","runId":"r"}\n\n'),
          )
          controller.close()
        },
      }),
    )

  const WIRE_USER_MESSAGE = {
    id: "m1",
    role: "user",
    parts: [{ type: "text", content: "hi" }],
  } as UIMessage

  function makeConfig(overrides: Partial<AiGatewayClientConfig> = {}): AiGatewayClientConfig {
    return {
      baseUrl: "https://tabora.test",
      getRequest: async () => ({ provider: "builtin", modelId: "platform-text" }),
      ...overrides,
    }
  }

  it("posts the AG-UI envelope with host provider selection and per-run options", async () => {
    let url: string | undefined
    let init: RequestInit | undefined
    const connection = createAiChatConnection(
      makeConfig({
        getAuthorization: async () => "Bearer user-token",
        fetcher: async (input, next) => {
          url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url
          init = next
          return SSE_RESPONSE("done")
        },
      }),
    )

    const chunks = []
    for await (const chunk of (connection as ConnectConnectionAdapter).connect(
      [WIRE_USER_MESSAGE],
      { temperature: 0.4 },
      undefined,
      {
        threadId: "thread-1",
        runId: "run-1",
      },
    )) {
      chunks.push(chunk)
    }

    expect(url).toBe("https://tabora.test/api/ai/stream")
    expect(init?.headers).toMatchObject({ authorization: "Bearer user-token" })
    const body = requestJson(init) as {
      messages: Array<{ role: string; content: string }>
      forwardedProps: Record<string, unknown>
      threadId?: string
      runId?: string
    }
    expect(body.messages).toEqual([{ id: "m1", role: "user", content: "hi" }])
    expect(body.forwardedProps).toMatchObject({
      provider: "builtin",
      modelId: "platform-text",
      temperature: 0.4,
    })
    expect(body.threadId).toBe("thread-1")
    expect(body.runId).toBe("run-1")
    expect(chunks.length).toBeGreaterThan(0)
  })

  it("normalizes gateway error responses into the AI runtime error contract", async () => {
    const connection = createAiChatConnection(
      makeConfig({
        fetcher: async () =>
          Response.json(
            { error: { code: "ai_not_configured", message: "no model" } },
            { status: 400 },
          ),
      }),
    )

    await expect(async () => {
      for await (const _chunk of (connection as ConnectConnectionAdapter).connect(
        [WIRE_USER_MESSAGE],
        undefined,
        undefined,
        undefined,
      )) {
        // consume the failing stream
      }
    }).rejects.toMatchObject({
      // TanStack wraps fetch failures; the normalized runtime error rides the cause chain.
      cause: { code: "ai_not_configured", name: "AiRuntimeError" },
    })
  })

  it("preserves the budget-exceeded error code returned by the gateway", async () => {
    const runtime = createHttpAiRuntime(
      makeConfig({
        fetcher: async () =>
          Response.json(
            { error: { code: "ai_budget_exceeded", message: "monthly budget reached" } },
            { status: 429 },
          ),
      }),
    )

    await expect(runtime.generate({ prompt: "hello" })).rejects.toMatchObject({
      code: "ai_budget_exceeded",
      message: "monthly budget reached",
    })
  })
})
