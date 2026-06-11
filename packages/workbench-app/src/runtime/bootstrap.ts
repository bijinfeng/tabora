import type { HostAdapter } from "@tabora/host-adapters"
import { createPluginCatalog, type PluginCatalog } from "@tabora/orchestrator"
import type { WorkspacePresetContribution } from "@tabora/plugin-api"
import {
  createPluginKernel,
  loadBuiltinPlugins,
  type BuiltinPlugin,
  type PluginLoadRejectedRecord,
  type PluginKernel,
  type ResolvedPluginStyle,
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

import type { WorkbenchShellConfig } from "../shared/shellConfig"
import { createWorkbenchI18nStore, type WorkbenchI18nStore } from "../i18n"

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
  i18n: WorkbenchI18nStore
  plugins: BuiltinPlugin[]
  defaultWorkspacePreset: WorkspacePresetContribution
  shellConfig: WorkbenchShellConfig
  pluginStyles: ResolvedPluginStyle[]
  rejectedPlugins: PluginLoadRejectedRecord[]
}

export type CreateWorkbenchRuntimeBootstrapOptions = {
  host: HostAdapter
  plugins: BuiltinPlugin[]
  defaultWorkspacePreset: WorkspacePresetContribution
  shellConfig: WorkbenchShellConfig
  databaseName?: string
  storageAdapter?: StorageAdapter
}

export function createWorkbenchRuntimeBootstrap(
  options: CreateWorkbenchRuntimeBootstrapOptions,
): WorkbenchRuntimeBootstrap {
  const storageAdapter = options.storageAdapter
  const database = storageAdapter?.database ?? createTaboraDatabase(options.databaseName)
  const i18n = createWorkbenchI18nStore()
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
  const pluginStyles = loadResult.loaded.flatMap((record) => record.styles)
  const catalog = createPluginCatalog(loadedPlugins)
  const kernel = createPluginKernel({
    lifecycleStore: pluginRecordRepo,
    recordSource: "builtin",
    hostPlatform: options.host.platform,
    hostCapabilities: options.host.capabilities,
    i18n,
  })

  return {
    host: options.host,
    database,
    repositories,
    catalog,
    kernel,
    i18n,
    plugins: loadedPlugins,
    defaultWorkspacePreset: options.defaultWorkspacePreset,
    shellConfig: options.shellConfig,
    pluginStyles,
    rejectedPlugins: loadResult.rejected,
  }
}
