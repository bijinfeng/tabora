import { mkdirSync } from "node:fs"
import { dirname } from "node:path"

import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"

import { createAttachmentQueries } from "./attachments"
import { createEmailQueueQueries } from "./emailQueue"
import { buildDdl, buildTables } from "./schemaFactory"
import { createSettingsQueries } from "./settings"
import { createSyncedRecordQueries } from "./syncedRecords"
import { createUserQueries } from "./users"

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

  const settings = createSettingsQueries(db, schema.setting)

  const emailQueue = createEmailQueueQueries(db, { emailQueue: schema.emailQueue })

  const users = createUserQueries(db, { user: schema.user, account: schema.account })

  return {
    db,
    provider: "sqlite" as const,
    migrate,
    countUsers,
    syncedRecords,
    attachments,
    settings,
    emailQueue,
    users,
    close: () => sqlite.close(),
  }
}
