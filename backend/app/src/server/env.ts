export type DatabaseClient = "sqlite" | "postgres"

export type AiBuiltinProvider = {
  id: string
  baseUrl: string
  apiKey: string
  models: string[]
}

/**
 * 开发环境占位 secret(≥32 字符、高熵,消除 better-auth 警告)。
 * 生产部署必须通过 BETTER_AUTH_SECRET 环境变量设置真实密钥。
 * System API 会检测此占位值,报告为"未配置"。
 */
export const DEV_PLACEHOLDER_SECRET = "X4TjuP0xJiy3yX8CUbT9OzgITqkGnucA"

export type AppEnv = {
  host: string
  port: number
  corsOrigins: string[]
  databaseClient: DatabaseClient
  databaseFile: string
  databaseUrl: string
  authSecret: string
  baseUrl: string
  uploadsDir: string
  aiBuiltinProviders: AiBuiltinProvider[]
}

function parseClient(value: string | undefined): DatabaseClient {
  return value === "postgres" ? "postgres" : "sqlite"
}

function invalidBuiltinProviders(): never {
  throw new Error(
    "TABORA_AI_BUILTIN_PROVIDERS must be a JSON array of providers with id, baseUrl, apiKey, and models",
  )
}

function rejectLegacyBuiltinProviderEnv(): void {
  if (
    process.env.TABORA_AI_API_KEY !== undefined ||
    process.env.TABORA_AI_BASE_URL !== undefined ||
    process.env.TABORA_AI_MODELS !== undefined
  ) {
    throw new Error(
      "Use TABORA_AI_BUILTIN_PROVIDERS instead of TABORA_AI_API_KEY, TABORA_AI_BASE_URL, and TABORA_AI_MODELS",
    )
  }
}

/** Parse the server-only provider directory without accepting partial provider credentials. */
export function parseAiBuiltinProviders(value: string | undefined): AiBuiltinProvider[] {
  if (!value?.trim()) return []

  let input: unknown
  try {
    input = JSON.parse(value)
  } catch {
    return invalidBuiltinProviders()
  }
  if (!Array.isArray(input)) return invalidBuiltinProviders()

  const providerIds = new Set<string>()
  return input.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return invalidBuiltinProviders()
    const provider = item as Record<string, unknown>
    if (
      typeof provider.id !== "string" ||
      typeof provider.baseUrl !== "string" ||
      typeof provider.apiKey !== "string" ||
      !Array.isArray(provider.models)
    ) {
      return invalidBuiltinProviders()
    }

    const id = provider.id.trim()
    const baseUrl = provider.baseUrl.trim()
    const apiKey = provider.apiKey.trim()
    const models = provider.models.map((model) => (typeof model === "string" ? model.trim() : ""))
    if (
      !id ||
      !baseUrl ||
      !apiKey ||
      models.length === 0 ||
      models.some((model) => !model) ||
      new Set(models).size !== models.length ||
      providerIds.has(id)
    ) {
      return invalidBuiltinProviders()
    }
    providerIds.add(id)
    return { id, baseUrl, apiKey, models }
  })
}

let cachedEnv: AppEnv | null = null

/** 进程级 env 单例：CORS 预检等轻量路径无需初始化数据库运行时即可读取配置。 */
export function getEnv(): AppEnv {
  if (!cachedEnv) cachedEnv = loadEnv()
  return cachedEnv
}

/** 从 process.env 读取运行配置，提供开发友好的默认值。 */
export function loadEnv(): AppEnv {
  rejectLegacyBuiltinProviderEnv()
  const databaseClient = parseClient(process.env.DATABASE_CLIENT)
  const host = process.env.HOST ?? "127.0.0.1"
  const port = Number(process.env.PORT ?? 4000)

  return {
    host,
    port,
    corsOrigins: (process.env.CORS_ORIGINS ?? "http://localhost:5173")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
    databaseClient,
    databaseFile: process.env.DATABASE_FILE ?? "./data/tabora.db",
    databaseUrl: process.env.DATABASE_URL ?? "postgres://tabora:tabora@localhost:5432/tabora",
    authSecret:
      process.env.BETTER_AUTH_SECRET ?? process.env.ADMIN_JWT_SECRET ?? DEV_PLACEHOLDER_SECRET,
    baseUrl: process.env.BETTER_AUTH_URL ?? `http://${host}:${port}`,
    uploadsDir: process.env.UPLOADS_DIR ?? "./data/uploads",
    aiBuiltinProviders: parseAiBuiltinProviders(process.env.TABORA_AI_BUILTIN_PROVIDERS),
  }
}
