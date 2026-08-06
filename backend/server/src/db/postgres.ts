import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"

import { createAttachmentQueries } from "./attachments"
import * as schema from "./schema.postgres"
import { createSyncedRecordQueries } from "./syncedRecords"

export function createPostgresDb(connectionString: string) {
  const pool = new Pool({ connectionString })
  const db = drizzle(pool, { schema })

  const migrate = async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "user" (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
        email_verified BOOLEAN NOT NULL DEFAULT false, image TEXT,
        created_at TIMESTAMP NOT NULL, updated_at TIMESTAMP NOT NULL,
        role TEXT, banned BOOLEAN, ban_reason TEXT, ban_expires TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS session (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        token TEXT NOT NULL UNIQUE, expires_at TIMESTAMP NOT NULL,
        ip_address TEXT, user_agent TEXT,
        created_at TIMESTAMP NOT NULL, updated_at TIMESTAMP NOT NULL, impersonated_by TEXT
      );
      CREATE TABLE IF NOT EXISTS account (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        account_id TEXT NOT NULL, provider_id TEXT NOT NULL,
        access_token TEXT, refresh_token TEXT,
        access_token_expires_at TIMESTAMP, refresh_token_expires_at TIMESTAMP,
        scope TEXT, id_token TEXT, password TEXT,
        created_at TIMESTAMP NOT NULL, updated_at TIMESTAMP NOT NULL
      );
      CREATE TABLE IF NOT EXISTS verification (
        id TEXT PRIMARY KEY, identifier TEXT NOT NULL, value TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL, created_at TIMESTAMP, updated_at TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS synced_record (
        id TEXT PRIMARY KEY,
        owner_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        record_type TEXT NOT NULL, record_id TEXT NOT NULL,
        data JSONB, version INTEGER NOT NULL DEFAULT 1, device_id TEXT NOT NULL,
        deleted BOOLEAN NOT NULL DEFAULT false, record_updated_at TIMESTAMP NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_synced_record_owner ON synced_record(owner_id);
      CREATE INDEX IF NOT EXISTS idx_synced_record_type ON synced_record(record_type);
      CREATE TABLE IF NOT EXISTS attachment_policy (
        id SERIAL PRIMARY KEY,
        entity_type TEXT NOT NULL UNIQUE, mime_whitelist JSONB, max_size_bytes INTEGER
      );
      CREATE TABLE IF NOT EXISTS attachment_file (
        id SERIAL PRIMARY KEY,
        filename TEXT NOT NULL, mime TEXT NOT NULL, size_bytes INTEGER NOT NULL,
        storage_key TEXT NOT NULL, created_at TIMESTAMP NOT NULL
      );
      CREATE TABLE IF NOT EXISTS attachment_ref (
        id SERIAL PRIMARY KEY,
        file_id INTEGER NOT NULL REFERENCES attachment_file(id) ON DELETE CASCADE,
        uploaded_by TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        entity_type TEXT NOT NULL, entity_id TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_attachment_ref_file ON attachment_ref(file_id);
    `)
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

  return {
    db,
    provider: "pg" as const,
    migrate,
    countUsers,
    syncedRecords,
    attachments,
    close: () => pool.end(),
  }
}
