import type { TaboraDatabase } from "./database"

export type PluginDataRecordScope = {
  workspaceId?: string
  instanceId?: string
}

export type PluginDataRecord<T = unknown> = PluginDataRecordScope & {
  id: string
  value: T
  updatedAt: string
}

export type PluginDataRecordRepository = {
  get<T = unknown>(
    pluginId: string,
    collection: string,
    recordId: string,
    scope?: PluginDataRecordScope,
  ): Promise<PluginDataRecord<T> | undefined>
  list<T = unknown>(
    pluginId: string,
    collection: string,
    scope?: PluginDataRecordScope,
  ): Promise<Array<PluginDataRecord<T>>>
  save<T = unknown>(
    pluginId: string,
    collection: string,
    record: PluginDataRecord<T>,
  ): Promise<void>
  remove(
    pluginId: string,
    collection: string,
    recordId: string,
    scope?: PluginDataRecordScope,
  ): Promise<void>
}

export type PluginDataRepository = {
  get<T = unknown>(pluginId: string, key: string): Promise<T | undefined>
  getAll<T = unknown>(pluginId: string): Promise<T[]>
  save<T = unknown>(pluginId: string, key: string, value: T): Promise<void>
  remove(pluginId: string, key: string): Promise<void>
  getByWorkspace<T = unknown>(
    pluginId: string,
    workspaceId: string,
    key: string,
  ): Promise<T | undefined>
  getAllByWorkspace<T = unknown>(pluginId: string, workspaceId: string): Promise<T[]>
  saveForWorkspace<T = unknown>(
    pluginId: string,
    workspaceId: string,
    key: string,
    value: T,
  ): Promise<void>
  removeForWorkspace(pluginId: string, workspaceId: string, key: string): Promise<void>
  removeByWorkspace(workspaceId: string): Promise<void>
  getByInstance<T = unknown>(
    pluginId: string,
    instanceId: string,
    key: string,
  ): Promise<T | undefined>
  getAllByInstance<T = unknown>(pluginId: string, instanceId: string): Promise<T[]>
  saveForInstance<T = unknown>(
    pluginId: string,
    instanceId: string,
    key: string,
    value: T,
  ): Promise<void>
  removeForInstance(pluginId: string, instanceId: string, key: string): Promise<void>
  /** Record-oriented API for explicitly declared sync collections. */
  records?: PluginDataRecordRepository
}

export function createPluginDataRepository(database: TaboraDatabase): PluginDataRepository {
  function idFor(...parts: string[]): string {
    return parts.map(encodeURIComponent).join(":")
  }

  function idForWorkspace(pluginId: string, key: string, workspaceId: string): string {
    return idFor(pluginId, key, "ws", workspaceId)
  }

  function idForInstance(pluginId: string, key: string, instanceId: string): string {
    return idFor(pluginId, key, "inst", instanceId)
  }

  function idForRecord(
    pluginId: string,
    collection: string,
    recordId: string,
    scope: PluginDataRecordScope = {},
  ): string {
    if (scope.instanceId)
      return idFor(pluginId, "collection", collection, recordId, "inst", scope.instanceId)
    if (scope.workspaceId)
      return idFor(pluginId, "collection", collection, recordId, "ws", scope.workspaceId)
    return idFor(pluginId, "collection", collection, recordId)
  }

  function matchesScope(
    row: { workspaceId?: string; instanceId?: string },
    scope: PluginDataRecordScope = {},
  ): boolean {
    return row.workspaceId === scope.workspaceId && row.instanceId === scope.instanceId
  }

  const records: PluginDataRecordRepository = {
    async get<T = unknown>(
      pluginId: string,
      collection: string,
      recordId: string,
      scope: PluginDataRecordScope = {},
    ) {
      const row = await database.pluginData.get(idForRecord(pluginId, collection, recordId, scope))
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
      const rows = await database.pluginData
        .where("[pluginId+collection]")
        .equals([pluginId, collection])
        .and((row) => Boolean(row.recordId) && matchesScope(row, scope))
        .toArray()
      return rows.map((row) => ({
        id: row.recordId!,
        value: row.value as T,
        updatedAt: row.updatedAt,
        ...(row.workspaceId ? { workspaceId: row.workspaceId } : {}),
        ...(row.instanceId ? { instanceId: row.instanceId } : {}),
      }))
    },
    async save(pluginId, collection, record) {
      await database.pluginData.put({
        id: idForRecord(pluginId, collection, record.id, record),
        pluginId,
        collection,
        recordId: record.id,
        key: `collection:${collection}`,
        value: record.value,
        updatedAt: record.updatedAt,
        ...(record.workspaceId ? { workspaceId: record.workspaceId } : {}),
        ...(record.instanceId ? { instanceId: record.instanceId } : {}),
      })
    },
    async remove(pluginId, collection, recordId, scope = {}) {
      await database.pluginData.delete(idForRecord(pluginId, collection, recordId, scope))
    },
  }

  return {
    async get<T = unknown>(pluginId: string, key: string): Promise<T | undefined> {
      const row = await database.pluginData.get(idFor(pluginId, key))
      return row?.value as T | undefined
    },
    async getAll<T = unknown>(pluginId: string): Promise<T[]> {
      const rows = await database.pluginData.where("pluginId").equals(pluginId).toArray()
      return rows.map((r) => r.value as T)
    },
    async save(pluginId, key, value) {
      await database.pluginData.put({
        id: idFor(pluginId, key),
        pluginId,
        key,
        value,
        updatedAt: new Date().toISOString(),
      })
    },
    async remove(pluginId, key) {
      await database.pluginData.delete(idFor(pluginId, key))
    },
    async getByWorkspace<T = unknown>(
      pluginId: string,
      workspaceId: string,
      key: string,
    ): Promise<T | undefined> {
      const row = await database.pluginData.get(idForWorkspace(pluginId, key, workspaceId))
      return row?.value as T | undefined
    },
    async getAllByWorkspace<T = unknown>(pluginId: string, workspaceId: string): Promise<T[]> {
      const rows = await database.pluginData
        .where("pluginId")
        .equals(pluginId)
        .and((row) => row.workspaceId === workspaceId && !row.instanceId)
        .toArray()
      return rows.map((r) => r.value as T)
    },
    async saveForWorkspace(pluginId, workspaceId, key, value) {
      await database.pluginData.put({
        id: idForWorkspace(pluginId, key, workspaceId),
        pluginId,
        workspaceId,
        key,
        value,
        updatedAt: new Date().toISOString(),
      })
    },
    async removeForWorkspace(pluginId, workspaceId, key) {
      await database.pluginData.delete(idForWorkspace(pluginId, key, workspaceId))
    },
    async removeByWorkspace(workspaceId) {
      await database.pluginData.where("workspaceId").equals(workspaceId).delete()
    },
    async getByInstance<T = unknown>(
      pluginId: string,
      instanceId: string,
      key: string,
    ): Promise<T | undefined> {
      const row = await database.pluginData.get(idForInstance(pluginId, key, instanceId))
      return row?.value as T | undefined
    },
    async getAllByInstance<T = unknown>(pluginId: string, instanceId: string): Promise<T[]> {
      const rows = await database.pluginData
        .where("pluginId")
        .equals(pluginId)
        .and((row) => row.instanceId === instanceId)
        .toArray()
      return rows.map((r) => r.value as T)
    },
    async saveForInstance(pluginId, instanceId, key, value) {
      await database.pluginData.put({
        id: idForInstance(pluginId, key, instanceId),
        pluginId,
        instanceId,
        key,
        value,
        updatedAt: new Date().toISOString(),
      })
    },
    async removeForInstance(pluginId, instanceId, key) {
      await database.pluginData.delete(idForInstance(pluginId, key, instanceId))
    },
    records,
  }
}
