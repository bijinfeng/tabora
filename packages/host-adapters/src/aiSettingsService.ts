import type { AuthClient } from "@tabora/auth"
import { createHttpAiRuntime } from "@tabora/ai-runtime"
import type {
  AiRuntimeBridge,
  AiSettingsService,
  SettingsAiModel,
  SettingsAiSettings,
} from "@tabora/plugin-api"

import type { AuthStorage } from "./authStorage"

export type LocalAiProviderConfig = {
  baseUrl: string
  apiKey: string
  model: string
}

type StoredAiSettings = {
  activeProvider?: "builtin" | "custom"
  builtinModelId?: string
  custom?: Partial<LocalAiProviderConfig>
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
    if (!options.apiBaseUrl || !options.authClient) return { status: "unavailable", models: [] }
    const session = await options.authClient.getSession().catch(() => null)
    if (!session?.jwt) return { status: "auth-required", models: [] }

    try {
      const response = await fetcher(`${options.apiBaseUrl.replace(/\/$/, "")}/api/ai/models`, {
        headers: { authorization: `Bearer ${session.jwt}` },
      })
      if (response.status === 401) return { status: "auth-required", models: [] }
      if (!response.ok) return { status: "unavailable", models: [] }
      const payload = (await response.json()) as { models?: SettingsAiModel[] }
      const models = Array.isArray(payload.models)
        ? payload.models.filter(
            (model): model is SettingsAiModel =>
              Boolean(model) && typeof model.id === "string" && typeof model.label === "string",
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
    return {
      supportedProviders: ["builtin", "custom"],
      activeProvider: stored.activeProvider ?? "builtin",
      builtin: {
        ...builtin,
        modelId: stored.builtinModelId ?? options.defaultBuiltinModelId,
      },
      custom: {
        baseUrl: typeof custom.baseUrl === "string" ? custom.baseUrl : "",
        model: typeof custom.model === "string" ? custom.model : "",
        apiKeyConfigured: typeof custom.apiKey === "string" && custom.apiKey.length > 0,
        preservesApiKeyOnSave: true,
      },
    }
  }

  return {
    getSettings: snapshot,
    async saveSettings(update) {
      const current = await read()
      const existingCustom = current.custom ?? {}
      await write({
        activeProvider: update.activeProvider,
        builtinModelId: update.builtinModelId || options.defaultBuiltinModelId,
        custom: {
          baseUrl: update.custom.baseUrl.trim(),
          model: update.custom.model.trim(),
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
        return {
          provider: "custom" as const,
          custom: { baseUrl: custom.baseUrl, apiKey: custom.apiKey, model: custom.model },
        }
      }
      return {
        provider: "builtin" as const,
        modelId: stored.builtinModelId ?? options.defaultBuiltinModelId,
      }
    },
  }
}
