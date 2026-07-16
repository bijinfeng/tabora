import type { TaboraDatabase } from "@tabora/storage"
import type { LocalChangeQueue } from "./localChangeQueue"

export type ChangeDetectorConfig = {
  database: TaboraDatabase
  changeQueue: LocalChangeQueue
}

/**
 * Change detector - monitors Dexie tables and generates sync changes.
 * Uses Dexie hooks to capture creates/updates/deletes.
 */
export function createChangeDetector(config: ChangeDetectorConfig) {
  const { database, changeQueue } = config

  function start() {
    // Monitor workspaces table
    database.workspaces.hook("creating", (_primKey: any, obj: any) => {
      void changeQueue.enqueue({
        scope: "core",
        entityType: "workspace",
        recordKey: obj.id,
        payload: obj,
        clientUpdatedAt: obj.updatedAt ?? new Date().toISOString(),
        deleted: false,
      })
    })

    database.workspaces.hook("updating", (mods: any, _primKey: any, obj: any) => {
      void changeQueue.enqueue({
        scope: "core",
        entityType: "workspace",
        recordKey: obj.id,
        payload: { ...obj, ...mods },
        clientUpdatedAt: mods.updatedAt ?? new Date().toISOString(),
        deleted: false,
      })
    })

    database.workspaces.hook("deleting", (_primKey: any, obj: any) => {
      void changeQueue.enqueue({
        scope: "core",
        entityType: "workspace",
        recordKey: obj.id,
        payload: obj,
        clientUpdatedAt: new Date().toISOString(),
        deleted: true,
      })
    })

    // Monitor pluginInstances table
    database.pluginInstances.hook("creating", (_primKey: any, obj: any) => {
      void changeQueue.enqueue({
        scope: "core",
        entityType: "pluginInstance",
        recordKey: obj.id,
        payload: obj,
        clientUpdatedAt: obj.createdAt ?? new Date().toISOString(),
        deleted: false,
      })
    })

    database.pluginInstances.hook("updating", (mods: any, _primKey: any, obj: any) => {
      void changeQueue.enqueue({
        scope: "core",
        entityType: "pluginInstance",
        recordKey: obj.id,
        payload: { ...obj, ...mods },
        clientUpdatedAt: new Date().toISOString(),
        deleted: false,
      })
    })

    database.pluginInstances.hook("deleting", (_primKey: any, obj: any) => {
      void changeQueue.enqueue({
        scope: "core",
        entityType: "pluginInstance",
        recordKey: obj.id,
        payload: obj,
        clientUpdatedAt: new Date().toISOString(),
        deleted: true,
      })
    })

    // Monitor plugins table
    database.plugins.hook("creating", (_primKey: any, obj: any) => {
      void changeQueue.enqueue({
        scope: "core",
        entityType: "plugin",
        recordKey: obj.id,
        payload: obj,
        clientUpdatedAt: obj.installedAt ?? new Date().toISOString(),
        deleted: false,
      })
    })

    database.plugins.hook("updating", (mods: any, _primKey: any, obj: any) => {
      void changeQueue.enqueue({
        scope: "core",
        entityType: "plugin",
        recordKey: obj.id,
        payload: { ...obj, ...mods },
        clientUpdatedAt: new Date().toISOString(),
        deleted: false,
      })
    })

    database.plugins.hook("deleting", (_primKey: any, obj: any) => {
      void changeQueue.enqueue({
        scope: "core",
        entityType: "plugin",
        recordKey: obj.id,
        payload: obj,
        clientUpdatedAt: new Date().toISOString(),
        deleted: true,
      })
    })

    // Monitor pluginData table (plugin-scope changes)
    // NOTE: entityType is the literal "pluginData" (the backend enum value); the
    // originating pluginId stays in the payload (obj.pluginId), so no info is lost.
    database.pluginData.hook("creating", (_primKey: any, obj: any) => {
      void changeQueue.enqueue({
        scope: "plugin",
        entityType: "pluginData",
        recordKey: obj.id,
        payload: obj,
        clientUpdatedAt: obj.updatedAt ?? new Date().toISOString(),
        deleted: false,
      })
    })

    database.pluginData.hook("updating", (mods: any, _primKey: any, obj: any) => {
      void changeQueue.enqueue({
        scope: "plugin",
        entityType: "pluginData",
        recordKey: obj.id,
        payload: { ...obj, ...mods },
        clientUpdatedAt: mods.updatedAt ?? new Date().toISOString(),
        deleted: false,
      })
    })

    database.pluginData.hook("deleting", (_primKey: any, obj: any) => {
      void changeQueue.enqueue({
        scope: "plugin",
        entityType: "pluginData",
        recordKey: obj.id,
        payload: obj,
        clientUpdatedAt: new Date().toISOString(),
        deleted: true,
      })
    })
  }

  function stop() {
    // Dexie doesn't provide a clean way to unsubscribe all hooks at once
    // For now, we just leave them registered
    // In production, you might want to store unsubscribe functions and call them here
  }

  return {
    start,
    stop,
  }
}

export type ChangeDetector = ReturnType<typeof createChangeDetector>
