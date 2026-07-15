import type { HostAdapter } from "@tabora/host-adapters"
import {
  createChromeStorageAuthStorage,
  createLocalStorageAuthStorage,
} from "@tabora/host-adapters"
import {
  createAuthSessionManager,
  createChangeDetector,
  createGatewayClient,
  createLocalChangeQueue,
  createSyncEngine,
  type AuthSessionManager,
  type ChangeDetector,
  type SyncEngine,
} from "@tabora/sync"
import type { SyncMetaRepository, SyncQueueRepository, TaboraDatabase } from "@tabora/storage"

export type SyncManagerConfig = {
  database: TaboraDatabase
  syncQueueRepo: SyncQueueRepository
  syncMetaRepo: SyncMetaRepository
  host: HostAdapter
  supabaseUrl: string
  supabaseAnonKey: string
  gatewayUrl: string
}

export type SyncManager = {
  authSession: AuthSessionManager
  syncEngine: SyncEngine
  changeDetector: ChangeDetector
  start(): void
  stop(): void
  triggerSync(): Promise<void>
}

/**
 * Create sync manager - orchestrates auth, change detection, and sync engine.
 * This is the main entry point for integrating sync into the workbench.
 */
export function createSyncManager(config: SyncManagerConfig): SyncManager {
  // Create auth storage adapter based on host platform
  const authStorage =
    config.host.platform === "extension"
      ? createChromeStorageAuthStorage()
      : createLocalStorageAuthStorage()

  // Create auth session manager
  const authSession = createAuthSessionManager({
    supabaseUrl: config.supabaseUrl,
    supabaseAnonKey: config.supabaseAnonKey,
    storage: authStorage,
  })

  // Create gateway client
  const gatewayClient = createGatewayClient({
    gatewayUrl: config.gatewayUrl,
    getAccessToken: async () => {
      const session = await authSession.getSession()
      return session?.accessToken ?? null
    },
  })

  // Create local change queue
  const changeQueue = createLocalChangeQueue(config.syncQueueRepo)

  // Get device ID from sync meta (will be loaded on first sync)
  let deviceId: string = ""

  // Create sync engine with temporary deviceId (will be updated before sync)
  const syncEngineConfig: {
    database: TaboraDatabase
    gatewayClient: typeof gatewayClient
    changeQueue: typeof changeQueue
    syncMetaRepo: SyncMetaRepository
    authSession: typeof authSession
    deviceId: string
  } = {
    database: config.database,
    gatewayClient,
    changeQueue,
    syncMetaRepo: config.syncMetaRepo,
    authSession,
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
        const session = await authSession.getSession()
        if (!session) {
          // No session, skip sync
          return
        }

        // Ensure device is registered
        if (!deviceId) {
          const storedDeviceId = await config.syncMetaRepo.get("deviceId")
          if (!storedDeviceId) {
            // Register device on first sync
            const deviceInfo = {
              deviceId: crypto.randomUUID(),
              name: `${config.host.platform}-${Date.now()}`,
              type:
                config.host.platform === "extension" ? ("browser" as const) : ("browser" as const),
            }
            const registerResult = await gatewayClient.registerDevice(deviceInfo)
            if (registerResult.ok) {
              deviceId = registerResult.data.deviceId
              syncEngineConfig.deviceId = deviceId
              await config.syncMetaRepo.set("deviceId", deviceId)
            } else {
              console.error("Failed to register device:", registerResult.error)
              return
            }
          } else {
            deviceId = storedDeviceId
            syncEngineConfig.deviceId = storedDeviceId
          }
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
    authSession,
    syncEngine,
    changeDetector,
    start,
    stop,
    triggerSync,
  }
}
