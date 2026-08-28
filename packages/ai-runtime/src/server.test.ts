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
