import type { DirectusAuthClient } from "@tabora/auth"
import type { HostAdapter } from "@tabora/host-adapters"
import {
  createChangeDetector,
  createDirectusGatewayClient,
  createLocalChangeQueue,
  createSyncEngine,
  type ChangeDetector,
  type SyncEngine,
} from "@tabora/sync"
import type { SyncMetaRepository, SyncQueueRepository, TaboraDatabase } from "@tabora/storage"

export type SyncManagerConfig = {
  database: TaboraDatabase
  syncQueueRepo: SyncQueueRepository
  syncMetaRepo: SyncMetaRepository
  host: HostAdapter
  apiBaseUrl: string
  authClient: DirectusAuthClient
}

export type SyncManager = {
  syncEngine: SyncEngine
  changeDetector: ChangeDetector
  start(): void
  stop(): void
  triggerSync(): Promise<void>
}

/**
 * Create sync manager - orchestrates change detection and the sync engine.
 * This is the main entry point for integrating sync into the workbench.
 */
export function createSyncManager(config: SyncManagerConfig): SyncManager {
  // Create Directus gateway client (auth token pulled from the auth client)
  const gatewayClient = createDirectusGatewayClient({
    apiBaseUrl: config.apiBaseUrl,
    getAccessToken: async () => (await config.authClient.getSession())?.accessToken ?? null,
  })

  // Create local change queue
  const changeQueue = createLocalChangeQueue(config.syncQueueRepo)

  // Device ID is resolved lazily (and cached) the first time the engine pushes.
  // Generated + persisted on first use so it survives restarts.
  let cachedDeviceId: string | null = null
  async function getDeviceId(): Promise<string> {
    if (cachedDeviceId) return cachedDeviceId
    const stored = await config.syncMetaRepo.get("deviceId")
    if (stored) {
      cachedDeviceId = stored
      return stored
    }
    const generated = crypto.randomUUID()
    await config.syncMetaRepo.set("deviceId", generated)
    cachedDeviceId = generated
    return generated
  }

  const syncEngine = createSyncEngine({
    database: config.database,
    gatewayClient,
    changeQueue,
    syncMetaRepo: config.syncMetaRepo,
    authSession: { getSession: () => config.authClient.getSession() },
    getDeviceId,
  })

  // Create change detector
  const changeDetector = createChangeDetector({
    database: config.database,
    changeQueue,
  })

  let syncTimer: ReturnType<typeof setTimeout> | null = null
  let isRunning = false

  async function triggerSync() {
    // Debounce: if already scheduled, don't schedule again
    if (syncTimer) {
      return
    }

    // Short delay to batch multiple changes
    syncTimer = setTimeout(async () => {
      syncTimer = null

      try {
        // Check if we have a session
        const session = await config.authClient.getSession()
        if (!session) {
          // No session, skip sync
          return
        }

        // Run sync (the engine resolves the device id lazily via getDeviceId)
        const result = await syncEngine.sync()
        if (!result.success) {
          console.error("Sync failed:", result.errors)
        }
      } catch (err) {
        console.error("Sync error:", err)
      }
    }, 2000) // 2 second delay
  }

  function start() {
    if (isRunning) {
      return
    }
    isRunning = true

    // Start change detector
    changeDetector.start()

    // Trigger initial sync on start
    void triggerSync()

    // Listen for visibility change (background to foreground)
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          void triggerSync()
        }
      })
    }

    // Listen for online event (network recovery)
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => {
        void triggerSync()
      })
    }
  }

  function stop() {
    if (!isRunning) {
      return
    }
    isRunning = false

    // Stop change detector
    changeDetector.stop()

    // Clear pending sync timer
    if (syncTimer) {
      clearTimeout(syncTimer)
      syncTimer = null
    }
  }

  return {
    syncEngine,
    changeDetector,
    start,
    stop,
    triggerSync,
  }
}
