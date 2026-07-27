// Local change queue
export { createLocalChangeQueue, type LocalChange, type LocalChangeQueue } from "./localChangeQueue"

// Change detector
export {
  createChangeDetector,
  type ChangeDetector,
  type ChangeDetectorConfig,
} from "./changeDetector"

// Sync engine
export {
  createSyncEngine,
  type SyncEngine,
  type SyncEngineConfig,
  type SyncAuthSession,
  type SyncResult,
} from "./syncEngine"

// Sensitive field filter
export { rejectSensitiveFields, isSafeToSync, SensitiveFieldError } from "./sensitiveFilter"

// Conflict model
export {
  createConflictInbox,
  type ConflictInbox,
  type ConflictRecord,
  type ConflictResolution,
} from "./conflictModel"

// Strapi auth (S1) - re-exported for S3 sync migration
export { createStrapiAuthClient, type StrapiAuthClient, type StrapiSession } from "@tabora/auth"

// Strapi gateway client (S3) - HTTP client + 字段映射，对接 Strapi 同步网关
export {
  createStrapiGatewayClient,
  type StrapiGatewayClient,
  type StrapiGatewayClientConfig,
  type StrapiGatewayError,
  type StrapiGatewayResult,
  type StrapiGatewayPushRecord,
  type StrapiPushConflict,
  type StrapiPushResponse,
  type StrapiPullRecord,
  type StrapiPullResponse,
} from "./strapiGatewayClient"
