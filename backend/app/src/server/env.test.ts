import { describe, expect, it } from "vitest"

import { loadEnv, parseAiBuiltinProviders } from "./env"

describe("built-in AI provider configuration", () => {
  it("accepts multiple complete providers", () => {
    expect(
      parseAiBuiltinProviders(
        JSON.stringify([
          {
            id: "openai",
            baseUrl: "https://api.openai.com/v1",
            apiKey: "openai-secret",
            models: ["gpt-4.1-mini"],
          },
          {
            id: "deepseek",
            baseUrl: "https://api.deepseek.com/v1",
            apiKey: "deepseek-secret",
            models: ["deepseek-chat", "deepseek-reasoner"],
          },
        ]),
      ),
    ).toEqual([
      {
        id: "openai",
        baseUrl: "https://api.openai.com/v1",
        apiKey: "openai-secret",
        models: ["gpt-4.1-mini"],
      },
      {
        id: "deepseek",
        baseUrl: "https://api.deepseek.com/v1",
        apiKey: "deepseek-secret",
        models: ["deepseek-chat", "deepseek-reasoner"],
      },
    ])
  })

  it("rejects incomplete providers and ambiguous duplicate ids", () => {
    expect(() => parseAiBuiltinProviders('[{"id":"openai","models":["gpt-4.1-mini"]}]')).toThrow(
      "TABORA_AI_BUILTIN_PROVIDERS",
    )
    expect(() =>
      parseAiBuiltinProviders(
        JSON.stringify([
          {
            id: "openai",
            baseUrl: "https://api.openai.com/v1",
            apiKey: "first-secret",
            models: ["gpt-4.1-mini"],
          },
          {
            id: "openai",
            baseUrl: "https://api.example.com/v1",
            apiKey: "second-secret",
            models: ["gpt-4.1"],
          },
        ]),
      ),
    ).toThrow("TABORA_AI_BUILTIN_PROVIDERS")
  })

  it("requires an explicit migration from the former single-provider variables", () => {
    const previous = process.env.TABORA_AI_API_KEY
    process.env.TABORA_AI_API_KEY = "legacy-secret"
    try {
      expect(() => loadEnv()).toThrow("TABORA_AI_BUILTIN_PROVIDERS")
    } finally {
      if (previous === undefined) delete process.env.TABORA_AI_API_KEY
      else process.env.TABORA_AI_API_KEY = previous
    }
  })
})
