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

  // Device ID is resolved lazily before the first sync
  let deviceId = ""

  // Create sync engine with temporary deviceId (will be updated before sync)
  const syncEngineConfig: {
    database: TaboraDatabase
    gatewayClient: typeof gatewayClient
    changeQueue: typeof changeQueue
    syncMetaRepo: SyncMetaRepository
    authSession: { getSession: () => Promise<unknown | null> }
    deviceId: string
  } = {
    database: config.database,
    gatewayClient,
    changeQueue,
    syncMetaRepo: config.syncMetaRepo,
    authSession: { getSession: () => config.authClient.getSession() },
    deviceId: "",
  }

  const syncEngine = createSyncEngine(syncEngineConfig)

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

        // Ensure we have a device ID (generate and persist on first sync)
        if (!deviceId) {
          const storedDeviceId = await config.syncMetaRepo.get("deviceId")
          if (storedDeviceId) {
            deviceId = storedDeviceId
          } else {
            deviceId = crypto.randomUUID()
            await config.syncMetaRepo.set("deviceId", deviceId)
          }
          syncEngineConfig.deviceId = deviceId
        }

        // Run sync
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
