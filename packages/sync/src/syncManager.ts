import type { StrapiAuthClient } from "@tabora/auth"
import type { SyncMetaRepository, SyncQueueRepository, TaboraDatabase } from "@tabora/storage"

import { createChangeDetector, type ChangeDetector } from "./changeDetector"
import { createLocalChangeQueue } from "./localChangeQueue"
import { createStrapiGatewayClient } from "./strapiGatewayClient"
import { createSyncEngine, type SyncEngine } from "./syncEngine"
import type { PluginSyncCollections } from "./pluginSyncCollections"

export type SyncManagerConfig = {
  database: TaboraDatabase
  syncQueueRepo: SyncQueueRepository
  syncMetaRepo: SyncMetaRepository
  apiBaseUrl: string
  authClient: StrapiAuthClient
  /** Manifest-declared record collections approved for synchronization. */
  syncCollections?: PluginSyncCollections
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

/** Coordinates local change detection, the gateway, and background sync scheduling. */
export function createSyncManager(config: SyncManagerConfig): SyncManager {
  const gatewayClient = createStrapiGatewayClient({
    apiBaseUrl: config.apiBaseUrl,
    getAccessToken: async () => (await config.authClient.getSession())?.jwt ?? null,
  })
  const changeQueue = createLocalChangeQueue(config.syncQueueRepo)

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

  let syncTimer: ReturnType<typeof setTimeout> | null = null
  let scheduledSync: Promise<void> | null = null
  let resolveScheduledSync: (() => void) | null = null
  let rejectScheduledSync: ((reason: unknown) => void) | null = null
  let syncInProgress = false
  let followUpRequested = false
  let isRunning = false
  let isStopped = false

  function triggerBackgroundSync() {
    void triggerSync().catch(() => {})
  }

  const changeDetector = createChangeDetector({
    database: config.database,
    changeQueue,
    ...(config.syncCollections ? { syncCollections: config.syncCollections } : {}),
    onChange: triggerBackgroundSync,
  })

  async function runSync() {
    const session = await config.authClient.getSession()
    if (!session) throw new SyncManagerError("AUTH_FAILED", "请先登录后再同步")

    try {
      const result = await syncEngine.sync()
      if (!result.success) {
        console.error("Sync failed:", result.errors)
        const code = result.errors.includes("No active session") ? "AUTH_FAILED" : "SYNC_FAILED"
        throw new SyncManagerError(code, result.errors[0] ?? "同步失败，请稍后重试")
      }
    } catch (error) {
      if (error instanceof SyncManagerError) throw error
      console.error("Sync error:", error)
      throw new SyncManagerError(
        "SYNC_FAILED",
        error instanceof Error ? error.message : "同步失败，请稍后重试",
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
    if (shouldScheduleFollowUp) triggerBackgroundSync()
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
    if (isStopped) {
      return Promise.reject(new SyncManagerError("SYNC_CANCELLED", "同步管理器已停止"))
    }
    if (scheduledSync) {
      if (syncInProgress) followUpRequested = true
      return scheduledSync
    }

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

  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") triggerBackgroundSync()
  }
  const handleOnline = () => triggerBackgroundSync()

  function start() {
    if (isRunning) return
    isRunning = true
    isStopped = false
    changeDetector.start()
    triggerBackgroundSync()
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange)
    }
    if (typeof window !== "undefined") window.addEventListener("online", handleOnline)
  }

  function stop() {
    isStopped = true
    if (!isRunning) return
    isRunning = false
    changeDetector.stop()
    if (syncTimer) {
      clearTimeout(syncTimer)
      syncTimer = null
      rejectSync(new SyncManagerError("SYNC_CANCELLED", "同步已取消"))
    }
    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
    if (typeof window !== "undefined") window.removeEventListener("online", handleOnline)
  }

  return { syncEngine, changeDetector, start, stop, triggerSync }
}
