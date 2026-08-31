import { mkdirSync } from "node:fs"
import { dirname } from "node:path"

import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"

import { buildDdl, buildTables } from "./schemaFactory"
import { createDbQueries } from "./queryWiring"

export function createSqliteDb(
  file: string,
  modelCredentialEncryptionKey = "test-model-credential-encryption-key",
) {
  if (file !== ":memory:") mkdirSync(dirname(file), { recursive: true })
  const sqlite = new Database(file)
  sqlite.pragma("journal_mode = WAL")
  const schema = buildTables("sqlite")
  const db = drizzle(sqlite, { schema })

  const migrate = () => {
    sqlite.exec(buildDdl("sqlite"))
  }

  const countUsers = () => {
    const row = sqlite.prepare('SELECT count(*) AS value FROM "user"').get() as { value: number }
    return Number(row.value)
  }

  const queries = createDbQueries(db, schema, modelCredentialEncryptionKey)

  return {
    db,
    provider: "sqlite" as const,
    migrate,
    countUsers,
    ...queries,
    close: () => sqlite.close(),
  }
}
