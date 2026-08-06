import { mkdirSync } from "node:fs"
import { dirname } from "node:path"

import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"

import { createAttachmentQueries } from "./attachments"
import * as schema from "./schema.sqlite"
import { createSyncedRecordQueries } from "./syncedRecords"

export function createSqliteDb(file: string) {
  if (file !== ":memory:") mkdirSync(dirname(file), { recursive: true })
  const sqlite = new Database(file)
  sqlite.pragma("journal_mode = WAL")
  const db = drizzle(sqlite, { schema })

  const migrate = () => {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS user (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
        email_verified INTEGER NOT NULL DEFAULT 0, image TEXT,
        created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
        role TEXT, banned INTEGER, ban_reason TEXT, ban_expires INTEGER
      );
      CREATE TABLE IF NOT EXISTS session (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
        token TEXT NOT NULL UNIQUE, expires_at INTEGER NOT NULL,
        ip_address TEXT, user_agent TEXT,
        created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, impersonated_by TEXT
      );
      CREATE TABLE IF NOT EXISTS account (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
        account_id TEXT NOT NULL, provider_id TEXT NOT NULL,
        access_token TEXT, refresh_token TEXT,
        access_token_expires_at INTEGER, refresh_token_expires_at INTEGER,
        scope TEXT, id_token TEXT, password TEXT,
        created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS verification (
        id TEXT PRIMARY KEY, identifier TEXT NOT NULL, value TEXT NOT NULL,
        expires_at INTEGER NOT NULL, created_at INTEGER, updated_at INTEGER
      );
      CREATE TABLE IF NOT EXISTS synced_record (
        id TEXT PRIMARY KEY,
        owner_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
        record_type TEXT NOT NULL, record_id TEXT NOT NULL,
        data TEXT, version INTEGER NOT NULL DEFAULT 1, device_id TEXT NOT NULL,
        deleted INTEGER NOT NULL DEFAULT 0, record_updated_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_synced_record_owner ON synced_record(owner_id);
      CREATE INDEX IF NOT EXISTS idx_synced_record_type ON synced_record(record_type);
      CREATE TABLE IF NOT EXISTS attachment_policy (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entity_type TEXT NOT NULL UNIQUE, mime_whitelist TEXT, max_size_bytes INTEGER
      );
      CREATE TABLE IF NOT EXISTS attachment_file (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL, mime TEXT NOT NULL, size_bytes INTEGER NOT NULL,
        storage_key TEXT NOT NULL, created_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS attachment_ref (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_id INTEGER NOT NULL REFERENCES attachment_file(id) ON DELETE CASCADE,
        uploaded_by TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
        entity_type TEXT NOT NULL, entity_id TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_attachment_ref_file ON attachment_ref(file_id);
    `)
  }

  const countUsers = () => {
    const row = sqlite.prepare("SELECT count(*) AS value FROM user").get() as { value: number }
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
