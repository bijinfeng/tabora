// Auth session management
export {
  createAuthSessionManager,
  getSupabaseClient,
  type AuthSession,
  type AuthSessionManager,
  type AuthSessionConfig,
} from "./authSession"

// Gateway client
export {
  createGatewayClient,
  type GatewayClient,
  type GatewayAction,
  type GatewayRequest,
  type GatewayResponse,
  type GatewaySuccessResponse,
  type GatewayErrorResponse,
  type DeviceInfo,
  type SyncRecord,
  type PushRequest,
  type PushResponse,
  type PullRequest,
  type PullResponse,
  type RegisterDeviceRequest,
  type RegisterDeviceResponse,
  type SnapshotRequest,
  type SnapshotResponse,
  type GatewayClientConfig,
} from "./gatewayClient"

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

// Directus auth (S1) - re-exported for S3 migration off Supabase
export {
  createDirectusAuthClient,
  type DirectusAuthClient,
  type DirectusSession,
} from "@tabora/auth"

// Directus gateway client (S3) - HTTP client + 字段映射，对接 S2 同步网关
export {
  createDirectusGatewayClient,
  type DirectusGatewayClient,
  type DirectusGatewayClientConfig,
  type DirectusGatewayError,
  type DirectusGatewayResult,
  type DirectusGatewayPushRecord,
  type DirectusPushConflict,
  type DirectusPushResponse,
  type DirectusPullRecord,
  type DirectusPullResponse,
} from "./directusGatewayClient"
