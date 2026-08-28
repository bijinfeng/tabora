import { describe, expect, it, vi } from "vitest"

import { createLocalAiSettingsService } from "./aiSettingsService"
import { createFnosAiSettingsService } from "./fnosAiSettingsService"

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial))
  return {
    async getItem(key: string) {
      return values.get(key) ?? null
    },
    async setItem(key: string, value: string) {
      values.set(key, value)
    },
    async removeItem(key: string) {
      values.delete(key)
    },
  }
}

describe("createLocalAiSettingsService", () => {
  it("keeps a custom API key local while exposing only its configured state", async () => {
    const storage = memoryStorage()
    const service = createLocalAiSettingsService({
      storage,
      defaultBuiltinModelId: "gpt-4.1-mini",
    })

    await service.saveSettings({
      activeProvider: "custom",
      builtinModelId: "gpt-4.1-mini",
      custom: { baseUrl: "https://provider.example/v1", model: "custom-model", apiKey: "secret" },
    })

    await expect(service.getSettings()).resolves.toMatchObject({
      activeProvider: "custom",
      custom: {
        baseUrl: "https://provider.example/v1",
        model: "custom-model",
        apiKeyConfigured: true,
      },
    })
    await expect(service.getRequest()).resolves.toEqual({
      provider: "custom",
      custom: { baseUrl: "https://provider.example/v1", model: "custom-model", apiKey: "secret" },
    })
  })

  it("shows built-in models only after the host supplies an authenticated session", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response(JSON.stringify({ models: [{ id: "gpt-4.1-mini", label: "GPT-4.1 Mini" }] })),
      )
    const service = createLocalAiSettingsService({
      storage: memoryStorage(),
      defaultBuiltinModelId: "gpt-4.1-mini",
      apiBaseUrl: "https://tabora.example",
      authClient: { getSession: async () => ({ jwt: "session-token" }) },
      fetcher,
    })

    await expect(service.getSettings()).resolves.toMatchObject({
      builtin: {
        status: "available",
        models: [{ id: "gpt-4.1-mini", label: "GPT-4.1 Mini" }],
      },
    })
    expect(fetcher).toHaveBeenCalledWith("https://tabora.example/api/ai/models", {
      headers: { authorization: "Bearer session-token" },
    })
  })
})

describe("createFnosAiSettingsService", () => {
  it("projects a device-shared provider without exposing the key or built-in mode", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            configured: true,
            baseUrl: "http://192.168.1.10:11434/v1",
            model: "llama",
            hasApiKey: true,
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            configured: true,
            baseUrl: "http://127.0.0.1:11434/v1",
            model: "local-model",
            hasApiKey: true,
          }),
        ),
      )
    const service = createFnosAiSettingsService({ baseUrl: "http://fnos.local", fetcher })

    await expect(service.getSettings()).resolves.toEqual({
      supportedProviders: ["custom"],
      activeProvider: "custom",
      builtin: { status: "unavailable", models: [], modelId: "" },
      custom: {
        baseUrl: "http://192.168.1.10:11434/v1",
        model: "llama",
        apiKeyConfigured: true,
        preservesApiKeyOnSave: false,
      },
    })
    await service.saveSettings({
      activeProvider: "custom",
      builtinModelId: "",
      custom: { baseUrl: "http://127.0.0.1:11434/v1", model: "local-model", apiKey: "new-secret" },
    })
    expect(fetcher).toHaveBeenLastCalledWith("http://fnos.local/api/ai/config", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        baseUrl: "http://127.0.0.1:11434/v1",
        model: "local-model",
        apiKey: "new-secret",
      }),
    })
  })
})
