import type { TaboraDatabase } from "./database"

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
}

export function createPluginDataRepository(database: TaboraDatabase): PluginDataRepository {
  function idFor(...parts: string[]): string {
    return parts.map(encodeURIComponent).join(":")
  }

  function idForWorkspace(pluginId: string, key: string, workspaceId: string): string {
    return idFor(pluginId, key, "ws", workspaceId)
  }

  function legacyIdForWorkspace(pluginId: string, key: string, workspaceId: string): string {
    return idFor(pluginId, key, workspaceId)
  }

  function idForInstance(pluginId: string, key: string, instanceId: string): string {
    return idFor(pluginId, key, "inst", instanceId)
  }

  function legacyIdForInstance(pluginId: string, key: string, instanceId: string): string {
    return idFor(pluginId, key, instanceId)
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
      const row =
        (await database.pluginData.get(idForWorkspace(pluginId, key, workspaceId))) ??
        (await database.pluginData.get(legacyIdForWorkspace(pluginId, key, workspaceId)))
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
      await database.pluginData.delete(legacyIdForWorkspace(pluginId, key, workspaceId))
    },
    async removeByWorkspace(workspaceId) {
      await database.pluginData.where("workspaceId").equals(workspaceId).delete()
    },
    async getByInstance<T = unknown>(
      pluginId: string,
      instanceId: string,
      key: string,
    ): Promise<T | undefined> {
      const row =
        (await database.pluginData.get(idForInstance(pluginId, key, instanceId))) ??
        (await database.pluginData.get(legacyIdForInstance(pluginId, key, instanceId)))
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
      await database.pluginData.delete(legacyIdForInstance(pluginId, key, instanceId))
    },
  }
}
