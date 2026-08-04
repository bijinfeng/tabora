import type { PluginInstance, PluginRecord, Workspace } from "@tabora/plugin-api"
import type {
  PluginDataRow,
  StorageAdapter,
  SyncMetaRow,
  SyncQueueRow,
  WorkspaceSnapshot,
} from "@tabora/host-adapters"

type LocalStoreCollection =
  | "plugin-data"
  | "plugin-instances"
  | "plugin-records"
  | "sync-meta"
  | "sync-queue"
  | "workspace-snapshots"
  | "workspaces"

type FetchLike = typeof fetch

function encodeIdPart(value: string): string {
  return encodeURIComponent(value)
}

function pluginDataId(parts: string[]): string {
  return parts.map(encodeIdPart).join(":")
}

function pluginDataWorkspaceId(pluginId: string, key: string, workspaceId: string): string {
  return pluginDataId([pluginId, key, "ws", workspaceId])
}

function pluginDataInstanceId(pluginId: string, key: string, instanceId: string): string {
  return pluginDataId([pluginId, key, "inst", instanceId])
}

function pluginDataGlobalId(pluginId: string, key: string): string {
  return pluginDataId([pluginId, key])
}

function createLocalStoreClient(apiBaseUrl: string, fetcher: FetchLike) {
  const baseUrl = apiBaseUrl.replace(/\/$/, "")

  async function request<T>(path: string, init?: RequestInit): Promise<T | undefined> {
    const response = await fetcher(`${baseUrl}${path}`, init)
    if (response.status === 404) return undefined
    if (!response.ok) {
      throw new Error(`FNOS local storage request failed: ${response.status}`)
    }
    if (response.status === 204) return undefined
    return (await response.json()) as T
  }

  return {
    async get<T>(collection: LocalStoreCollection, id: string): Promise<T | undefined> {
      const result = await request<{ value: T }>(
        `/api/local-store/${collection}/${encodeURIComponent(id)}`,
      )
      return result?.value
    },
    async getAll<T>(collection: LocalStoreCollection): Promise<T[]> {
      const result = await request<{ values: T[] }>(`/api/local-store/${collection}`)
      return result?.values ?? []
    },
    async save<T>(collection: LocalStoreCollection, id: string, value: T): Promise<void> {
      await request(`/api/local-store/${collection}/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ value }),
      })
    },
    async remove(collection: LocalStoreCollection, id: string): Promise<void> {
      await request(`/api/local-store/${collection}/${encodeURIComponent(id)}`, {
        method: "DELETE",
      })
    },
  }
}

export function createFnosStorageAdapter(
  apiBaseUrl: string,
  fetcher: FetchLike = fetch,
): StorageAdapter {
  const store = createLocalStoreClient(apiBaseUrl, fetcher)
  const getQueueByRecord = async (scope: string, entityType: string, recordKey: string) => {
    const rows = await store.getAll<SyncQueueRow>("sync-queue")
    return rows.find(
      (row) => row.scope === scope && row.entityType === entityType && row.recordKey === recordKey,
    )
  }

  return {
    repositories: {
      workspaceRepo: {
        get: (id) => store.get<Workspace>("workspaces", id),
        getAll: () => store.getAll<Workspace>("workspaces"),
        save: (workspace) => store.save("workspaces", workspace.id, workspace),
        remove: (id) => store.remove("workspaces", id),
      },
      instanceRepo: {
        getAll: () => store.getAll<PluginInstance>("plugin-instances"),
        async getByWorkspace(workspaceId) {
          const instances = await store.getAll<PluginInstance>("plugin-instances")
          return instances.filter((instance) => instance.workspaceId === workspaceId)
        },
        async getByRegion(workspaceId, regionId) {
          const instances = await store.getAll<PluginInstance>("plugin-instances")
          return instances
            .filter(
              (instance) => instance.workspaceId === workspaceId && instance.regionId === regionId,
            )
            .sort((left, right) => {
              if (!left.grid && !right.grid) return left.createdAt.localeCompare(right.createdAt)
              if (!left.grid) return 1
              if (!right.grid) return -1
              return left.grid.y - right.grid.y || left.grid.x - right.grid.x
            })
        },
        get: (id) => store.get<PluginInstance>("plugin-instances", id),
        save: (instance) => store.save("plugin-instances", instance.id, instance),
        async removeByWorkspace(workspaceId) {
          const instances = await store.getAll<PluginInstance>("plugin-instances")
          await Promise.all(
            instances
              .filter((instance) => instance.workspaceId === workspaceId)
              .map((instance) => store.remove("plugin-instances", instance.id)),
          )
        },
        remove: (id) => store.remove("plugin-instances", id),
      },
      pluginDataRepo: {
        async get<T = unknown>(pluginId: string, key: string): Promise<T | undefined> {
          const row = await store.get<PluginDataRow>(
            "plugin-data",
            pluginDataGlobalId(pluginId, key),
          )
          return row?.value as T | undefined
        },
        async getAll<T = unknown>(pluginId: string): Promise<T[]> {
          const rows = await store.getAll<PluginDataRow>("plugin-data")
          return rows
            .filter((row) => row.pluginId === pluginId && !row.workspaceId && !row.instanceId)
            .map((row) => row.value as T)
        },
        async save<T = unknown>(pluginId: string, key: string, value: T): Promise<void> {
          const id = pluginDataGlobalId(pluginId, key)
          await store.save("plugin-data", id, {
            id,
            pluginId,
            key,
            value,
            updatedAt: new Date().toISOString(),
          })
        },
        remove: (pluginId, key) => store.remove("plugin-data", pluginDataGlobalId(pluginId, key)),
        async getByWorkspace<T = unknown>(
          pluginId: string,
          workspaceId: string,
          key: string,
        ): Promise<T | undefined> {
          const row = await store.get<PluginDataRow>(
            "plugin-data",
            pluginDataWorkspaceId(pluginId, key, workspaceId),
          )
          return row?.value as T | undefined
        },
        async getAllByWorkspace<T = unknown>(pluginId: string, workspaceId: string): Promise<T[]> {
          const rows = await store.getAll<PluginDataRow>("plugin-data")
          return rows
            .filter(
              (row) =>
                row.pluginId === pluginId && row.workspaceId === workspaceId && !row.instanceId,
            )
            .map((row) => row.value as T)
        },
        async saveForWorkspace(pluginId, workspaceId, key, value): Promise<void> {
          const id = pluginDataWorkspaceId(pluginId, key, workspaceId)
          await store.save("plugin-data", id, {
            id,
            pluginId,
            workspaceId,
            key,
            value,
            updatedAt: new Date().toISOString(),
          })
        },
        removeForWorkspace: (pluginId, workspaceId, key) =>
          store.remove("plugin-data", pluginDataWorkspaceId(pluginId, key, workspaceId)),
        async removeByWorkspace(workspaceId) {
          const rows = await store.getAll<PluginDataRow>("plugin-data")
          await Promise.all(
            rows
              .filter((row) => row.workspaceId === workspaceId)
              .map((row) => store.remove("plugin-data", row.id)),
          )
        },
        async getByInstance<T = unknown>(
          pluginId: string,
          instanceId: string,
          key: string,
        ): Promise<T | undefined> {
          const row = await store.get<PluginDataRow>(
            "plugin-data",
            pluginDataInstanceId(pluginId, key, instanceId),
          )
          return row?.value as T | undefined
        },
        async getAllByInstance<T = unknown>(pluginId: string, instanceId: string): Promise<T[]> {
          const rows = await store.getAll<PluginDataRow>("plugin-data")
          return rows
            .filter((row) => row.pluginId === pluginId && row.instanceId === instanceId)
            .map((row) => row.value as T)
        },
        async saveForInstance(pluginId, instanceId, key, value): Promise<void> {
          const id = pluginDataInstanceId(pluginId, key, instanceId)
          await store.save("plugin-data", id, {
            id,
            pluginId,
            instanceId,
            key,
            value,
            updatedAt: new Date().toISOString(),
          })
        },
        removeForInstance: (pluginId, instanceId, key) =>
          store.remove("plugin-data", pluginDataInstanceId(pluginId, key, instanceId)),
      },
      pluginRecordRepo: {
        get: (id) => store.get<PluginRecord>("plugin-records", id),
        getAll: () => store.getAll<PluginRecord>("plugin-records"),
        save: (record) => store.save("plugin-records", record.id, record),
        remove: (id) => store.remove("plugin-records", id),
      },
      workspaceSnapshotRepo: {
        save: (snapshot) => store.save("workspace-snapshots", snapshot.id, snapshot),
        async getLast(workspaceId) {
          const snapshots = await store.getAll<WorkspaceSnapshot>("workspace-snapshots")
          return snapshots
            .filter((snapshot) => snapshot.workspaceId === workspaceId)
            .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
            .at(-1)
        },
      },
      syncQueueRepo: {
        async add(item) {
          const id = crypto.randomUUID()
          await store.save("sync-queue", id, { ...item, id })
          return id
        },
        get: (id) => store.get<SyncQueueRow>("sync-queue", id),
        async getAllPending() {
          const rows = await store.getAll<SyncQueueRow>("sync-queue")
          return rows
            .filter((row) => row.status === "pending")
            .sort((left, right) => left.queuedAt.localeCompare(right.queuedAt))
        },
        getByRecord: getQueueByRecord,
        async updateStatus(id, status, updates) {
          const current = await store.get<SyncQueueRow>("sync-queue", id)
          if (!current) return
          await store.save("sync-queue", id, { ...current, ...updates, status })
        },
        remove: (id) => store.remove("sync-queue", id),
        async removeByRecord(scope, entityType, recordKey) {
          const row = await getQueueByRecord(scope, entityType, recordKey)
          if (row) await store.remove("sync-queue", row.id)
        },
        async clear() {
          const rows = await store.getAll<SyncQueueRow>("sync-queue")
          await Promise.all(rows.map((row) => store.remove("sync-queue", row.id)))
        },
        async count() {
          return (await store.getAll<SyncQueueRow>("sync-queue")).length
        },
      },
      syncMetaRepo: {
        async get(key) {
          return (await store.get<SyncMetaRow>("sync-meta", key))?.value
        },
        async set(key, value) {
          await store.save("sync-meta", key, { key, value })
        },
        remove: (key) => store.remove("sync-meta", key),
        async clear() {
          const rows = await store.getAll<SyncMetaRow>("sync-meta")
          await Promise.all(rows.map((row) => store.remove("sync-meta", row.key)))
        },
        getAll: () => store.getAll<SyncMetaRow>("sync-meta"),
      },
    },
  }
}
