import { describe, expect, it, vi } from "vitest"
import { createVercelAiRuntime, AiRuntimeError } from "./vercelAiRuntime"

describe("createVercelAiRuntime", () => {
  it("fails with a typed configuration error when no text model is configured", async () => {
    const runtime = createVercelAiRuntime({
      config: { enabled: true },
      generateText: async () => ({ text: "unreachable" }),
      streamText: () => ({ textStream: (async function* () {})() }),
    })

    await expect(runtime.generate({ prompt: "hello" })).rejects.toMatchObject({
      code: "ai_not_configured",
      message: "AI text model is not configured",
    })
  })

  it("delegates text generation to the Vercel AI SDK adapter", async () => {
    const generateText = vi.fn(async () => ({
      text: "summary",
      finishReason: "stop",
      usage: { inputTokens: 4, outputTokens: 2, totalTokens: 6 },
    }))
    const runtime = createVercelAiRuntime({
      config: { enabled: true, defaultTextModel: "openai/gpt-5-mini" },
      generateText,
      streamText: () => ({ textStream: (async function* () {})() }),
    })

    await expect(runtime.generate({ prompt: "summarize", system: "Be brief" })).resolves.toEqual({
      text: "summary",
      finishReason: "stop",
      usage: { inputTokens: 4, outputTokens: 2, totalTokens: 6 },
    })
    expect(generateText).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "openai/gpt-5-mini",
        prompt: "summarize",
        system: "Be brief",
      }),
    )
  })

  it("streams text deltas from the Vercel AI SDK adapter", async () => {
    const runtime = createVercelAiRuntime({
      config: { enabled: true, defaultTextModel: "openai/gpt-5-mini" },
      generateText: async () => ({ text: "" }),
      streamText: () => ({
        textStream: (async function* () {
          yield "hel"
          yield "lo"
        })(),
      }),
    })

    const chunks = []
    for await (const chunk of runtime.stream({ prompt: "greet" })) {
      chunks.push(chunk)
    }

    expect(chunks).toEqual([
      { type: "text-delta", text: "hel" },
      { type: "text-delta", text: "lo" },
      { type: "finish" },
    ])
  })

  it("requires approval before executing sensitive AI tools", async () => {
    const execute = vi.fn(async () => ({ ok: true }))
    const requestToolApproval = vi.fn(async () => ({ approved: false, reason: "user rejected" }))
    let toolExecute: ((input: unknown) => Promise<unknown>) | undefined
    const generateText = vi.fn(
      async (options: { tools?: Record<string, { execute?: typeof toolExecute }> }) => {
        toolExecute = options.tools?.createTodo?.execute
        return { text: "planned" }
      },
    )
    const runtime = createVercelAiRuntime({
      config: { enabled: true, defaultTextModel: "openai/gpt-5-mini" },
      generateText,
      streamText: () => ({ textStream: (async function* () {})() }),
      requestToolApproval,
    })

    await runtime.generate({
      prompt: "create a todo",
      tools: [
        {
          id: "createTodo",
          description: "Create a todo item",
          requiresConfirmation: true,
          inputSchema: { type: "object" },
          execute,
        },
      ],
    })

    await expect(toolExecute?.({ title: "Ship AI runtime" })).resolves.toEqual({
      ok: false,
      reason: "user rejected",
    })
    expect(execute).not.toHaveBeenCalled()
    expect(requestToolApproval).toHaveBeenCalledWith({
      toolId: "createTodo",
      input: { title: "Ship AI runtime" },
      description: "Create a todo item",
    })
  })

  it("wraps provider failures in a typed runtime error", async () => {
    const runtime = createVercelAiRuntime({
      config: { enabled: true, defaultTextModel: "openai/gpt-5-mini" },
      generateText: async () => {
        throw new Error("provider unavailable")
      },
      streamText: () => ({ textStream: (async function* () {})() }),
    })

    await expect(runtime.generate({ prompt: "hello" })).rejects.toBeInstanceOf(AiRuntimeError)
    await expect(runtime.generate({ prompt: "hello" })).rejects.toMatchObject({
      code: "ai_provider_failed",
      message: "AI provider request failed",
    })
  })
})
