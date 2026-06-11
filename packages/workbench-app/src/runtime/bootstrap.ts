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
  i18n.registerMessages("tabora.shell", [
    {
      locale: "zh-CN",
      messages: {
        "commands.openCommandPalette.title": "打开命令",
        "commands.openCommandPalette.desc": "搜索命令、卡片和搜索源",
        "commands.toggleTheme.title": "切换主题",
        "commands.toggleTheme.descToLight": "暗色 → 明亮",
        "commands.toggleTheme.descToDark": "明亮 → 暗色",
        "commands.toggleLayout.title": "切换布局",
        "commands.toggleLayout.descToFocus": "仪表盘 → 专注",
        "commands.toggleLayout.descToDashboard": "专注 → 仪表盘",
        "commands.addWidget.title": "添加卡片",
        "commands.addWidget.desc": "向工作台添加新卡片",
        "commands.openPluginManager.title": "打开插件管理",
        "commands.openPluginManager.desc": "查看 layout / widget / theme 贡献",
        "commands.openSettings.title": "打开设置",
        "commands.openSettings.desc": "配置工作台",
        "commands.openShortcuts.title": "快捷键参考",
        "commands.openShortcuts.desc": "查看所有快捷键",
        "toast.shortcuts": "快捷键：{{list}}、Esc",
      },
    },
    {
      locale: "en-US",
      messages: {
        "commands.openCommandPalette.title": "Open command palette",
        "commands.openCommandPalette.desc": "Search commands, widgets, and providers",
        "commands.toggleTheme.title": "Toggle theme",
        "commands.toggleTheme.descToLight": "Dark → Light",
        "commands.toggleTheme.descToDark": "Light → Dark",
        "commands.toggleLayout.title": "Toggle layout",
        "commands.toggleLayout.descToFocus": "Dashboard → Focus",
        "commands.toggleLayout.descToDashboard": "Focus → Dashboard",
        "commands.addWidget.title": "Add widget",
        "commands.addWidget.desc": "Add a new widget to the workbench",
        "commands.openPluginManager.title": "Open plugins",
        "commands.openPluginManager.desc": "View layout / widget / theme contributions",
        "commands.openSettings.title": "Open settings",
        "commands.openSettings.desc": "Configure the workbench",
        "commands.openShortcuts.title": "Shortcut reference",
        "commands.openShortcuts.desc": "View all shortcuts",
        "toast.shortcuts": "Shortcuts: {{list}}, Esc",
      },
    },
  ])
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
