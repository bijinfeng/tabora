import type { AuthClient } from "@tabora/auth"
import { createHttpAiRuntime } from "@tabora/ai-runtime"
import type {
  AiRuntimeBridge,
  AiSettingsService,
  SettingsAiModel,
  SettingsAiSettings,
  SettingsAiInputModality,
} from "@tabora/plugin-api"

import type { AuthStorage } from "./authStorage"

export type LocalAiProviderConfig = {
  baseUrl: string
  apiKey: string
  model: string
  api?: "chat-completions" | "responses"
  inputModalities?: SettingsAiInputModality[]
}

type StoredAiSettings = {
  activeProvider?: "builtin" | "custom"
  builtinModelId?: string
  custom?: Partial<LocalAiProviderConfig> & { name?: string; models?: string[] }
}

function inputModalities(value: unknown): SettingsAiInputModality[] | undefined {
  if (!Array.isArray(value)) return undefined
  const modalities = value.filter(
    (item): item is SettingsAiInputModality =>
      item === "text" || item === "image" || item === "audio" || item === "document",
  )
  return modalities.length === value.length && modalities.includes("text")
    ? [...new Set(modalities)]
    : undefined
}

export type LocalAiSettingsService = AiSettingsService & {
  /** Supplies the request selection consumed by the host's HTTP AI bridge. */
  getRequest(): Promise<
    { provider: "builtin"; modelId: string } | { provider: "custom"; custom: LocalAiProviderConfig }
  >
}

/** Creates the cloud gateway bridge from host-owned settings and session state. */
export function createCloudAiRuntime(options: {
  baseUrl: string
  settings: Pick<LocalAiSettingsService, "getRequest">
  authClient: Pick<AuthClient, "getSession">
}): AiRuntimeBridge {
  return createHttpAiRuntime({
    baseUrl: options.baseUrl,
    getRequest: () => options.settings.getRequest(),
    async getAuthorization() {
      const session = await options.authClient.getSession()
      return session?.jwt ? `Bearer ${session.jwt}` : undefined
    },
  })
}

export function createLocalAiSettingsService(options: {
  storage: AuthStorage
  defaultBuiltinModelId: string
  apiBaseUrl?: string
  authClient?: Pick<AuthClient, "getSession">
  fetcher?: typeof fetch
  storageKey?: string
}): LocalAiSettingsService {
  const storageKey = options.storageKey ?? "tabora.ai.custom-provider"
  const fetcher = options.fetcher ?? fetch

  async function read(): Promise<StoredAiSettings> {
    const raw = await options.storage.getItem(storageKey)
    if (!raw) return {}
    try {
      const value = JSON.parse(raw) as StoredAiSettings
      return value && typeof value === "object" ? value : {}
    } catch {
      return {}
    }
  }

  async function write(value: StoredAiSettings) {
    await options.storage.setItem(storageKey, JSON.stringify(value))
  }

  async function builtinModels(): Promise<{
    status: SettingsAiSettings["builtin"]["status"]
    models: SettingsAiModel[]
  }> {
    // An empty API base is valid for the web app, whose API lives on the current origin.
    // `undefined` means this host has no cloud API at all (for example an offline extension).
    if (options.apiBaseUrl === undefined) return { status: "unavailable", models: [] }
    const session = options.authClient
      ? await options.authClient.getSession().catch(() => null)
      : null
    if (options.apiBaseUrl !== "" && !session?.jwt) return { status: "auth-required", models: [] }

    try {
      const headers = session?.jwt ? { authorization: `Bearer ${session.jwt}` } : undefined
      const response = await fetcher(`${options.apiBaseUrl.replace(/\/$/, "")}/api/ai/models`, {
        ...(headers ? { headers } : {}),
      })
      if (response.status === 401) return { status: "auth-required", models: [] }
      if (!response.ok) return { status: "unavailable", models: [] }
      const payload = (await response.json()) as { models?: SettingsAiModel[] }
      const models = Array.isArray(payload.models)
        ? payload.models.filter(
            (model): model is SettingsAiModel =>
              Boolean(model) &&
              typeof model.id === "string" &&
              typeof model.label === "string" &&
              (model.inputModalities === undefined ||
                Boolean(inputModalities(model.inputModalities))),
          )
        : []
      return { status: models.length ? "available" : "unavailable", models }
    } catch {
      return { status: "unavailable", models: [] }
    }
  }

  async function snapshot(): Promise<SettingsAiSettings> {
    const [stored, builtin] = await Promise.all([read(), builtinModels()])
    const custom = stored.custom ?? {}
    const customModalities = inputModalities(custom.inputModalities)
    return {
      supportedProviders: ["builtin", "custom"],
      activeProvider: stored.activeProvider ?? "builtin",
      builtin: {
        ...builtin,
        modelId: stored.builtinModelId ?? options.defaultBuiltinModelId,
      },
      custom: {
        name: typeof custom.name === "string" ? custom.name : "",
        baseUrl: typeof custom.baseUrl === "string" ? custom.baseUrl : "",
        model: typeof custom.model === "string" ? custom.model : "",
        models: Array.isArray(custom.models)
          ? custom.models.filter(
              (model): model is string => typeof model === "string" && Boolean(model.trim()),
            )
          : typeof custom.model === "string" && custom.model
            ? [custom.model]
            : [],
        ...(custom.api === "chat-completions" || custom.api === "responses"
          ? { api: custom.api }
          : {}),
        ...(customModalities ? { inputModalities: customModalities } : {}),
        apiKeyConfigured: typeof custom.apiKey === "string" && custom.apiKey.length > 0,
        preservesApiKeyOnSave: true,
      },
    }
  }

  return {
    getSettings: snapshot,
    async discoverCustomModels(baseUrl, apiKey) {
      const stored = await read()
      const effectiveApiKey = apiKey?.trim() || stored.custom?.apiKey?.trim() || ""
      const normalizedBaseUrl = baseUrl.trim().replace(/\/$/, "")
      const response = await fetcher(
        options.apiBaseUrl === undefined
          ? `${normalizedBaseUrl}/models`
          : `${options.apiBaseUrl.replace(/\/$/, "")}/api/ai/custom-models`,
        options.apiBaseUrl === undefined
          ? effectiveApiKey
            ? { headers: { authorization: `Bearer ${effectiveApiKey}` } }
            : {}
          : {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ baseUrl: normalizedBaseUrl, apiKey: effectiveApiKey }),
            },
      )
      if (!response.ok) throw new Error("Unable to fetch provider models")
      const payload = (await response.json()) as { models?: unknown; data?: unknown }
      const rawModels = Array.isArray(payload.data) ? payload.data : payload.models
      const models = Array.isArray(rawModels)
        ? rawModels.flatMap((item) => {
            const id =
              typeof item === "string"
                ? item
                : item && typeof item === "object" && "id" in item && typeof item.id === "string"
                  ? item.id
                  : ""
            return id.trim() ? [id.trim()] : []
          })
        : []
      const uniqueModels = [...new Set(models)]
      if (!uniqueModels.length) throw new Error("Provider returned no models")
      return uniqueModels.slice(0, 200)
    },
    async saveSettings(update) {
      const current = await read()
      const existingCustom = current.custom ?? {}
      await write({
        activeProvider: update.activeProvider,
        builtinModelId: update.builtinModelId || options.defaultBuiltinModelId,
        custom: {
          name: update.custom.name?.trim() ?? existingCustom.name ?? "",
          baseUrl: update.custom.baseUrl.trim(),
          model: update.custom.model.trim(),
          models:
            update.custom.models?.map((model) => model.trim()).filter(Boolean) ??
            (update.custom.model.trim() ? [update.custom.model.trim()] : []),
          ...(update.custom.api ? { api: update.custom.api } : {}),
          ...(update.custom.inputModalities
            ? { inputModalities: update.custom.inputModalities }
            : {}),
          ...(update.custom.apiKey
            ? { apiKey: update.custom.apiKey }
            : existingCustom.apiKey
              ? { apiKey: existingCustom.apiKey }
              : {}),
        },
      })
      return snapshot()
    },
    async getRequest() {
      const stored = await read()
      const custom = stored.custom
      if (stored.activeProvider === "custom" && custom?.baseUrl && custom.apiKey && custom.model) {
        const customModalities = inputModalities(custom.inputModalities)
        return {
          provider: "custom" as const,
          custom: {
            baseUrl: custom.baseUrl,
            apiKey: custom.apiKey,
            model: custom.model,
            ...(custom.api ? { api: custom.api } : {}),
            ...(customModalities ? { inputModalities: customModalities } : {}),
          },
        }
      }
      return {
        provider: "builtin" as const,
        modelId: stored.builtinModelId ?? options.defaultBuiltinModelId,
      }
    },
  }
}
