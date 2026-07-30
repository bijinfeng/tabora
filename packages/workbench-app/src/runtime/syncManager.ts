import type { StrapiAuthClient } from "@tabora/auth"
import type { HostAdapter } from "@tabora/host-adapters"
import {
  createChangeDetector,
  createStrapiGatewayClient,
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
  authClient: StrapiAuthClient
}

export type SyncManager = {
  syncEngine: SyncEngine
  changeDetector: ChangeDetector
  start(): void
  stop(): void
  triggerSync(): Promise<void>
}

type SyncManagerErrorCode = "AUTH_FAILED" | "SYNC_FAILED" | "SYNC_CANCELLED"

class SyncManagerError extends Error {
  constructor(
    readonly code: SyncManagerErrorCode,
    message: string,
  ) {
    super(message)
    this.name = "SyncManagerError"
  }
}

/**
 * Create sync manager - orchestrates change detection and the sync engine.
 * This is the main entry point for integrating sync into the workbench.
 */
export function createSyncManager(config: SyncManagerConfig): SyncManager {
  // Create Strapi gateway client (auth token pulled from the auth client)
  const gatewayClient = createStrapiGatewayClient({
    apiBaseUrl: config.apiBaseUrl,
    getAccessToken: async () => (await config.authClient.getSession())?.jwt ?? null,
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
    onChange: triggerBackgroundSync,
  })

  let syncTimer: ReturnType<typeof setTimeout> | null = null
  let scheduledSync: Promise<void> | null = null
  let resolveScheduledSync: (() => void) | null = null
  let rejectScheduledSync: ((reason: unknown) => void) | null = null
  let syncInProgress = false
  let followUpRequested = false
  let isRunning = false
  let isStopped = false

  async function runSync() {
    const session = await config.authClient.getSession()
    if (!session) {
      throw new SyncManagerError("AUTH_FAILED", "请先登录后再同步")
    }

    try {
      // Run sync (the engine resolves the device id lazily via getDeviceId)
      const result = await syncEngine.sync()
      if (!result.success) {
        console.error("Sync failed:", result.errors)
        const code = result.errors.includes("No active session") ? "AUTH_FAILED" : "SYNC_FAILED"
        throw new SyncManagerError(code, result.errors[0] ?? "同步失败，请稍后重试")
      }
    } catch (err) {
      if (err instanceof SyncManagerError) {
        throw err
      }
      console.error("Sync error:", err)
      throw new SyncManagerError(
        "SYNC_FAILED",
        err instanceof Error ? err.message : "同步失败，请稍后重试",
      )
    }
  }

  function clearScheduledSync() {
    scheduledSync = null
    resolveScheduledSync = null
    rejectScheduledSync = null
  }

  function finishScheduledSync() {
    const shouldScheduleFollowUp = followUpRequested && !isStopped
    syncInProgress = false
    followUpRequested = false
    clearScheduledSync()
    if (shouldScheduleFollowUp) {
      triggerBackgroundSync()
    }
  }

  function resolveSync() {
    const resolve = resolveScheduledSync
    finishScheduledSync()
    resolve?.()
  }

  function rejectSync(error: unknown) {
    const reject = rejectScheduledSync
    finishScheduledSync()
    reject?.(error)
  }

  function triggerSync(): Promise<void> {
    // Debounce: if already scheduled, don't schedule again
    if (scheduledSync) {
      if (syncInProgress) {
        followUpRequested = true
      }
      return scheduledSync
    }

    // Short delay to batch multiple changes
    scheduledSync = new Promise((resolve, reject) => {
      resolveScheduledSync = resolve
      rejectScheduledSync = reject
      syncTimer = setTimeout(() => {
        syncTimer = null
        syncInProgress = true
        void runSync().then(resolveSync, rejectSync)
      }, 2000)
    })
    return scheduledSync
  }

  function triggerBackgroundSync() {
    void triggerSync().catch(() => {})
  }

  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      triggerBackgroundSync()
    }
  }

  const handleOnline = () => {
    triggerBackgroundSync()
  }

  function start() {
    if (isRunning) {
      return
    }
    isRunning = true
    isStopped = false

    // Start change detector
    changeDetector.start()

    // Trigger initial sync on start
    triggerBackgroundSync()

    // Listen for visibility change (background to foreground)
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange)
    }

    // Listen for online event (network recovery)
    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline)
    }
  }

  function stop() {
    if (!isRunning) {
      return
    }
    isRunning = false
    isStopped = true

    // Stop change detector
    changeDetector.stop()

    // Clear pending sync timer
    if (syncTimer) {
      clearTimeout(syncTimer)
      syncTimer = null
      rejectSync(new SyncManagerError("SYNC_CANCELLED", "同步已取消"))
    }

    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
    if (typeof window !== "undefined") {
      window.removeEventListener("online", handleOnline)
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
