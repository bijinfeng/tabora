import type {
  AdminAiProvider,
  ModelInputModality,
  ModelReasoningCapabilities,
  ProviderApi,
} from "./model-management.types"

type BuiltinModelCapability = {
  id: string
  inputModalities: ModelInputModality[]
  reasoning?: ModelReasoningCapabilities
}

export type BuiltinProviderPreset = {
  id: string
  label: string
  baseUrl: string
  api: ProviderApi
  models: BuiltinModelCapability[]
}

/**
 * Provider templates and their explicitly supported model contracts.
 *
 * A model must be listed verbatim here before its capabilities are applied
 * automatically. Provider/model names are intentionally not pattern-matched:
 * providers and aggregators can expose models with different capabilities.
 */
export const BUILTIN_PROVIDER_PRESETS: BuiltinProviderPreset[] = [
  {
    id: "openai",
    label: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    api: "responses",
    models: [
      { id: "gpt-4.1", inputModalities: ["text", "image"] },
      { id: "gpt-4.1-mini", inputModalities: ["text", "image"] },
      { id: "gpt-4.1-nano", inputModalities: ["text", "image"] },
      {
        id: "gpt-5",
        inputModalities: ["text", "image"],
        reasoning: { effort: true, summary: true, continuation: true },
      },
      {
        id: "gpt-5-mini",
        inputModalities: ["text", "image"],
        reasoning: { effort: true, summary: true, continuation: true },
      },
      {
        id: "gpt-5-nano",
        inputModalities: ["text", "image"],
        reasoning: { effort: true, summary: true, continuation: true },
      },
      {
        id: "o3",
        inputModalities: ["text", "image"],
        reasoning: { effort: true, summary: true, continuation: true },
      },
      {
        id: "o4-mini",
        inputModalities: ["text", "image"],
        reasoning: { effort: true, summary: true, continuation: true },
      },
    ],
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    baseUrl: "https://api.deepseek.com/v1",
    api: "responses",
    models: [
      {
        id: "deepseek-v4-flash",
        inputModalities: ["text", "image"],
        reasoning: { effort: true, summary: true, continuation: true },
      },
      {
        id: "deepseek-v4-flash-vision-exp",
        inputModalities: ["text", "image"],
        reasoning: { effort: true, summary: true, continuation: true },
      },
      {
        id: "deepseek-v4-pro",
        inputModalities: ["text", "image"],
        reasoning: { effort: true, summary: true, continuation: true },
      },
    ],
  },
  {
    id: "qwen",
    label: "通义千问（阿里云百炼）",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    api: "chat-completions",
    models: [
      { id: "qwen-turbo", inputModalities: ["text"] },
      { id: "qwen-plus", inputModalities: ["text"] },
      { id: "qwen-max", inputModalities: ["text"] },
      { id: "qwen-vl-plus", inputModalities: ["text", "image"] },
      { id: "qwen-vl-max", inputModalities: ["text", "image"] },
    ],
  },
  {
    id: "moonshot",
    label: "Moonshot（Kimi）",
    baseUrl: "https://api.moonshot.cn/v1",
    api: "chat-completions",
    models: [
      { id: "moonshot-v1-8k", inputModalities: ["text"] },
      { id: "moonshot-v1-32k", inputModalities: ["text"] },
      { id: "moonshot-v1-128k", inputModalities: ["text"] },
    ],
  },
  {
    id: "siliconflow",
    label: "SiliconFlow（硅基流动）",
    baseUrl: "https://api.siliconflow.cn/v1",
    api: "chat-completions",
    models: [],
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    api: "chat-completions",
    models: [],
  },
]

function builtinProviderPresetFor(provider: Pick<AdminAiProvider, "id" | "baseUrl" | "api">) {
  return BUILTIN_PROVIDER_PRESETS.find(
    (preset) =>
      preset.id === provider.id &&
      preset.baseUrl === provider.baseUrl &&
      preset.api === (provider.api ?? "chat-completions"),
  )
}

export function builtinModelCapabilitiesFor(
  provider: Pick<AdminAiProvider, "id" | "baseUrl" | "api"> | undefined,
  upstreamModelId: string,
): BuiltinModelCapability | undefined {
  if (!provider) return undefined
  return builtinProviderPresetFor(provider)?.models.find((model) => model.id === upstreamModelId)
}
