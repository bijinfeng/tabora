import type { PluginInstance, PluginRecord, Workspace } from "@tabora/plugin-api"
import {
  migrateWorkspaceContributionRefs,
  type PluginDataRow,
  type StorageAdapter,
} from "@tabora/host-adapters"

type PluginDataRecordScope = { workspaceId?: string; instanceId?: string }

type LocalStoreCollection = "plugin-data" | "plugin-instances" | "plugin-records" | "workspaces"

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

function pluginDataRecordId(
  pluginId: string,
  collection: string,
  recordId: string,
  scope: { workspaceId?: string; instanceId?: string } = {},
): string {
  if (scope.instanceId)
    return pluginDataId([pluginId, "collection", collection, recordId, "inst", scope.instanceId])
  if (scope.workspaceId)
    return pluginDataId([pluginId, "collection", collection, recordId, "ws", scope.workspaceId])
  return pluginDataId([pluginId, "collection", collection, recordId])
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
  const normalizeWorkspace = async (
    workspace: Workspace | undefined,
  ): Promise<Workspace | undefined> => {
    if (!workspace) return undefined
    const records = await store.getAll<PluginRecord>("plugin-records")
    const migrated = migrateWorkspaceContributionRefs(
      workspace,
      records.map((record) => record.manifest),
    )
    if (migrated !== workspace) await store.save("workspaces", migrated.id, migrated)
    return migrated
  }

  return {
    repositories: {
      workspaceRepo: {
        async get(id) {
          return normalizeWorkspace(await store.get<Workspace>("workspaces", id))
        },
        async getAll() {
          const workspaces = await store.getAll<Workspace>("workspaces")
          const normalized = await Promise.all(workspaces.map(normalizeWorkspace))
          return normalized.filter((workspace): workspace is Workspace => Boolean(workspace))
        },
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
        records: {
          async get<T = unknown>(
            pluginId: string,
            collection: string,
            recordId: string,
            scope: PluginDataRecordScope = {},
          ) {
            const row = await store.get<PluginDataRow>(
              "plugin-data",
              pluginDataRecordId(pluginId, collection, recordId, scope),
            )
            if (!row || row.collection !== collection || row.recordId !== recordId) return undefined
            return {
              id: recordId,
              value: row.value as T,
              updatedAt: row.updatedAt,
              ...(row.workspaceId ? { workspaceId: row.workspaceId } : {}),
              ...(row.instanceId ? { instanceId: row.instanceId } : {}),
            }
          },
          async list<T = unknown>(
            pluginId: string,
            collection: string,
            scope: PluginDataRecordScope = {},
          ) {
            const rows = await store.getAll<PluginDataRow>("plugin-data")
            return rows
              .filter(
                (row) =>
                  row.pluginId === pluginId &&
                  row.collection === collection &&
                  Boolean(row.recordId) &&
                  row.workspaceId === scope.workspaceId &&
                  row.instanceId === scope.instanceId,
              )
              .map((row) => ({
                id: row.recordId!,
                value: row.value as T,
                updatedAt: row.updatedAt,
                ...(row.workspaceId ? { workspaceId: row.workspaceId } : {}),
                ...(row.instanceId ? { instanceId: row.instanceId } : {}),
              }))
          },
          async save(pluginId, collection, record) {
            await store.save(
              "plugin-data",
              pluginDataRecordId(pluginId, collection, record.id, record),
              {
                id: pluginDataRecordId(pluginId, collection, record.id, record),
                pluginId,
                collection,
                recordId: record.id,
                key: `collection:${collection}`,
                value: record.value,
                updatedAt: record.updatedAt,
                ...(record.workspaceId ? { workspaceId: record.workspaceId } : {}),
                ...(record.instanceId ? { instanceId: record.instanceId } : {}),
              },
            )
          },
          remove(pluginId, collection, recordId, scope = {}) {
            return store.remove(
              "plugin-data",
              pluginDataRecordId(pluginId, collection, recordId, scope),
            )
          },
        },
      },
      pluginRecordRepo: {
        get: (id) => store.get<PluginRecord>("plugin-records", id),
        getAll: () => store.getAll<PluginRecord>("plugin-records"),
        save: (record) => store.save("plugin-records", record.id, record),
        remove: (id) => store.remove("plugin-records", id),
      },
    },
  }
}
