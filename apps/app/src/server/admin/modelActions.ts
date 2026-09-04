import { validateCloudProviderUrl } from "../ai"
import { getRuntime } from "../runtime"

export async function listModelManagementAction() {
  const { handle } = await getRuntime()
  return handle.aiModels.list()
}

export async function createProviderAction(data: {
  id: string
  label: string
  baseUrl: string
  apiKey: string
  api: "chat-completions" | "responses"
}) {
  await validateCloudProviderUrl(data.baseUrl)
  const { handle } = await getRuntime()
  await handle.aiModels.createProvider(data)
}

export async function updateProviderAction(data: {
  id: string
  label: string
  baseUrl: string
  apiKey?: string
  api: "chat-completions" | "responses"
}) {
  await validateCloudProviderUrl(data.baseUrl)
  const { handle } = await getRuntime()
  await handle.aiModels.updateProvider(data)
}

export async function createModelAction(data: {
  providerId: string
  upstreamModelId: string
  label: string
  inputModalities: Array<"text" | "image" | "audio" | "document">
}) {
  const { handle } = await getRuntime()
  return { id: await handle.aiModels.createModel(data) }
}

export async function updateModelAction(data: {
  id: string
  label: string
  inputModalities: Array<"text" | "image" | "audio" | "document">
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
    const endpoint =
      (provider.api ?? "chat-completions") === "responses" ? "/responses" : "/chat/completions"
    const body =
      endpoint === "/responses"
        ? {
            model: model.upstreamModelId,
            input: "Reply with OK",
            max_output_tokens: 4,
          }
        : {
            model: model.upstreamModelId,
            messages: [{ role: "user", content: "Reply with OK" }],
            max_tokens: 4,
            temperature: 0,
          }
    const response = await fetch(`${provider.baseUrl.replace(/\/$/, "")}${endpoint}`, {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify(body),
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    })
    if (!response.ok) throw new Error("Provider 返回了失败状态")
    await handle.aiModels.recordTest(modelId, { passed: true, latencyMs: Date.now() - startedAt })
  } catch (error) {
    await handle.aiModels
      .recordTest(modelId, { passed: false, error: "连接测试失败" })
      .catch(() => undefined)
    throw new Error(
      error instanceof Error && error.message === "Provider 返回了失败状态"
        ? error.message
        : "连接测试失败",
    )
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
    const response = await fetch(`${provider.baseUrl.replace(/\/$/, "")}/models`, {
      headers: { authorization: `Bearer ${apiKey}` },
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    })
    if (!response.ok) throw new Error("Provider 返回了失败状态")
    await handle.aiModels.recordProviderTest(id, {
      passed: true,
      latencyMs: Date.now() - startedAt,
    })
  } catch (error) {
    await handle.aiModels
      .recordProviderTest(id, { passed: false, error: "连接测试失败" })
      .catch(() => undefined)
    throw new Error(
      error instanceof Error && error.message === "Provider 返回了失败状态"
        ? error.message
        : "连接测试失败",
    )
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
