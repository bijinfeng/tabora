import type { TaboraDatabase } from "./database"
import { createTaboraDatabase } from "./database"
import { createInstanceRepository, type InstanceRepository } from "./instanceRepository"
import { createPluginDataRepository, type PluginDataRepository } from "./pluginDataRepository"
import { createPluginRecordRepository, type PluginRecordRepository } from "./pluginRecordRepository"
import { createSyncMetaRepository, type SyncMetaRepository } from "./syncMetaRepository"
import { createSyncQueueRepository, type SyncQueueRepository } from "./syncQueueRepository"
import {
  createWorkspaceSnapshotRepository,
  type WorkspaceSnapshotRepository,
} from "./workspaceSnapshotRepository"
import { createWorkspaceRepository, type WorkspaceRepository } from "./workspaceRepository"

/** Core local persistence available to every host. It deliberately has no sync state. */
export type StorageRepositories = {
  workspaceRepo: WorkspaceRepository
  instanceRepo: InstanceRepository
  pluginDataRepo: PluginDataRepository
  pluginRecordRepo: PluginRecordRepository
  workspaceSnapshotRepo: WorkspaceSnapshotRepository
}

/** Optional infrastructure constructed only by a host that enables account sync. */
export type SyncStorageRepositories = {
  syncQueueRepo: SyncQueueRepository
  syncMetaRepo: SyncMetaRepository
}

export type StorageAdapter = {
  database?: TaboraDatabase
  repositories: StorageRepositories
  sync?: SyncStorageRepositories
}

export function createWebStorageAdapter(
  name?: string,
  options: { enableSync?: boolean } = {},
): StorageAdapter {
  const database = createTaboraDatabase(name)
  const adapter: StorageAdapter = {
    database,
    repositories: {
      workspaceRepo: createWorkspaceRepository(database),
      instanceRepo: createInstanceRepository(database),
      pluginDataRepo: createPluginDataRepository(database),
      pluginRecordRepo: createPluginRecordRepository(database),
      workspaceSnapshotRepo: createWorkspaceSnapshotRepository(database),
    },
  }
  if (options.enableSync) {
    adapter.sync = {
      syncQueueRepo: createSyncQueueRepository(database),
      syncMetaRepo: createSyncMetaRepository(database),
    }
  }
  return adapter
}
