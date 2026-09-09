import type { AiProviderApi } from "@tabora/ai-runtime"
import { createTanstackAiGateway } from "@tabora/ai-runtime/server"
import { validateCloudProviderUrl } from "../ai"
import { getRuntime } from "../runtime"

function connectionFailureMessage(error: unknown): string {
  const cause =
    error instanceof Error && error.cause instanceof Error ? error.cause.message : undefined
  const message = cause || (error instanceof Error ? error.message : "")
  if (message === "请先配置至少一个模型后再测试 Provider") return message
  if (!message || message === "AI provider request failed") return "连接测试失败"
  return `连接测试失败：${message.replace(/\s+/g, " ").slice(0, 240)}`
}

export async function listModelManagementAction() {
  const { handle } = await getRuntime()
  return handle.aiModels.list()
}

export async function createProviderAction(data: {
  id: string
  label: string
  baseUrl: string
  apiKey: string
  api: AiProviderApi
}) {
  const { handle } = await getRuntime()
  await handle.aiModels.createProvider(data)
}

export async function updateProviderAction(data: {
  id: string
  label: string
  baseUrl: string
  apiKey?: string
  api: AiProviderApi
}) {
  const { handle } = await getRuntime()
  await handle.aiModels.updateProvider(data)
}

export async function createModelAction(data: {
  providerId: string
  upstreamModelId: string
  label: string
  inputModalities: Array<"text" | "image" | "audio" | "document">
  reasoning?: { effort?: boolean; summary?: boolean; continuation?: boolean } | null
}) {
  const { handle } = await getRuntime()
  return { id: await handle.aiModels.createModel(data) }
}

export async function updateModelAction(data: {
  id: string
  label: string
  inputModalities: Array<"text" | "image" | "audio" | "document">
  reasoning?: { effort?: boolean; summary?: boolean; continuation?: boolean } | null
}) {
  const { handle } = await getRuntime()
  await handle.aiModels.updateModel(data)
}

export async function setProviderStatusAction(id: string, status: "active" | "disabled") {
  const { handle } = await getRuntime()
  await handle.aiModels.setProviderStatus(id, status)
}

export async function setModelStatusAction(id: string, status: "active" | "disabled") {
  const { handle } = await getRuntime()
  await handle.aiModels.setModelStatus(id, status)
}

export async function deleteProviderAction(id: string) {
  const { handle } = await getRuntime()
  await handle.aiModels.deleteProvider(id)
}

export async function deleteModelAction(id: string) {
  const { handle } = await getRuntime()
  await handle.aiModels.deleteModel(id)
}

async function runConnectionTest(modelId: string) {
  const { handle } = await getRuntime()
  const startedAt = Date.now()
  try {
    const { model, provider, apiKey } = await handle.aiModels.connectionForModel(modelId)
    await validateCloudProviderUrl(provider.baseUrl)
    await createTanstackAiGateway().generate({
      provider: "custom",
      custom: {
        baseUrl: provider.baseUrl,
        apiKey,
        model: model.upstreamModelId,
        api: provider.api ?? "chat-completions",
      },
      prompt: "Reply with OK",
      maxOutputTokens: 4,
    })
    await handle.aiModels.recordTest(modelId, { passed: true, latencyMs: Date.now() - startedAt })
  } catch (error) {
    const failure = connectionFailureMessage(error)
    await handle.aiModels
      .recordTest(modelId, { passed: false, error: failure })
      .catch(() => undefined)
    throw new Error(failure)
  }
}

export async function testModelAction(id: string) {
  await runConnectionTest(id)
}

export async function testProviderAction(id: string) {
  const { handle } = await getRuntime()
  const startedAt = Date.now()
  try {
    const { provider, apiKey } = await handle.aiModels.connectionForProvider(id)
    await validateCloudProviderUrl(provider.baseUrl)
    const api = provider.api ?? "chat-completions"
    const configuredModel = (await handle.aiModels.list()).models.find(
      (model) => model.providerId === id && model.status !== "deleted",
    )
    if (!configuredModel) throw new Error("请先配置至少一个模型后再测试 Provider")
    await createTanstackAiGateway().generate({
      provider: "custom",
      custom: {
        baseUrl: provider.baseUrl,
        apiKey,
        model: configuredModel.upstreamModelId,
        api,
      },
      prompt: "Reply with OK",
      maxOutputTokens: 4,
    })
    await handle.aiModels.recordProviderTest(id, {
      passed: true,
      latencyMs: Date.now() - startedAt,
    })
  } catch (error) {
    const failure = connectionFailureMessage(error)
    await handle.aiModels
      .recordProviderTest(id, { passed: false, error: failure })
      .catch(() => undefined)
    throw new Error(failure)
  }
}

function discoveredModelIds(payload: unknown): string[] {
  if (!payload || typeof payload !== "object" || !("data" in payload)) return []
  const data = (payload as { data?: unknown }).data
  if (!Array.isArray(data)) return []
  return [
    ...new Set(
      data.flatMap((item) => {
        const id = item && typeof item === "object" ? (item as { id?: unknown }).id : undefined
        return typeof id === "string" && id.trim().length > 0 && id.length <= 160 ? [id] : []
      }),
    ),
  ].sort((left, right) => left.localeCompare(right))
}

export async function discoverProviderModelsAction(id: string) {
  const { handle } = await getRuntime()
  const { provider, apiKey } = await handle.aiModels.connectionForProvider(id)
  try {
    await validateCloudProviderUrl(provider.baseUrl)
    const api = provider.api ?? "chat-completions"

    // Anthropic API doesn't provide a /models endpoint, return known models
    if (api === "anthropic-messages") {
      return {
        models: [
          "claude-3-5-sonnet-20241022",
          "claude-3-5-haiku-20241022",
          "claude-3-opus-20240229",
          "claude-3-sonnet-20240229",
          "claude-3-haiku-20240307",
        ],
      }
    }

    const response = await fetch(`${provider.baseUrl.replace(/\/$/, "")}/models`, {
      headers: { authorization: `Bearer ${apiKey}` },
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    })
    if (!response.ok) throw new Error("Provider 返回了失败状态")
    const models = discoveredModelIds(await response.json().catch(() => null)).slice(0, 200)
    if (!models.length) throw new Error("Provider 未返回可用模型")
    return { models }
  } catch (error) {
    throw new Error(
      error instanceof Error &&
        ["Provider 返回了失败状态", "Provider 未返回可用模型"].includes(error.message)
        ? error.message
        : "获取模型列表失败",
    )
  }
}
