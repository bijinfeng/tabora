import type { HostAdapter } from "@tabora/host-adapters"
import { createPluginCatalog, type PluginCatalog } from "@tabora/orchestrator"
import {
  createPluginKernel,
  loadBuiltinPlugins,
  type BuiltinPlugin,
  type PluginLoadRejectedRecord,
  type PluginKernel,
} from "@tabora/platform-kernel"
import {
  createInstanceRepository,
  createPluginDataRepository,
  createPluginRecordRepository,
  createTaboraDatabase,
  createWorkspaceRepository,
  createWorkspaceSnapshotRepository,
  type InstanceRepository,
  type PluginDataRepository,
  type PluginRecordRepository,
  type StorageAdapter,
  type TaboraDatabase,
  type WorkspaceRepository,
  type WorkspaceSnapshotRepository,
} from "@tabora/storage"

export type WorkbenchRuntimeRepositories = {
  workspaceRepo: WorkspaceRepository
  instanceRepo: InstanceRepository
  pluginDataRepo: PluginDataRepository
  pluginRecordRepo: PluginRecordRepository
  workspaceSnapshotRepo: WorkspaceSnapshotRepository
}

export type WorkbenchRuntimeBootstrap = {
  host: HostAdapter
  database: TaboraDatabase
  repositories: WorkbenchRuntimeRepositories
  catalog: PluginCatalog
  kernel: PluginKernel
  plugins: BuiltinPlugin[]
  rejectedPlugins: PluginLoadRejectedRecord[]
}

export type CreateWorkbenchRuntimeBootstrapOptions = {
  host: HostAdapter
  plugins: BuiltinPlugin[]
  databaseName?: string
  storageAdapter?: StorageAdapter
}

export function createWorkbenchRuntimeBootstrap(
  options: CreateWorkbenchRuntimeBootstrapOptions,
): WorkbenchRuntimeBootstrap {
  const storageAdapter = options.storageAdapter
  const database = storageAdapter?.database ?? createTaboraDatabase(options.databaseName)
  const repositories = storageAdapter?.repositories ?? {
    workspaceRepo: createWorkspaceRepository(database),
    instanceRepo: createInstanceRepository(database),
    pluginDataRepo: createPluginDataRepository(database),
    pluginRecordRepo: createPluginRecordRepository(database),
    workspaceSnapshotRepo: createWorkspaceSnapshotRepository(database),
  }
  const { pluginRecordRepo } = repositories
  const loadResult = loadBuiltinPlugins(options.plugins)
  const loadedPlugins = loadResult.loaded.map((record) => record.plugin)
  const catalog = createPluginCatalog(loadedPlugins)
  const kernel = createPluginKernel({
    lifecycleStore: pluginRecordRepo,
    recordSource: "builtin",
    hostPlatform: options.host.platform,
    hostCapabilities: options.host.capabilities,
  })

  return {
    host: options.host,
    database,
    repositories,
    catalog,
    kernel,
    plugins: loadedPlugins,
    rejectedPlugins: loadResult.rejected,
  }
}
