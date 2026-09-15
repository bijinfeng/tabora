import { afterEach, describe, expect, it, vi } from "vitest"

const {
  connectionForModel,
  connectionForProvider,
  createProvider,
  list,
  recordProviderTest,
  recordTest,
  updateProvider,
  validateCloudProviderUrl,
} = vi.hoisted(() => ({
  connectionForModel: vi.fn(),
  connectionForProvider: vi.fn(),
  createProvider: vi.fn(),
  list: vi.fn(),
  recordProviderTest: vi.fn(),
  recordTest: vi.fn(),
  updateProvider: vi.fn(),
  validateCloudProviderUrl: vi.fn(),
}))

vi.mock("../ai", () => ({ validateCloudProviderUrl }))
vi.mock("../runtime", () => ({
  getRuntime: vi.fn(async () => ({
    handle: {
      aiModels: {
        connectionForModel,
        connectionForProvider,
        createProvider,
        list,
        recordProviderTest,
        recordTest,
        updateProvider,
      },
    },
  })),
}))

import { testModelAction, testModelDraftAction, testProviderAction } from "./modelActions"

afterEach(() => {
  vi.restoreAllMocks()
  connectionForModel.mockReset()
  connectionForProvider.mockReset()
  createProvider.mockReset()
  list.mockReset()
  recordProviderTest.mockReset()
  recordTest.mockReset()
  updateProvider.mockReset()
  validateCloudProviderUrl.mockReset()
})

describe("Provider configuration saves", () => {
  it("stores new and edited provider settings without resolving or testing the connection", async () => {
    const data = {
      id: "provider",
      label: "Provider",
      baseUrl: "https://provider.example/v1",
      apiKey: "provider-secret",
      api: "chat-completions" as const,
    }

    const { createProviderAction, updateProviderAction } = await import("./modelActions")
    await createProviderAction(data)
    await updateProviderAction(data)

    expect(createProvider).toHaveBeenCalledWith(data)
    expect(updateProvider).toHaveBeenCalledWith(data)
    expect(validateCloudProviderUrl).not.toHaveBeenCalled()
  })
})

describe("Anthropic provider connection checks", () => {
  it("tests a new model without creating a database record", async () => {
    connectionForProvider.mockResolvedValue({
      provider: { api: "anthropic-messages", baseUrl: "https://api.anthropic.com/v1" },
      apiKey: "anthropic-secret",
    })
    const providerFetch = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "msg_test",
          type: "message",
          role: "assistant",
          model: "claude-test",
          content: [{ type: "text", text: "OK" }],
          stop_reason: "end_turn",
          usage: { input_tokens: 1, output_tokens: 1 },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    )
    vi.stubGlobal("fetch", providerFetch)

    await expect(
      testModelDraftAction({ providerId: "anthropic", upstreamModelId: "claude-test" }),
    ).resolves.toBeUndefined()
    expect(createProvider).not.toHaveBeenCalled()
  })

  it("validates a provider through TanStack AI with Anthropic authentication", async () => {
    connectionForProvider.mockResolvedValue({
      provider: { api: "anthropic-messages", baseUrl: "https://api.anthropic.com/v1" },
      apiKey: "anthropic-secret",
    })
    list.mockResolvedValue({
      providers: [],
      models: [{ providerId: "anthropic", upstreamModelId: "claude-test", status: "draft" }],
    })
    const providerFetch = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "msg_test",
          type: "message",
          role: "assistant",
          model: "claude-test",
          content: [{ type: "text", text: "OK" }],
          stop_reason: "end_turn",
          usage: { input_tokens: 1, output_tokens: 1 },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    )
    vi.stubGlobal("fetch", providerFetch)

    await testProviderAction("anthropic")

    const [input, init] = providerFetch.mock.calls[0] as [RequestInfo, RequestInit]
    expect(
      typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
    ).toBe("https://api.anthropic.com/v1/messages?beta=true")
    const request = input instanceof Request ? input : new Request(input, init)
    expect(request.method).toBe("POST")
    expect(request.headers.get("x-api-key")).toBe("anthropic-secret")
    expect(request.headers.get("anthropic-version")).toBe("2023-06-01")
    expect(recordProviderTest).toHaveBeenCalledWith(
      "anthropic",
      expect.objectContaining({ passed: true }),
    )
  })

  it("tests a configured Anthropic model at the messages endpoint without duplicating /v1", async () => {
    connectionForModel.mockResolvedValue({
      model: { upstreamModelId: "claude-test" },
      provider: { api: "anthropic-messages", baseUrl: "https://api.anthropic.com/v1" },
      apiKey: "anthropic-secret",
    })
    const providerFetch = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "msg_test",
          type: "message",
          role: "assistant",
          model: "claude-test",
          content: [{ type: "text", text: "OK" }],
          stop_reason: "end_turn",
          usage: { input_tokens: 1, output_tokens: 1 },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    )
    vi.stubGlobal("fetch", providerFetch)

    await testModelAction("anthropic:claude-test")

    const [input, init] = providerFetch.mock.calls[0] as [RequestInfo, RequestInit]
    expect(
      typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
    ).toBe("https://api.anthropic.com/v1/messages?beta=true")
    const request = input instanceof Request ? input : new Request(input, init)
    expect(request.headers.get("authorization")).toBe("Bearer anthropic-secret")
    expect(request.headers.get("x-api-key")).toBe("anthropic-secret")
    expect(request.headers.get("anthropic-version")).toBe("2023-06-01")
    expect(recordTest).toHaveBeenCalledWith(
      "anthropic:claude-test",
      expect.objectContaining({ passed: true }),
    )
  })

  it("adds /v1 for an Anthropic-compatible provider whose Base URL is an API root", async () => {
    connectionForProvider.mockResolvedValue({
      provider: { api: "anthropic-messages", baseUrl: "https://provider.example/api/chat" },
      apiKey: "provider-secret",
    })
    list.mockResolvedValue({
      providers: [],
      models: [{ providerId: "provider", upstreamModelId: "claude-test", status: "draft" }],
    })
    const providerFetch = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "msg_test",
          type: "message",
          role: "assistant",
          model: "claude-test",
          content: [{ type: "text", text: "OK" }],
          stop_reason: "end_turn",
          usage: { input_tokens: 1, output_tokens: 1 },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    )
    vi.stubGlobal("fetch", providerFetch)

    await testProviderAction("provider")

    const [input, init] = providerFetch.mock.calls[0] as [RequestInfo, RequestInit]
    expect(
      typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
    ).toBe("https://provider.example/api/chat/v1/messages?beta=true")
    const request = input instanceof Request ? input : new Request(input, init)
    expect(request.headers.get("x-api-key")).toBe("provider-secret")
    expect(request.headers.get("anthropic-version")).toBe("2023-06-01")
  })

  it("requires a configured model before running a provider chat test", async () => {
    connectionForProvider.mockResolvedValue({
      provider: { api: "anthropic-messages", baseUrl: "https://api.anthropic.com/v1" },
      apiKey: "anthropic-secret",
    })
    list.mockResolvedValue({ providers: [], models: [] })
    recordProviderTest.mockResolvedValue(undefined)

    await expect(testProviderAction("anthropic")).rejects.toThrow(
      "请先配置至少一个模型后再测试 Provider",
    )
    expect(recordProviderTest).toHaveBeenCalledWith(
      "anthropic",
      expect.objectContaining({ passed: false }),
    )
  })
})
