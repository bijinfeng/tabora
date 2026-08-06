export type DatabaseClient = "sqlite" | "postgres"

export type AppEnv = {
  host: string
  port: number
  corsOrigins: string[]
  databaseClient: DatabaseClient
  databaseFile: string
  databaseUrl: string
  authSecret: string
  baseUrl: string
}

function parseClient(value: string | undefined): DatabaseClient {
  return value === "postgres" ? "postgres" : "sqlite"
}

/** 从 process.env 读取运行配置，提供开发友好的默认值。 */
export function loadEnv(): AppEnv {
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
      process.env.BETTER_AUTH_SECRET ?? process.env.ADMIN_JWT_SECRET ?? "dev-insecure-secret",
    baseUrl: process.env.BETTER_AUTH_URL ?? `http://${host}:${port}`,
  }
}
