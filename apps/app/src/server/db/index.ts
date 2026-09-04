import type { AppEnv } from "../env"
import { createPostgresDb } from "./postgres"
import { createSqliteDb } from "./sqlite"

export type DbHandle = ReturnType<typeof createSqliteDb> | ReturnType<typeof createPostgresDb>

/** 按 DATABASE_CLIENT 创建 drizzle 连接（供 better-auth adapter 使用）。 */
export function createDb(env: AppEnv): DbHandle {
  if (env.databaseClient === "postgres") {
    return createPostgresDb(env.databaseUrl, env.modelCredentialEncryptionKey)
  }
  return createSqliteDb(env.databaseFile, env.modelCredentialEncryptionKey)
}
