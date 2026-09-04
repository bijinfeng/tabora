import type {
  AiSettingsService,
  SettingsAiSettings,
  SettingsAiSettingsUpdate,
} from "@tabora/plugin-api"

type FnosAiConfigResponse = {
  configured?: boolean
  baseUrl?: string
  model?: string
  hasApiKey?: boolean
}

/** FNOS stores one write-only AI provider configuration for the entire device. */
export function createFnosAiSettingsService(options: {
  baseUrl: string
  fetcher?: typeof fetch
}): AiSettingsService {
  const fetcher = options.fetcher ?? fetch
  const endpoint = `${options.baseUrl.replace(/\/$/, "")}/api/ai/config`

  function toSettings(response: FnosAiConfigResponse): SettingsAiSettings {
    return {
      supportedProviders: ["custom"],
      activeProvider: "custom",
      builtin: { status: "unavailable", models: [], modelId: "" },
      custom: {
        baseUrl: typeof response.baseUrl === "string" ? response.baseUrl : "",
        model: typeof response.model === "string" ? response.model : "",
        apiKeyConfigured: response.hasApiKey === true,
        preservesApiKeyOnSave: false,
      },
    }
  }

  async function read(): Promise<SettingsAiSettings> {
    const response = await fetcher(endpoint)
    if (!response.ok) throw new Error("Unable to load device AI configuration")
    return toSettings((await response.json()) as FnosAiConfigResponse)
  }

  return {
    getSettings: read,
    async saveSettings(update: SettingsAiSettingsUpdate) {
      if (update.activeProvider !== "custom" || !update.custom.apiKey?.trim()) {
        throw new Error("FNOS requires a device administrator API key")
      }
      const response = await fetcher(endpoint, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          baseUrl: update.custom.baseUrl,
          model: update.custom.model,
          apiKey: update.custom.apiKey,
        }),
      })
      if (!response.ok) throw new Error("Unable to save device AI configuration")
      return toSettings((await response.json()) as FnosAiConfigResponse)
    },
  }
}
