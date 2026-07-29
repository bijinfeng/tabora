import "fake-indexeddb/auto"
import { describe, expect, it, vi } from "vitest"
import { createSyncQueueRepository, createTaboraDatabase } from "@tabora/storage"
import type { LocalChange, LocalChangeQueue } from "./localChangeQueue"
import { createLocalChangeQueue } from "./localChangeQueue"
import { createChangeDetector } from "./changeDetector"

type HookCb = (...args: any[]) => void

/**
 * Build a minimal fake Dexie-like database whose tables record the hook
 * callbacks registered by the change detector. `fire(table, hook, ...args)`
 * invokes a captured callback so a test can simulate a create/update/delete.
 */
function makeDatabase() {
  const tables = new Map<string, Map<string, HookCb>>()

  function makeTable(name: string) {
    const tableHooks = new Map<string, HookCb>()
    tables.set(name, tableHooks)
    return {
      hook(hookName: string, cb: HookCb) {
        tableHooks.set(hookName, cb)
      },
    }
  }

  const database = {
    workspaces: makeTable("workspaces"),
    pluginInstances: makeTable("pluginInstances"),
    plugins: makeTable("plugins"),
    pluginData: makeTable("pluginData"),
  }

  function fire(table: string, hookName: string, ...args: any[]) {
    const cb = tables.get(table)?.get(hookName)
    if (!cb) throw new Error(`no hook ${table}.${hookName} registered`)
    const completeSubscribers: Array<() => void> = []
    cb(...args, {
      on(event: string, subscriber: () => void) {
        if (event === "complete") completeSubscribers.push(subscriber)
      },
    })
    completeSubscribers.forEach((subscriber) => subscriber())
  }

  return { database, fire }
}

function makeQueue() {
  const enqueued: LocalChange[] = []
  const queue = {
    enqueue: vi.fn((change: LocalChange) => {
      enqueued.push(change)
      return Promise.resolve()
    }),
  } as unknown as LocalChangeQueue
  return { queue, enqueued }
}

describe("createChangeDetector", () => {
  it("normalizes pluginData creates to entityType 'pluginData' while keeping pluginId in payload", async () => {
    const { database, fire } = makeDatabase()
    const { queue, enqueued } = makeQueue()

    const detector = createChangeDetector({ database: database as any, changeQueue: queue })
    detector.start()

    fire("pluginData", "creating", "pd1", {
      id: "pd1",
      pluginId: "todo-plugin",
      updatedAt: "2026-07-15T08:00:00.000Z",
      note: "hi",
    })

    await vi.waitFor(() => expect(enqueued).toHaveLength(1))
    const change = enqueued[0]
    expect(change).toBeDefined()
    expect(change?.entityType).toBe("pluginData")
    expect(change?.scope).toBe("plugin")
    expect(change?.recordKey).toBe("pd1")
    // pluginId is preserved in the payload (no info loss).
    expect((change!.payload as { pluginId?: string }).pluginId).toBe("todo-plugin")
  })

  it("uses the core entityType for workspace creates", async () => {
    const { database, fire } = makeDatabase()
    const { queue, enqueued } = makeQueue()

    const detector = createChangeDetector({ database: database as any, changeQueue: queue })
    detector.start()

    fire("workspaces", "creating", "w1", {
      id: "w1",
      name: "W1",
      updatedAt: "2026-07-15T08:00:00.000Z",
    })

    await vi.waitFor(() => expect(enqueued).toHaveLength(1))
    expect(enqueued[0]?.entityType).toBe("workspace")
    expect(enqueued[0]?.scope).toBe("core")
    expect(enqueued[0]?.recordKey).toBe("w1")
  })

  it("queues a hook-triggered plugin change after its source transaction completes", async () => {
    const databaseName = `change-detector-${crypto.randomUUID()}`
    const database = createTaboraDatabase(databaseName)
    const queue = createLocalChangeQueue(createSyncQueueRepository(database))
    const detector = createChangeDetector({ database, changeQueue: queue })
    detector.start()

    await database.plugins.put({
      id: "official.widgets.todo",
      version: "1.0.0",
      source: "builtin",
      enabled: true,
      status: "active",
      installedAt: "2026-07-29T00:00:00.000Z",
      updatedAt: "2026-07-29T00:00:00.000Z",
      manifest: {},
      grantedPermissions: [],
    } as any)

    await vi.waitFor(async () => {
      const pending = await queue.getPending()
      expect(pending).toHaveLength(1)
      expect(pending[0]).toMatchObject({
        scope: "core",
        entityType: "plugin",
        recordKey: "official.widgets.todo",
      })
    })

    database.close()
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase(databaseName)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  })

  it("does not queue a change when its source transaction rolls back", async () => {
    const databaseName = `change-detector-rollback-${crypto.randomUUID()}`
    const database = createTaboraDatabase(databaseName)
    const queue = createLocalChangeQueue(createSyncQueueRepository(database))
    const detector = createChangeDetector({ database, changeQueue: queue })
    detector.start()

    await expect(
      database.transaction("rw", database.plugins, async () => {
        await database.plugins.put({
          id: "official.widgets.todo",
          version: "1.0.0",
          source: "builtin",
          enabled: true,
          status: "active",
          installedAt: "2026-07-29T00:00:00.000Z",
          updatedAt: "2026-07-29T00:00:00.000Z",
          manifest: {},
          grantedPermissions: [],
        } as any)
        throw new Error("force rollback")
      }),
    ).rejects.toThrow("force rollback")

    await new Promise((resolve) => setTimeout(resolve, 20))
    await expect(queue.getPending()).resolves.toEqual([])

    database.close()
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase(databaseName)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  })
})
