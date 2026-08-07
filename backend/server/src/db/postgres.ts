import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"

import { createAttachmentQueries } from "./attachments"
import { buildDdl, buildTables } from "./schemaFactory"
import { createSettingsQueries } from "./settings"
import { createSyncedRecordQueries } from "./syncedRecords"

export function createPostgresDb(connectionString: string) {
  const pool = new Pool({ connectionString })
  const schema = buildTables("pg")
  const db = drizzle(pool, { schema })

  const migrate = async () => {
    await pool.query(buildDdl("pg"))
  }

  const countUsers = async () => {
    const result = await pool.query<{ value: string }>('SELECT count(*) AS value FROM "user"')
    return Number(result.rows[0]?.value ?? 0)
  }

  const syncedRecords = createSyncedRecordQueries(db, {
    syncedRecord: schema.syncedRecord,
    user: schema.user,
  })

  const attachments = createAttachmentQueries(db, {
    attachmentPolicy: schema.attachmentPolicy,
    attachmentFile: schema.attachmentFile,
    attachmentRef: schema.attachmentRef,
  })

  const settings = createSettingsQueries(db, schema.setting)

  return {
    db,
    provider: "pg" as const,
    migrate,
    countUsers,
    syncedRecords,
    attachments,
    settings,
    close: () => pool.end(),
  }
}
