import { describe, expect, it } from "vitest"

import { AiRuntimeError, createTanstackAiGateway, parseAiGatewayRequest } from "./server"

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
          custom: { baseUrl: "https://provider.test/v1", apiKey: "secret", model: "model-a" },
          system: "Be concise.",
        },
      }),
    ).toEqual({
      provider: "custom",
      custom: { baseUrl: "https://provider.test/v1", apiKey: "secret", model: "model-a" },
      system: "Be concise.",
      messages: [
        { role: "user", text: "hi" },
        { role: "assistant", text: "hello" },
        { role: "user", text: "summarize this" },
      ],
    })
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
