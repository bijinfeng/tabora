import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto"

import { and, asc, eq, ne } from "drizzle-orm"
import type { AiInputModality, AiProviderApi, AiReasoningCapabilities } from "@tabora/ai-runtime"

export const AI_RESOURCE_STATUSES = ["draft", "active", "disabled", "deleted"] as const
export type AiResourceStatus = (typeof AI_RESOURCE_STATUSES)[number]

export const AI_TEST_STATUSES = ["idle", "passed", "failed"] as const
export type AiTestStatus = (typeof AI_TEST_STATUSES)[number]

export const AI_PROVIDER_APIS = ["chat-completions", "responses"] as const
export const AI_INPUT_MODALITIES = ["text", "image", "audio", "document"] as const

const CHAT_COMPLETIONS_MODALITIES: AiInputModality[] = ["text", "image"]
const RESPONSES_MODALITIES: AiInputModality[] = ["text", "image", "audio", "document"]

type ProviderRecord = {
  id: string
  label: string
  baseUrl: string
  api: AiProviderApi | null
  credentialCiphertext: string | null
  credentialNonce: string | null
  credentialKeyVersion: number | null
  credentialConfigured: boolean
  status: AiResourceStatus
  lastTestStatus: AiTestStatus | null
  lastTestAt: Date | null
  lastTestLatencyMs: number | null
  lastTestError: string | null
  createdAt: Date
  updatedAt: Date
}

type ModelRecord = {
  id: string
  providerId: string
  upstreamModelId: string
  label: string
  inputModalities: AiInputModality[] | null
  reasoning: AiReasoningCapabilities | null
  status: AiResourceStatus
  lastTestStatus: AiTestStatus | null
  lastTestAt: Date | null
  lastTestLatencyMs: number | null
  lastTestError: string | null
  createdAt: Date
  updatedAt: Date
}

export type AdminAiProvider = Omit<
  ProviderRecord,
  "credentialCiphertext" | "credentialNonce" | "credentialKeyVersion" | "lastTestError"
> & { modelCount: number }

export type AdminAiModel = Omit<ModelRecord, "lastTestError"> & { providerLabel: string }

export type GatewayAiModel = {
  id: string
  label: string
  model: string
  apiKey: string
  baseUrl: string
  api?: AiProviderApi
  inputModalities?: AiInputModality[]
  reasoning?: AiReasoningCapabilities
}

export type CreateProviderInput = {
  id: string
  label: string
  baseUrl: string
  apiKey: string
  api?: AiProviderApi
}

export type UpdateProviderInput = {
  id: string
  label: string
  baseUrl: string
  apiKey?: string
  api?: AiProviderApi
}

export type CreateModelInput = {
  providerId: string
  upstreamModelId: string
  label: string
  inputModalities?: AiInputModality[]
  reasoning?: AiReasoningCapabilities | null
}

export type UpdateModelInput = {
  id: string
  label: string
  inputModalities?: AiInputModality[]
  reasoning?: AiReasoningCapabilities | null
}

const CREDENTIAL_KEY_VERSION = 1

function providerApi(provider: Pick<ProviderRecord, "api">): AiProviderApi {
  return provider.api ?? "chat-completions"
}

function adapterModalities(api: AiProviderApi): AiInputModality[] {
  return api === "responses" ? RESPONSES_MODALITIES : CHAT_COMPLETIONS_MODALITIES
}

/** Legacy rows preserve the historical Chat Completions text/image contract. */
function modelModalities(model: Pick<ModelRecord, "inputModalities">): AiInputModality[] {
  return model.inputModalities ?? CHAT_COMPLETIONS_MODALITIES
}

function validateModelModalities(
  api: AiProviderApi,
  modalities: AiInputModality[],
): AiInputModality[] {
  const allowed = new Set(adapterModalities(api))
  const unique = [...new Set(modalities)]
  if (
    !unique.length ||
    !unique.includes("text") ||
    unique.some((modality) => !allowed.has(modality))
  ) {
    throw new Error("模型输入能力与 Provider API 不兼容")
  }
  return unique
}

function reasoningCapabilities(
  value: AiReasoningCapabilities | null | undefined,
): AiReasoningCapabilities | undefined {
  if (!value || typeof value !== "object") return undefined
  return value.effort || value.summary || value.continuation
    ? {
        ...(value.effort ? { effort: true } : {}),
        ...(value.summary ? { summary: true } : {}),
        ...(value.continuation ? { continuation: true } : {}),
      }
    : undefined
}

function credentialKey(value: string): Buffer {
  if (value.length < 32) throw new Error("模型凭据加密密钥无效")
  return createHash("sha256").update(value).digest()
}

function encryptCredential(apiKey: string, encryptionKey: string) {
  const nonce = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", credentialKey(encryptionKey), nonce)
  const ciphertext = Buffer.concat([cipher.update(apiKey, "utf8"), cipher.final()])
  return {
    credentialCiphertext: Buffer.concat([ciphertext, cipher.getAuthTag()]).toString("base64"),
    credentialNonce: nonce.toString("base64"),
    credentialKeyVersion: CREDENTIAL_KEY_VERSION,
  }
}

function decryptCredential(provider: ProviderRecord, encryptionKey: string): string | null {
  if (
    !provider.credentialConfigured ||
    !provider.credentialCiphertext ||
    !provider.credentialNonce ||
    provider.credentialKeyVersion !== CREDENTIAL_KEY_VERSION
  ) {
    return null
  }
  try {
    const input = Buffer.from(provider.credentialCiphertext, "base64")
    const ciphertext = input.subarray(0, -16)
    const authTag = input.subarray(-16)
    const decipher = createDecipheriv(
      "aes-256-gcm",
      credentialKey(encryptionKey),
      Buffer.from(provider.credentialNonce, "base64"),
    )
    decipher.setAuthTag(authTag)
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8")
  } catch {
    return null
  }
}

function publicProvider(provider: ProviderRecord, modelCount: number): AdminAiProvider {
  const {
    credentialCiphertext: _credentialCiphertext,
    credentialNonce: _credentialNonce,
    credentialKeyVersion: _credentialKeyVersion,
    lastTestError: _lastTestError,
    ...result
  } = provider
  return { ...result, modelCount }
}

function publicModel(model: ModelRecord, providerLabel: string): AdminAiModel {
  const { lastTestError: _lastTestError, ...result } = model
  return { ...result, providerLabel }
}

/** Query boundary for platform-paid provider connections and published model catalogues. */
export function createAiModelQueries(
  db: any,
  schema: { aiProvider: any; aiModel: any },
  encryptionKey: string = process.env.TABORA_MODEL_CREDENTIAL_ENCRYPTION_KEY ?? "",
) {
  const { aiProvider, aiModel } = schema

  async function providerById(id: string): Promise<ProviderRecord | null> {
    const rows = (await db
      .select()
      .from(aiProvider)
      .where(eq(aiProvider.id, id))
      .limit(1)) as ProviderRecord[]
    return rows[0] ?? null
  }

  async function modelById(id: string): Promise<ModelRecord | null> {
    const rows = (await db
      .select()
      .from(aiModel)
      .where(eq(aiModel.id, id))
      .limit(1)) as ModelRecord[]
    return rows[0] ?? null
  }

  async function list() {
    const [providers, models] = await Promise.all([
      db
        .select()
        .from(aiProvider)
        .where(ne(aiProvider.status, "deleted"))
        .orderBy(asc(aiProvider.label)),
      db.select().from(aiModel).where(ne(aiModel.status, "deleted")).orderBy(asc(aiModel.label)),
    ])
    const modelRows = models as ModelRecord[]
    const providerMap = new Map(
      (providers as ProviderRecord[]).map((provider) => [provider.id, provider]),
    )
    return {
      providers: (providers as ProviderRecord[]).map((provider) =>
        publicProvider(
          provider,
          modelRows.filter((model) => model.providerId === provider.id).length,
        ),
      ),
      models: modelRows.map((model) =>
        publicModel(model, providerMap.get(model.providerId)?.label ?? "已删除 Provider"),
      ),
    }
  }

  async function createProvider(input: CreateProviderInput): Promise<void> {
    if (await providerById(input.id)) throw new Error("该 Provider ID 已存在且不可复用")
    const now = new Date()
    const encrypted = encryptCredential(input.apiKey, encryptionKey)
    await db.insert(aiProvider).values({
      id: input.id,
      label: input.label,
      baseUrl: input.baseUrl,
      api: input.api ?? "chat-completions",
      ...encrypted,
      credentialConfigured: true,
      status: "draft",
      lastTestStatus: "idle",
      createdAt: now,
      updatedAt: now,
    })
  }

  async function updateProvider(input: UpdateProviderInput): Promise<void> {
    const existing = await providerById(input.id)
    if (!existing || existing.status === "deleted") throw new Error("Provider 不存在")
    const api = input.api ?? providerApi(existing)
    const connectionChanged =
      existing.baseUrl !== input.baseUrl || providerApi(existing) !== api || Boolean(input.apiKey)
    await db
      .update(aiProvider)
      .set({
        label: input.label,
        baseUrl: input.baseUrl,
        api,
        ...(input.apiKey
          ? { ...encryptCredential(input.apiKey, encryptionKey), credentialConfigured: true }
          : {}),
        ...(connectionChanged
          ? {
              status: "draft",
              lastTestStatus: "idle",
              lastTestAt: null,
              lastTestLatencyMs: null,
              lastTestError: null,
            }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(aiProvider.id, input.id))
    if (connectionChanged) {
      await db
        .update(aiModel)
        .set({ status: "disabled", updatedAt: new Date() })
        .where(and(eq(aiModel.providerId, input.id), ne(aiModel.status, "deleted")))
    }
  }

  async function createModel(input: CreateModelInput): Promise<string> {
    const provider = await providerById(input.providerId)
    if (!provider || provider.status === "deleted") throw new Error("Provider 不存在")
    const inputModalities = validateModelModalities(
      providerApi(provider),
      input.inputModalities ?? CHAT_COMPLETIONS_MODALITIES,
    )
    const reasoning = reasoningCapabilities(input.reasoning)
    const id = `${input.providerId}:${input.upstreamModelId}`
    if (await modelById(id)) throw new Error("该稳定模型 ID 已存在且不可复用")
    const duplicate = (await db
      .select({ id: aiModel.id })
      .from(aiModel)
      .where(
        and(
          eq(aiModel.providerId, input.providerId),
          eq(aiModel.upstreamModelId, input.upstreamModelId),
        ),
      )
      .limit(1)) as Array<{ id: string }>
    if (duplicate[0]) throw new Error("该 Provider 已配置同名上游模型")
    const now = new Date()
    await db.insert(aiModel).values({
      id,
      providerId: input.providerId,
      upstreamModelId: input.upstreamModelId,
      label: input.label,
      inputModalities,
      reasoning: reasoning ?? null,
      status: "draft",
      lastTestStatus: "idle",
      createdAt: now,
      updatedAt: now,
    })
    return id
  }

  async function updateModel(input: UpdateModelInput): Promise<void> {
    const model = await modelById(input.id)
    if (!model || model.status === "deleted") throw new Error("模型不存在")
    const provider = await providerById(model.providerId)
    if (!provider || provider.status === "deleted") throw new Error("Provider 不存在")
    const inputModalities = input.inputModalities
      ? validateModelModalities(providerApi(provider), input.inputModalities)
      : modelModalities(model)
    const reasoning =
      "reasoning" in input
        ? reasoningCapabilities(input.reasoning)
        : reasoningCapabilities(model.reasoning)
    const capabilitiesChanged =
      JSON.stringify(inputModalities) !== JSON.stringify(modelModalities(model)) ||
      JSON.stringify(reasoning) !== JSON.stringify(reasoningCapabilities(model.reasoning))
    await db
      .update(aiModel)
      .set({
        label: input.label,
        inputModalities,
        reasoning: reasoning ?? null,
        ...(capabilitiesChanged
          ? {
              status: "disabled",
              lastTestStatus: "idle",
              lastTestAt: null,
              lastTestLatencyMs: null,
              lastTestError: null,
            }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(aiModel.id, input.id))
  }

  async function setProviderStatus(id: string, status: "active" | "disabled"): Promise<void> {
    const provider = await providerById(id)
    if (!provider || provider.status === "deleted") throw new Error("Provider 不存在")
    if (
      status === "active" &&
      (!provider.credentialConfigured || provider.lastTestStatus !== "passed")
    ) {
      throw new Error("Provider 必须配置凭据并通过最近一次连接测试后才能启用")
    }
    await db.update(aiProvider).set({ status, updatedAt: new Date() }).where(eq(aiProvider.id, id))
    if (status === "disabled") {
      await db
        .update(aiModel)
        .set({ status: "disabled", updatedAt: new Date() })
        .where(and(eq(aiModel.providerId, id), ne(aiModel.status, "deleted")))
    }
  }

  async function setModelStatus(id: string, status: "active" | "disabled"): Promise<void> {
    const model = await modelById(id)
    if (!model || model.status === "deleted") throw new Error("模型不存在")
    const provider = await providerById(model.providerId)
    if (!provider || provider.status === "deleted") throw new Error("Provider 不存在")
    if (status === "active") {
      if (provider.status !== "active" || provider.lastTestStatus !== "passed") {
        throw new Error("Provider 连接尚未启用或未通过测试")
      }
      if (model.lastTestStatus !== "passed") throw new Error("模型必须通过最近一次测试后才能上线")
    }
    await db.update(aiModel).set({ status, updatedAt: new Date() }).where(eq(aiModel.id, id))
  }

  async function deleteProvider(id: string): Promise<void> {
    const provider = await providerById(id)
    if (!provider || provider.status === "deleted") throw new Error("Provider 不存在")
    const now = new Date()
    await db
      .update(aiProvider)
      .set({
        status: "deleted",
        credentialCiphertext: null,
        credentialNonce: null,
        credentialKeyVersion: null,
        credentialConfigured: false,
        updatedAt: now,
      })
      .where(eq(aiProvider.id, id))
    await db
      .update(aiModel)
      .set({ status: "deleted", updatedAt: now })
      .where(and(eq(aiModel.providerId, id), ne(aiModel.status, "deleted")))
  }

  async function deleteModel(id: string): Promise<void> {
    const model = await modelById(id)
    if (!model || model.status === "deleted") throw new Error("模型不存在")
    await db
      .update(aiModel)
      .set({ status: "deleted", updatedAt: new Date() })
      .where(eq(aiModel.id, id))
  }

  async function connectionForModel(id: string) {
    const model = await modelById(id)
    if (!model || model.status === "deleted") throw new Error("模型不存在")
    const provider = await providerById(model.providerId)
    if (!provider || provider.status === "deleted") throw new Error("Provider 不存在")
    const apiKey = decryptCredential(provider, encryptionKey)
    if (!apiKey) throw new Error("Provider 凭据不可用")
    return { model, provider, apiKey }
  }

  async function connectionForProvider(id: string) {
    const provider = await providerById(id)
    if (!provider || provider.status === "deleted") throw new Error("Provider 不存在")
    const apiKey = decryptCredential(provider, encryptionKey)
    if (!apiKey) throw new Error("Provider 凭据不可用")
    return { provider, apiKey }
  }

  async function recordTest(
    id: string,
    result: { passed: boolean; latencyMs?: number; error?: string },
  ) {
    const model = await modelById(id)
    if (!model || model.status === "deleted") throw new Error("模型不存在")
    const provider = await providerById(model.providerId)
    if (!provider || provider.status === "deleted") throw new Error("Provider 不存在")
    const now = new Date()
    const testStatus: AiTestStatus = result.passed ? "passed" : "failed"
    const update = {
      lastTestStatus: testStatus,
      lastTestAt: now,
      lastTestLatencyMs: result.latencyMs ?? null,
      lastTestError: result.error ?? null,
      updatedAt: now,
    }
    await db.update(aiModel).set(update).where(eq(aiModel.id, id))
    await db.update(aiProvider).set(update).where(eq(aiProvider.id, provider.id))
  }

  async function recordProviderTest(
    id: string,
    result: { passed: boolean; latencyMs?: number; error?: string },
  ) {
    const provider = await providerById(id)
    if (!provider || provider.status === "deleted") throw new Error("Provider 不存在")
    const now = new Date()
    await db
      .update(aiProvider)
      .set({
        lastTestStatus: result.passed ? "passed" : "failed",
        lastTestAt: now,
        lastTestLatencyMs: result.latencyMs ?? null,
        lastTestError: result.error ?? null,
        updatedAt: now,
      })
      .where(eq(aiProvider.id, id))
  }

  async function listActiveGatewayModels(): Promise<GatewayAiModel[]> {
    const [providers, models] = await Promise.all([
      db.select().from(aiProvider).where(eq(aiProvider.status, "active")),
      db.select().from(aiModel).where(eq(aiModel.status, "active")),
    ])
    const providerMap = new Map(
      (providers as ProviderRecord[]).map((provider) => [provider.id, provider]),
    )
    return (models as ModelRecord[]).flatMap((model) => {
      const provider = providerMap.get(model.providerId)
      const apiKey = provider ? decryptCredential(provider, encryptionKey) : null
      const reasoning = reasoningCapabilities(model.reasoning)
      return provider && apiKey
        ? [
            {
              id: model.id,
              label: model.label,
              model: model.upstreamModelId,
              apiKey,
              baseUrl: provider.baseUrl,
              api: providerApi(provider),
              inputModalities: validateModelModalities(
                providerApi(provider),
                modelModalities(model),
              ),
              ...(reasoning ? { reasoning } : {}),
            },
          ]
        : []
    })
  }

  async function listActiveDirectory(): Promise<
    Array<{
      id: string
      label: string
      inputModalities: AiInputModality[]
      reasoning?: AiReasoningCapabilities
    }>
  > {
    return (await listActiveGatewayModels()).map(({ id, label, inputModalities, reasoning }) => ({
      id,
      label,
      inputModalities: inputModalities ?? CHAT_COMPLETIONS_MODALITIES,
      ...(reasoning ? { reasoning } : {}),
    }))
  }

  return {
    list,
    createProvider,
    updateProvider,
    createModel,
    updateModel,
    setProviderStatus,
    setModelStatus,
    deleteProvider,
    deleteModel,
    connectionForModel,
    connectionForProvider,
    recordTest,
    recordProviderTest,
    listActiveGatewayModels,
    listActiveDirectory,
  }
}

export type AiModelQueries = ReturnType<typeof createAiModelQueries>
