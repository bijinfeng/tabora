import { createAttachmentQueries } from "./attachments"
import { createAuditLogQueries } from "./auditLog"
import { createEmailQueueQueries } from "./emailQueue"
import { createSettingsQueries } from "./settings"
import { createSyncedRecordQueries } from "./syncedRecords"
import { createUserQueries } from "./users"

export function createDbQueries(db: any, schema: any) {
  return {
    syncedRecords: createSyncedRecordQueries(db, {
      syncedRecord: schema.syncedRecord,
      user: schema.user,
    }),
    attachments: createAttachmentQueries(db, {
      attachmentPolicy: schema.attachmentPolicy,
      attachmentFile: schema.attachmentFile,
      attachmentRef: schema.attachmentRef,
    }),
    settings: createSettingsQueries(db, schema.setting),
    emailQueue: createEmailQueueQueries(db, { emailQueue: schema.emailQueue }),
    users: createUserQueries(db, { user: schema.user, account: schema.account }),
    auditLog: createAuditLogQueries(db, { auditLog: schema.auditLog }),
  }
}
