import { mkdirSync } from "node:fs"
import { dirname } from "node:path"

import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"

import { createAttachmentQueries } from "./attachments"
import { buildDdl, buildTables } from "./schemaFactory"
import { createSyncedRecordQueries } from "./syncedRecords"

export function createSqliteDb(file: string) {
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

  const syncedRecords = createSyncedRecordQueries(db, {
    syncedRecord: schema.syncedRecord,
    user: schema.user,
  })

  const attachments = createAttachmentQueries(db, {
    attachmentPolicy: schema.attachmentPolicy,
    attachmentFile: schema.attachmentFile,
    attachmentRef: schema.attachmentRef,
  })

  return {
    db,
    provider: "sqlite" as const,
    migrate,
    countUsers,
    syncedRecords,
    attachments,
    close: () => sqlite.close(),
  }
}
