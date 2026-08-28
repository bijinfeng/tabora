import { describe, expect, it } from "vitest"

import { createHttpAiChatClient, createHttpAiRuntime } from "./httpAiRuntime"

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
