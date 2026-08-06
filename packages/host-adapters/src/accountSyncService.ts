import { createBetterAuthClient, type AuthClient } from "@tabora/auth"
import { createSyncManager, type PluginSyncCollections, type SyncManager } from "@tabora/sync"
import type { StorageAdapter, SyncMetaRepository } from "@tabora/storage"

import {
  createChromeStorageAuthStorage,
  createLocalStorageAuthStorage,
  type AuthStorage,
} from "./authStorage"
import type { HostAdapter } from "./index"

/** Host-owned account and sync services. Plugins never receive a database handle. */
export type AccountSyncService = {
  authClient: AuthClient
  syncManager: SyncManager
  syncMetaRepo: SyncMetaRepository
}

export function createAccountSyncService(options: {
  host: HostAdapter
  storageAdapter: StorageAdapter
  apiBaseUrl: string
  authStorage?: AuthStorage
  syncCollections?: PluginSyncCollections
}): AccountSyncService {
  const database = options.storageAdapter.database
  const sync = options.storageAdapter.sync
  if (!database || !sync) {
    throw new Error("Account sync requires a host adapter with optional sync infrastructure")
  }

  const authStorage =
    options.authStorage ??
    (options.host.platform === "extension"
      ? createChromeStorageAuthStorage()
      : createLocalStorageAuthStorage())
  const authClient = createBetterAuthClient({
    apiBaseUrl: options.apiBaseUrl,
    storage: authStorage,
  })
  const syncManager = createSyncManager({
    database,
    syncQueueRepo: sync.syncQueueRepo,
    syncMetaRepo: sync.syncMetaRepo,
    apiBaseUrl: options.apiBaseUrl,
    authClient,
    ...(options.syncCollections ? { syncCollections: options.syncCollections } : {}),
  })

  return { authClient, syncManager, syncMetaRepo: sync.syncMetaRepo }
}
