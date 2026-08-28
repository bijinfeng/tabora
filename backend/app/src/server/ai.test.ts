import { describe, expect, it, vi } from "vitest"
import type { AiTextGateway } from "@tabora/ai-runtime/server"
import type { AppEnv } from "./env"
import { cloudAiGenerateResponse, cloudAiModelsResponse, cloudAiStreamResponse } from "./ai"

const env: AppEnv = {
  host: "127.0.0.1",
  port: 4000,
  corsOrigins: [],
  databaseClient: "sqlite",
  databaseFile: ":memory:",
  databaseUrl: "",
  authSecret: "test-secret",
  baseUrl: "http://127.0.0.1:4000",
  uploadsDir: "/tmp/tabora-ai-test",
  aiBuiltinApiKey: "platform-secret",
  aiBuiltinBaseUrl: "https://api.openai.com/v1",
  aiBuiltinModels: ["platform-model"],
}

function runtime(sessionUserId: string | null) {
  const getSession = vi
    .fn()
    .mockResolvedValue(sessionUserId ? { user: { id: sessionUserId } } : null)
  return {
    runtime: { env, auth: { api: { getSession } } } as unknown as Parameters<
      typeof cloudAiGenerateResponse
    >[0],
    getSession,
  }
}

function request(body: unknown): Request {
  return new Request("http://tabora.test/api/ai/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("cloud AI HTTP contract", () => {
  it("rejects a built-in model request without a Tabora session", async () => {
    const { runtime: testRuntime } = runtime(null)
    const gateway = {
      generate: vi.fn(),
      stream: async function* () {},
      streamEvents: async function* () {},
    }

    const response = await cloudAiGenerateResponse(
      testRuntime,
      request({ provider: "builtin", modelId: "platform-model", prompt: "summarize" }),
      gateway as unknown as AiTextGateway,
    )

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toMatchObject({ error: { code: "ai_auth_required" } })
    expect(gateway.generate).not.toHaveBeenCalled()
  })

  it("rejects a built-in model outside the platform allowlist after authentication", async () => {
    const { runtime: testRuntime } = runtime("user-1")

    const response = await cloudAiGenerateResponse(
      testRuntime,
      request({ provider: "builtin", modelId: "not-registered", prompt: "summarize" }),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "ai_model_unavailable" },
    })
  })

  it("allows a custom provider without a Tabora session and never echoes its API key", async () => {
    const { runtime: testRuntime, getSession } = runtime(null)
    const gateway = {
      generate: vi.fn().mockResolvedValue({ text: "summary" }),
      stream: async function* () {},
      streamEvents: async function* () {},
    }

    const response = await cloudAiGenerateResponse(
      testRuntime,
      request({
        provider: "custom",
        prompt: "summarize",
        custom: {
          baseUrl: "https://198.51.100.20/v1",
          apiKey: "user-secret",
          model: "custom-model",
        },
      }),
      gateway,
    )

    expect(response.status).toBe(200)
    expect(await response.text()).toBe('{"text":"summary"}')
    expect(getSession).not.toHaveBeenCalled()
    expect(gateway.generate).toHaveBeenCalledWith(
      expect.objectContaining({ custom: expect.objectContaining({ apiKey: "user-secret" }) }),
    )
  })

  it("redacts provider failures before returning them to the browser", async () => {
    const { runtime: testRuntime } = runtime(null)
    const gateway = {
      generate: vi.fn().mockRejectedValue(new Error("upstream leaked api-key=provider-secret")),
      stream: async function* () {},
      streamEvents: async function* () {},
    }

    const response = await cloudAiGenerateResponse(
      testRuntime,
      request({
        provider: "custom",
        prompt: "summarize",
        custom: {
          baseUrl: "https://198.51.100.20/v1",
          apiKey: "provider-secret",
          model: "custom-model",
        },
      }),
      gateway as unknown as AiTextGateway,
    )

    expect(response.status).toBe(400)
    const body = await response.text()
    expect(body).toContain('"code":"ai_provider_failed"')
    expect(body).not.toContain("provider-secret")
  })

  it("rejects a loopback custom provider before it can become an SSRF target", async () => {
    const { runtime: testRuntime, getSession } = runtime(null)

    const response = await cloudAiGenerateResponse(
      testRuntime,
      request({
        provider: "custom",
        prompt: "summarize",
        custom: { baseUrl: "https://127.0.0.1/v1", apiKey: "user-secret", model: "custom-model" },
      }),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({ error: { code: "ai_request_rejected" } })
    expect(getSession).not.toHaveBeenCalled()
  })

  it("prevents a public custom provider from following a redirect to a private target", async () => {
    const { runtime: testRuntime } = runtime(null)
    const providerFetch = vi
      .fn()
      .mockResolvedValue(
        new Response(null, { status: 302, headers: { location: "http://127.0.0.1/internal" } }),
      )
    vi.stubGlobal("fetch", providerFetch)
    try {
      const response = await cloudAiGenerateResponse(
        testRuntime,
        request({
          provider: "custom",
          prompt: "summarize",
          custom: {
            baseUrl: "https://198.51.100.20/v1",
            apiKey: "user-secret",
            model: "custom-model",
          },
        }),
      )

      expect(providerFetch).toHaveBeenCalled()
      expect(providerFetch.mock.calls[0]?.[1]).toMatchObject({ redirect: "error" })
      expect(response.status).toBe(400)
      await expect(response.json()).resolves.toMatchObject({
        error: { code: "ai_provider_failed" },
      })
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it("keeps the built-in model directory behind the same login boundary", async () => {
    const { runtime: anonymous } = runtime(null)
    const { runtime: signedIn } = runtime("user-1")
    const request = new Request("http://tabora.test/api/ai/models")

    expect((await cloudAiModelsResponse(anonymous, request)).status).toBe(401)
    const response = await cloudAiModelsResponse(
      signedIn,
      new Request("http://tabora.test/api/ai/models"),
    )
    expect(await response.json()).toEqual({
      models: [{ id: "platform-model", label: "platform-model" }],
    })
  })

  it("uses the standardized SSE transport after authenticating built-in streams", async () => {
    const { runtime: testRuntime } = runtime("user-1")
    const gateway = {
      generate: vi.fn(),
      stream: async function* () {},
      streamEvents: async function* () {
        yield { type: "TEXT_MESSAGE_CONTENT", delta: "summary" }
      },
    }

    const response = await cloudAiStreamResponse(
      testRuntime,
      request({ provider: "builtin", modelId: "platform-model", prompt: "summarize" }),
      gateway as unknown as AiTextGateway,
    )

    expect(response.headers.get("content-type")).toContain("text/event-stream")
    await expect(response.text()).resolves.toContain("TEXT_MESSAGE_CONTENT")
  })
})
