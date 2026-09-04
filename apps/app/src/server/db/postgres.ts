import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"

import { buildDdl, buildTables } from "./schemaFactory"
import { createDbQueries } from "./queryWiring"

export function createPostgresDb(
  connectionString: string,
  modelCredentialEncryptionKey = "test-model-credential-encryption-key",
) {
  const pool = new Pool({ connectionString })
  const schema = buildTables("pg")
  const db = drizzle(pool, { schema })

  const migrate = async () => {
    await pool.query(buildDdl("pg"))
    await pool.query('ALTER TABLE "ai_provider" ADD COLUMN IF NOT EXISTS "api" TEXT')
    await pool.query('ALTER TABLE "ai_model" ADD COLUMN IF NOT EXISTS "input_modalities" JSONB')
  }

  const countUsers = async () => {
    const result = await pool.query<{ value: string }>('SELECT count(*) AS value FROM "user"')
    return Number(result.rows[0]?.value ?? 0)
  }

  const queries = createDbQueries(db, schema, modelCredentialEncryptionKey)

  return {
    db,
    provider: "pg" as const,
    migrate,
    countUsers,
    ...queries,
    close: () => pool.end(),
  }
}
