import { describe, expect, it } from "vitest"

import { AiRuntimeError, createTanstackAiGateway, parseAiGatewayRequest } from "./server"
import { createAiUsageTracker } from "./usage"

function requestJson(init: RequestInit | undefined): Record<string, unknown> {
  if (typeof init?.body !== "string") throw new Error("Expected JSON request body")
  return JSON.parse(init.body) as Record<string, unknown>
}

describe("AI gateway request contract", () => {
  it("accepts a complete custom provider only for one request", () => {
    expect(
      parseAiGatewayRequest({
        provider: "custom",
        prompt: "summarize",
        custom: { baseUrl: "https://provider.test/v1", apiKey: "secret", model: "model-a" },
      }),
    ).toEqual({
      provider: "custom",
      prompt: "summarize",
      custom: { baseUrl: "https://provider.test/v1", apiKey: "secret", model: "model-a" },
    })
  })

  it("rejects malformed prompts and provider selections", () => {
    expect(() => parseAiGatewayRequest({ provider: "builtin", prompt: "" })).toThrow(AiRuntimeError)
    expect(() => parseAiGatewayRequest({ provider: "other", prompt: "hello" })).toThrow(
      AiRuntimeError,
    )
  })

  it("accepts the AG-UI chat envelope with provider selection from forwardedProps", () => {
    expect(
      parseAiGatewayRequest({
        threadId: "thread-1",
        runId: "run-1",
        state: {},
        messages: [
          { id: "m1", role: "user", content: "hi" },
          { id: "m2", role: "assistant", content: "hello" },
          { id: "m3", role: "user", content: "summarize this" },
        ],
        tools: [],
        context: [],
        forwardedProps: {
          provider: "custom",
          custom: {
            baseUrl: "https://provider.test/v1",
            apiKey: "secret",
            model: "model-a",
            reasoning: { effort: true },
          },
          system: "Be concise.",
        },
      }),
    ).toEqual({
      provider: "custom",
      custom: {
        baseUrl: "https://provider.test/v1",
        apiKey: "secret",
        model: "model-a",
        reasoning: { effort: true },
      },
      system: "Be concise.",
      messages: [
        { role: "user", text: "hi" },
        { role: "assistant", text: "hello" },
        { role: "user", text: "summarize this" },
      ],
    })
  })

  it("accepts bounded inline image parts from the TanStack AG-UI envelope", () => {
    expect(
      parseAiGatewayRequest({
        messages: [
          {
            id: "m1",
            role: "user",
            content: [
              { type: "text", text: "描述这张图" },
              {
                type: "image",
                source: { type: "data", value: "iVBORw==", mimeType: "image/png" },
              },
            ],
          },
        ],
        forwardedProps: { provider: "builtin", modelId: "vision-model" },
      }),
    ).toEqual({
      provider: "builtin",
      modelId: "vision-model",
      messages: [
        {
          role: "user",
          text: "描述这张图",
          parts: [
            { type: "text", content: "描述这张图" },
            {
              type: "image",
              source: { type: "data", value: "iVBORw==", mimeType: "image/png" },
            },
          ],
        },
      ],
    })
  })

  it("accepts bounded PDF and audio parts only as inline data", () => {
    expect(
      parseAiGatewayRequest({
        messages: [
          {
            id: "m1",
            role: "user",
            content: [
              { type: "text", text: "总结附件" },
              {
                type: "document",
                source: { type: "data", value: "JVBERi0=", mimeType: "application/pdf" },
                metadata: { filename: "report.pdf" },
              },
              {
                type: "audio",
                source: { type: "data", value: "SUQz", mimeType: "audio/mpeg" },
              },
            ],
          },
        ],
        forwardedProps: {
          provider: "custom",
          custom: {
            baseUrl: "https://provider.test/v1",
            apiKey: "secret",
            model: "multimodal",
            api: "responses",
            inputModalities: ["text", "audio", "document"],
          },
        },
      }),
    ).toMatchObject({
      messages: [
        {
          text: "总结附件",
          parts: [
            { type: "text", content: "总结附件" },
            { type: "document", metadata: { filename: "report.pdf" } },
            { type: "audio" },
          ],
        },
      ],
    })
    expect(() =>
      parseAiGatewayRequest({
        messages: [
          {
            id: "m1",
            role: "user",
            content: [
              { type: "text", text: "bad" },
              {
                type: "document",
                source: { type: "data", value: "not-a-pdf", mimeType: "text/plain" },
              },
            ],
          },
        ],
        forwardedProps: { provider: "builtin", modelId: "test" },
      }),
    ).toThrow(AiRuntimeError)
  })

  it("carries per-conversation run options from forwardedProps", () => {
    expect(
      parseAiGatewayRequest({
        messages: [{ id: "m1", role: "user", content: "summarize this" }],
        forwardedProps: {
          provider: "builtin",
          modelId: "platform-text",
          temperature: 0.4,
          maxOutputTokens: 512,
          reasoningEffort: "high",
        },
      }),
    ).toEqual({
      provider: "builtin",
      modelId: "platform-text",
      temperature: 0.4,
      maxOutputTokens: 512,
      reasoningEffort: "high",
      messages: [{ role: "user", text: "summarize this" }],
    })
  })

  it("preserves assistant reasoning summaries and opaque continuation signatures", () => {
    const parsed = parseAiGatewayRequest({
      messages: [
        { id: "m1", role: "user", content: "分析这个问题" },
        {
          id: "m2",
          role: "assistant",
          content: [{ type: "thinking", content: "先检查约束", signature: "opaque-state" }],
        },
        { id: "m3", role: "user", content: "继续" },
      ],
      forwardedProps: { provider: "builtin", modelId: "reasoning-model" },
    })
    expect(parsed.messages?.[1]).toMatchObject({
      role: "assistant",
      text: "",
      thinking: [{ content: "先检查约束", signature: "opaque-state" }],
    })
    expect(() =>
      parseAiGatewayRequest({
        messages: [
          { id: "m1", role: "user", content: [{ type: "thinking", content: "不能伪造" }] },
        ],
        forwardedProps: { provider: "builtin", modelId: "reasoning-model" },
      }),
    ).toThrow(AiRuntimeError)
  })

  it("accepts only bounded opaque attachment references from a chat run", () => {
    expect(
      parseAiGatewayRequest({
        messages: [{ id: "m1", role: "user", content: "inspect this" }],
        forwardedProps: {
          provider: "builtin",
          modelId: "platform-text",
          attachmentIds: ["12", "12", "98"],
        },
      }),
    ).toMatchObject({ attachmentIds: ["12", "98"] })
    expect(() =>
      parseAiGatewayRequest({
        messages: [{ id: "m1", role: "user", content: "inspect this" }],
        forwardedProps: { provider: "builtin", attachmentIds: ["../../etc/passwd"] },
      }),
    ).toThrow(AiRuntimeError)
  })

  it("rejects an invalid reasoning effort", () => {
    expect(() =>
      parseAiGatewayRequest({
        messages: [{ id: "m1", role: "user", content: "hi" }],
        forwardedProps: { provider: "builtin", reasoningEffort: "extreme" },
      }),
    ).toThrow(AiRuntimeError)
  })

  it("rejects chat envelopes that are malformed or out of bounds", () => {
    const envelope = {
      messages: [
        { id: "m1", role: "user", content: "hi" },
        { id: "m2", role: "assistant", content: "hello" },
      ],
      forwardedProps: { provider: "builtin", modelId: "platform-text" },
    }
    expect(() => parseAiGatewayRequest({ ...envelope, prompt: "conflicting prompt" })).toThrow(
      AiRuntimeError,
    )
    expect(() =>
      parseAiGatewayRequest({
        ...envelope,
        messages: [{ id: "m1", role: "assistant", content: "no user turn" }],
      }),
    ).toThrow(AiRuntimeError)
    expect(() =>
      parseAiGatewayRequest({
        ...envelope,
        messages: [{ id: "m1", role: "tool", content: "unsupported role" }],
      }),
    ).toThrow(AiRuntimeError)
    expect(() =>
      parseAiGatewayRequest({
        ...envelope,
        messages: [{ id: "m1", role: "user", content: "" }],
      }),
    ).toThrow(AiRuntimeError)
    expect(() =>
      parseAiGatewayRequest({
        ...envelope,
        messages: Array.from({ length: 101 }, (_, index) => ({
          id: `m${index}`,
          role: "user",
          content: "hi",
        })),
      }),
    ).toThrow(AiRuntimeError)
  })

  it("forwards the full multi-turn history to the provider adapter", async () => {
    const originalFetch = globalThis.fetch
    let requestBody: Record<string, unknown> | undefined
    globalThis.fetch = async (_input, init) => {
      requestBody = requestJson(init)
      throw new Error("blocked provider request")
    }
    const gateway = createTanstackAiGateway()

    try {
      await expect(
        gateway.generate({
          provider: "custom",
          custom: { baseUrl: "https://provider.test/v1", apiKey: "secret", model: "model-a" },
          system: "Be concise.",
          messages: [
            { role: "user", text: "hi" },
            { role: "assistant", text: "hello" },
            { role: "user", text: "summarize this" },
          ],
        }),
      ).rejects.toMatchObject({ code: "ai_provider_failed" })
      expect(requestBody?.messages).toEqual([
        { role: "system", content: "Be concise." },
        { role: "user", content: "hi" },
        { role: "assistant", content: "hello" },
        { role: "user", content: "summarize this" },
      ])
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it("enforces optional gateway budgets and records estimated usage", async () => {
    const usageTracker = createAiUsageTracker(() => new Date("2026-01-01T00:00:00.000Z"))
    const gateway = createTanstackAiGateway({
      builtinModels: [
        { id: "model-a", baseUrl: "https://provider.test/v1", apiKey: "secret", model: "model-a" },
      ],
      usageTracker,
      budget: { maxRequests: 1 },
    })
    const originalFetch = globalThis.fetch
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ choices: [{ message: { content: "ok" } }] }), {
        headers: { "content-type": "application/json" },
      })
    try {
      await gateway.generate({ provider: "builtin", modelId: "model-a", prompt: "hello" })
      await expect(
        gateway.generate({ provider: "builtin", modelId: "model-a", prompt: "again" }),
      ).rejects.toMatchObject({ code: "ai_budget_exceeded" })
      expect(usageTracker.getStats()).toMatchObject({ requestCount: 1, totalTokens: 2 })
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it("forwards inline image parts to OpenAI-compatible providers", async () => {
    const originalFetch = globalThis.fetch
    let requestBody: Record<string, unknown> | undefined
    globalThis.fetch = async (_input, init) => {
      requestBody = requestJson(init)
      throw new Error("blocked provider request")
    }
    const gateway = createTanstackAiGateway()

    try {
      await expect(
        gateway.generate({
          provider: "custom",
          custom: { baseUrl: "https://provider.test/v1", apiKey: "secret", model: "vision" },
          messages: [
            {
              role: "user",
              text: "看图",
              parts: [
                { type: "text", content: "看图" },
                {
                  type: "image",
                  source: { type: "data", value: "iVBORw==", mimeType: "image/png" },
                },
              ],
            },
          ],
        }),
      ).rejects.toMatchObject({ code: "ai_provider_failed" })
      expect(requestBody?.messages).toEqual([
        {
          role: "user",
          content: [
            { type: "text", text: "看图" },
            {
              type: "image_url",
              image_url: { url: "data:image/png;base64,iVBORw==", detail: "auto" },
            },
          ],
        },
      ])
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it("uses the Responses adapter for declared PDF/audio models", async () => {
    const originalFetch = globalThis.fetch
    let requestBody: Record<string, unknown> | undefined
    globalThis.fetch = async (_input, init) => {
      requestBody = requestJson(init)
      throw new Error("blocked provider request")
    }
    const gateway = createTanstackAiGateway()

    try {
      await expect(
        gateway.generate({
          provider: "custom",
          custom: {
            baseUrl: "https://provider.test/v1",
            apiKey: "secret",
            model: "multimodal",
            api: "responses",
            inputModalities: ["text", "audio", "document"],
          },
          messages: [
            {
              role: "user",
              text: "总结附件",
              parts: [
                { type: "text", content: "总结附件" },
                {
                  type: "document",
                  source: { type: "data", value: "JVBERi0=", mimeType: "application/pdf" },
                  metadata: { filename: "report.pdf" },
                },
                {
                  type: "audio",
                  source: { type: "data", value: "SUQz", mimeType: "audio/mpeg" },
                },
              ],
            },
          ],
        }),
      ).rejects.toMatchObject({ code: "ai_provider_failed" })
      expect(requestBody?.input).toEqual([
        {
          type: "message",
          role: "user",
          content: [
            { type: "input_text", text: "总结附件" },
            {
              type: "input_file",
              filename: "report.pdf",
              file_data: "data:application/pdf;base64,JVBERi0=",
            },
            { type: "input_file", file_data: "data:audio/mpeg;base64,SUQz" },
          ],
        },
      ])
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it("rejects media that the selected model has not declared", async () => {
    const gateway = createTanstackAiGateway()
    await expect(
      gateway.generate({
        provider: "custom",
        custom: {
          baseUrl: "https://provider.test/v1",
          apiKey: "secret",
          model: "text-only",
          inputModalities: ["text"],
        },
        messages: [
          {
            role: "user",
            text: "看图",
            parts: [
              { type: "text", content: "看图" },
              {
                type: "image",
                source: { type: "data", value: "iVBORw==", mimeType: "image/png" },
              },
            ],
          },
        ],
      }),
    ).rejects.toMatchObject({ code: "ai_request_rejected" })
  })

  it("forwards per-conversation run options into the provider request body", async () => {
    const originalFetch = globalThis.fetch
    let requestBody: Record<string, unknown> | undefined
    globalThis.fetch = async (_input, init) => {
      requestBody = requestJson(init)
      throw new Error("blocked provider request")
    }
    const gateway = createTanstackAiGateway()

    try {
      await expect(
        gateway.generate({
          provider: "custom",
          custom: {
            baseUrl: "https://provider.test/v1",
            apiKey: "secret",
            model: "model-a",
            reasoning: { effort: true },
          },
          messages: [{ role: "user", text: "summarize this" }],
          temperature: 0.4,
          maxOutputTokens: 512,
          reasoningEffort: "high",
        }),
      ).rejects.toMatchObject({ code: "ai_provider_failed" })
      expect(requestBody).toMatchObject({
        temperature: 0.4,
        max_output_tokens: 512,
        reasoning_effort: "high",
      })
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it("requests a visible summary and opaque continuation state only for declared Responses models", async () => {
    const originalFetch = globalThis.fetch
    let requestBody: Record<string, unknown> | undefined
    globalThis.fetch = async (_input, init) => {
      requestBody = requestJson(init)
      throw new Error("blocked provider request")
    }
    const gateway = createTanstackAiGateway()

    try {
      await expect(
        gateway.generate({
          provider: "custom",
          custom: {
            baseUrl: "https://provider.test/v1",
            apiKey: "secret",
            model: "reasoning-model",
            api: "responses",
            reasoning: { effort: true, summary: true, continuation: true },
          },
          prompt: "分析",
          reasoningEffort: "high",
        }),
      ).rejects.toMatchObject({ code: "ai_provider_failed" })
      expect(requestBody).toMatchObject({
        reasoning: { effort: "high", summary: "auto" },
        include: ["reasoning.encrypted_content"],
      })
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it("rejects provider redirects before they can bypass URL validation", async () => {
    const originalFetch = globalThis.fetch
    let redirect: RequestRedirect | undefined
    let requestBody: Record<string, unknown> | undefined
    globalThis.fetch = async (_input, init) => {
      redirect = init?.redirect
      requestBody = requestJson(init)
      throw new Error("blocked provider request")
    }
    const gateway = createTanstackAiGateway()

    try {
      await expect(
        gateway.generate({
          provider: "custom",
          prompt: "summarize",
          maxOutputTokens: 120,
          custom: { baseUrl: "https://provider.test/v1", apiKey: "secret", model: "model-a" },
        }),
      ).rejects.toMatchObject({ code: "ai_provider_failed" })
      expect(redirect).toBe("error")
      expect(requestBody).toMatchObject({ max_output_tokens: 120 })
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})
