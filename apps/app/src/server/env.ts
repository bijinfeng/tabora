export type DatabaseClient = "sqlite" | "postgres"

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
  modelCredentialEncryptionKey: string
}

function parseClient(value: string | undefined): DatabaseClient {
  return value === "postgres" ? "postgres" : "sqlite"
}

function rejectLegacyModelEnv(): void {
  if (
    process.env.TABORA_AI_API_KEY !== undefined ||
    process.env.TABORA_AI_BASE_URL !== undefined ||
    process.env.TABORA_AI_MODELS !== undefined
  ) {
    throw new Error(
      "内置模型目录已迁移至管理后台数据库；请导入后移除 TABORA_AI_API_KEY、TABORA_AI_BASE_URL 与 TABORA_AI_MODELS",
    )
  }
}

function modelCredentialEncryptionKey(): string {
  const configured = process.env.TABORA_MODEL_CREDENTIAL_ENCRYPTION_KEY
  if (configured && configured.length >= 32) return configured
  if (process.env.NODE_ENV === "production") {
    throw new Error("生产环境必须设置至少 32 位的 TABORA_MODEL_CREDENTIAL_ENCRYPTION_KEY")
  }
  return DEV_PLACEHOLDER_SECRET
}

let cachedEnv: AppEnv | null = null

/** 进程级 env 单例：CORS 预检等轻量路径无需初始化数据库运行时即可读取配置。 */
export function getEnv(): AppEnv {
  if (!cachedEnv) cachedEnv = loadEnv()
  return cachedEnv
}

/** 从 process.env 读取运行配置，提供开发友好的默认值。 */
export function loadEnv(): AppEnv {
  rejectLegacyModelEnv()
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
    modelCredentialEncryptionKey: modelCredentialEncryptionKey(),
  }
}
