import type { HostAdapter } from "@tabora/host-adapters"
import { createPluginCatalog, type PluginCatalog } from "@tabora/orchestrator"
import { createPluginKernel, type BuiltinPlugin, type PluginKernel } from "@tabora/platform-kernel"
import {
  createInstanceRepository,
  createPluginDataRepository,
  createPluginRecordRepository,
  createTaboraDatabase,
  createWorkspaceRepository,
  type InstanceRepository,
  type PluginDataRepository,
  type PluginRecordRepository,
  type TaboraDatabase,
  type WorkspaceRepository,
} from "@tabora/storage"

export type WorkbenchRuntimeRepositories = {
  workspaceRepo: WorkspaceRepository
  instanceRepo: InstanceRepository
  pluginDataRepo: PluginDataRepository
  pluginRecordRepo: PluginRecordRepository
}

export type WorkbenchRuntimeBootstrap = {
  host: HostAdapter
  database: TaboraDatabase
  repositories: WorkbenchRuntimeRepositories
  catalog: PluginCatalog
  kernel: PluginKernel
}

export type CreateWorkbenchRuntimeBootstrapOptions = {
  host: HostAdapter
  plugins: BuiltinPlugin[]
  databaseName?: string
}

export function createWorkbenchRuntimeBootstrap(
  options: CreateWorkbenchRuntimeBootstrapOptions,
): WorkbenchRuntimeBootstrap {
  const database = createTaboraDatabase(options.databaseName)
  const workspaceRepo = createWorkspaceRepository(database)
  const instanceRepo = createInstanceRepository(database)
  const pluginDataRepo = createPluginDataRepository(database)
  const pluginRecordRepo = createPluginRecordRepository(database)
  const catalog = createPluginCatalog(options.plugins)
  const kernel = createPluginKernel({
    lifecycleStore: pluginRecordRepo,
    recordSource: "builtin",
  })

  return {
    host: options.host,
    database,
    repositories: {
      workspaceRepo,
      instanceRepo,
      pluginDataRepo,
      pluginRecordRepo,
    },
    catalog,
    kernel,
  }
}
