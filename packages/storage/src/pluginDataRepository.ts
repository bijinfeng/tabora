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

  return {
    async get(pluginId, key) {
      const row = await database.pluginData.get(idFor(pluginId, key))
      return row?.value as any
    },
    async getAll(pluginId) {
      const rows = await database.pluginData.where("pluginId").equals(pluginId).toArray()
      return rows.map((r) => r.value) as any[]
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
    async getByWorkspace(pluginId, workspaceId, key) {
      const row = await database.pluginData.get(idFor(pluginId, key, workspaceId))
      return row?.value as any
    },
    async getAllByWorkspace(pluginId, workspaceId) {
      const rows = await database.pluginData
        .where("pluginId")
        .equals(pluginId)
        .and((row) => row.workspaceId === workspaceId && !row.instanceId)
        .toArray()
      return rows.map((r) => r.value) as any[]
    },
    async saveForWorkspace(pluginId, workspaceId, key, value) {
      await database.pluginData.put({
        id: idFor(pluginId, key, workspaceId),
        pluginId,
        workspaceId,
        key,
        value,
        updatedAt: new Date().toISOString(),
      })
    },
    async removeForWorkspace(pluginId, workspaceId, key) {
      await database.pluginData.delete(idFor(pluginId, key, workspaceId))
    },
    async getByInstance(pluginId, instanceId, key) {
      const row = await database.pluginData.get(idFor(pluginId, key, instanceId))
      return row?.value as any
    },
    async getAllByInstance(pluginId, instanceId) {
      const rows = await database.pluginData
        .where("pluginId")
        .equals(pluginId)
        .and((row) => row.instanceId === instanceId)
        .toArray()
      return rows.map((r) => r.value) as any[]
    },
    async saveForInstance(pluginId, instanceId, key, value) {
      await database.pluginData.put({
        id: idFor(pluginId, key, instanceId),
        pluginId,
        instanceId,
        key,
        value,
        updatedAt: new Date().toISOString(),
      })
    },
    async removeForInstance(pluginId, instanceId, key) {
      await database.pluginData.delete(idFor(pluginId, key, instanceId))
    },
  }
}
