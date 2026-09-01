import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { createSqliteDb } from "./sqlite"

const encryptionKey = "test-model-credential-encryption-key"
let handle: ReturnType<typeof createSqliteDb>

beforeEach(() => {
  handle = createSqliteDb(":memory:", encryptionKey)
  handle.migrate()
})

afterEach(() => handle.close())

describe("platform model catalogue", () => {
  it("never exposes a saved provider credential through the management list", async () => {
    await handle.aiModels.createProvider({
      id: "openai",
      label: "OpenAI",
      baseUrl: "https://api.openai.com/v1",
      apiKey: "provider-secret",
    })

    const { providers } = await handle.aiModels.list()

    expect(providers).toMatchObject([{ id: "openai", credentialConfigured: true }])
    expect(JSON.stringify(providers)).not.toContain("provider-secret")
  })

  it("records a provider connection test before any model has been configured", async () => {
    await handle.aiModels.createProvider({
      id: "openai",
      label: "OpenAI",
      baseUrl: "https://api.openai.com/v1",
      apiKey: "provider-secret",
    })

    await handle.aiModels.recordProviderTest("openai", { passed: true, latencyMs: 42 })

    expect((await handle.aiModels.list()).providers).toMatchObject([
      { id: "openai", lastTestStatus: "passed" },
    ])
  })

  it("publishes only a tested model behind an enabled provider and removes it after deletion", async () => {
    await handle.aiModels.createProvider({
      id: "openai",
      label: "OpenAI",
      baseUrl: "https://api.openai.com/v1",
      apiKey: "provider-secret",
    })
    const modelId = await handle.aiModels.createModel({
      providerId: "openai",
      upstreamModelId: "gpt-4.1-mini",
      label: "GPT-4.1 mini",
    })

    await expect(handle.aiModels.setProviderStatus("openai", "active")).rejects.toThrow("测试")
    await handle.aiModels.recordTest(modelId, { passed: true, latencyMs: 42 })
    await handle.aiModels.setProviderStatus("openai", "active")
    await handle.aiModels.setModelStatus(modelId, "active")
    expect(await handle.aiModels.listActiveDirectory()).toEqual([
      { id: "openai:gpt-4.1-mini", label: "GPT-4.1 mini" },
    ])

    await handle.aiModels.deleteProvider("openai")

    expect(await handle.aiModels.listActiveDirectory()).toEqual([])
    await expect(
      handle.aiModels.createProvider({
        id: "openai",
        label: "Replacement",
        baseUrl: "https://api.openai.com/v1",
        apiKey: "replacement-secret",
      }),
    ).rejects.toThrow("不可复用")
  })

  it("allows changing only the user-visible label of an existing model", async () => {
    await handle.aiModels.createProvider({
      id: "openai",
      label: "OpenAI",
      baseUrl: "https://api.openai.com/v1",
      apiKey: "provider-secret",
    })
    const id = await handle.aiModels.createModel({
      providerId: "openai",
      upstreamModelId: "gpt-4.1-mini",
      label: "GPT-4.1 mini",
    })

    await handle.aiModels.updateModel({ id, label: "GPT-4.1 Mini" })

    expect((await handle.aiModels.list()).models).toMatchObject([
      { id: "openai:gpt-4.1-mini", label: "GPT-4.1 Mini" },
    ])
  })
})
