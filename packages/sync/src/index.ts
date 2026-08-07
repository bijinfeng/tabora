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

// 同步网关客户端 - HTTP client + 字段映射，对接后端同步网关
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

export { createSyncManager, type SyncManager, type SyncManagerConfig } from "./syncManager"
export { createPluginSyncCollections, type PluginSyncCollections } from "./pluginSyncCollections"
