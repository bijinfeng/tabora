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
  createSyncGatewayClient,
  type SyncGatewayClient,
  type SyncGatewayClientConfig,
  type SyncGatewayError,
  type SyncGatewayResult,
  type SyncGatewayPushRecord,
  type SyncPushConflict,
  type SyncPushResponse,
  type SyncPullRecord,
  type SyncPullResponse,
} from "./syncGatewayClient"

export { createSyncManager, type SyncManager, type SyncManagerConfig } from "./syncManager"
export { createPluginSyncCollections, type PluginSyncCollections } from "./pluginSyncCollections"
