import type { TaboraDatabase } from "./database"
import { createTaboraDatabase } from "./database"
import { createInstanceRepository, type InstanceRepository } from "./instanceRepository"
import { createPluginDataRepository, type PluginDataRepository } from "./pluginDataRepository"
import { createPluginRecordRepository, type PluginRecordRepository } from "./pluginRecordRepository"
import { createWorkspaceRepository, type WorkspaceRepository } from "./workspaceRepository"

export type StorageRepositories = {
  workspaceRepo: WorkspaceRepository
  instanceRepo: InstanceRepository
  pluginDataRepo: PluginDataRepository
  pluginRecordRepo: PluginRecordRepository
}

export type StorageAdapter = {
  database: TaboraDatabase
  repositories: StorageRepositories
}

export function createWebStorageAdapter(name?: string): StorageAdapter {
  const database = createTaboraDatabase(name)
  return {
    database,
    repositories: {
      workspaceRepo: createWorkspaceRepository(database),
      instanceRepo: createInstanceRepository(database),
      pluginDataRepo: createPluginDataRepository(database),
      pluginRecordRepo: createPluginRecordRepository(database),
    },
  }
}
