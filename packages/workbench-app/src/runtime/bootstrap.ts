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
        "commandPalette.placeholder": "搜索命令、卡片或输入 @bing 天气",
        "commandPalette.empty": "未找到匹配结果",
        "commands.openCommandPalette.title": "打开命令",
        "commands.openCommandPalette.description": "搜索命令、卡片和搜索源",
        "commands.toggleTheme.title": "切换主题",
        "commands.toggleTheme.description.toDark": "明亮 → 暗色",
        "commands.toggleTheme.description.toLight": "暗色 → 明亮",
        "commands.toggleLayout.title": "切换布局",
        "commands.toggleLayout.description.toFocus": "仪表盘 → 专注",
        "commands.toggleLayout.description.toDashboard": "专注 → 仪表盘",
        "commands.addWidget.title": "添加卡片",
        "commands.addWidget.description": "向工作台添加新卡片",
        "commands.openPluginManager.title": "打开插件管理",
        "commands.openPluginManager.description": "查看 layout / widget / theme 贡献",
        "commands.openSettings.title": "打开设置",
        "commands.openSettings.description": "配置工作台",
        "commands.openShortcuts.title": "快捷键参考",
        "commands.openShortcuts.description": "查看所有快捷键",
        "commands.openShortcuts.separator": "、",
        "commands.openShortcuts.toast": "快捷键：{{shortcuts}}、Esc",
        "layoutHost.layoutToggle.toFocus": "切换到专注",
        "layoutHost.layoutToggle.toDashboard": "切换到仪表盘",
        "layoutHost.rail.home": "分组 我的工作台",
        "layoutHost.rail.addWidget": "添加卡片",
        "layoutHost.rail.toggleTheme": "切换主题",
        "layoutHost.common.command": "命令",
        "layoutHost.common.settings": "设置",
        "layoutHost.themeTarget.light": "明亮",
        "layoutHost.themeTarget.dark": "暗色",
        "chrome.addWidget.title": "添加卡片",
        "chrome.toolbar.search": "搜索",
        "chrome.toolbar.settings": "设置",
        "chrome.toolbar.toggleThemeToDark": "切换到暗色主题",
        "chrome.toolbar.toggleThemeToLight": "切换到明亮主题",
        "chrome.settings.about.title": "关于 Tabora",
        "chrome.settings.about.description":
          "当前实现已切换到双布局工作台骨架，设置中心按固定分类组织插件设置内容。",
        "chrome.settings.about.workspaceLabel": "当前工作区：{{name}}。",
        "chrome.settings.about.enabledPluginsLabel": "已启用官方插件：{{count}}。",
        "chrome.expand.meta.settings": "实例设置",
        "chrome.expand.meta.expand": "插件展开视图",
        "chrome.expand.close.settings": "关闭实例设置",
        "chrome.expand.close.expand": "关闭展开视图",
        "chrome.expand.viewMissing": "展开视图不可用：{{viewId}}",
        "chrome.expand.footerHint": "Esc 关闭 · 双击打开 · 右键菜单",
        "chrome.modal.close": "关闭",
        "chrome.fullscreen.close": "关闭全屏视图",
        "chrome.contextMenu.current": "当前",
        "placeholders.widgetInstanceInvalid": "卡片实例无效：{{instanceId}}",
        "placeholders.searchContributionMissing": "搜索贡献未找到",
        "placeholders.searchViewUnavailable": "搜索视图不可用：{{id}}",
        "widget.addNotSupported": "当前布局不支持添加卡片",
        "widget.instanceRemoved": "实例已移除",
        "widget.focused": "已定位到对应卡片",
        "widget.expandNotSupported": "当前卡片暂不支持展开：{{title}}",
        "widget.instanceSettingsNotSupported": "当前卡片暂不支持实例设置：{{title}}",
        "widget.instanceSettings.title": "{{title}} 设置",
        "settingsHost.sidebarTitle": "设置",
        "settingsHost.group.plugins": "插件",
        "settingsHost.plugins.installed": "已安装",
        "settingsHost.title.plugins": "已安装插件",
        "settingsHost.closeAriaLabel": "关闭设置",
        "settingsHost.aboutUnavailable": "关于信息暂不可用",
        "settingsHost.emptySection": "该分类下暂无设置内容",
        "settingsHost.panelMissing": "设置面板不可用：{{panelId}}",
        "settingsHost.section.general": "通用",
        "settingsHost.section.appearance": "外观",
        "settingsHost.section.search": "搜索",
        "settingsHost.section.about": "关于",
        "widget.removeAriaLabel": "移除 {{title}}",
        "pluginView.loadFailed": "插件视图加载失败",
        "pluginView.retry": "重试",
      },
    },
    {
      locale: "en-US",
      messages: {
        "commandPalette.placeholder": "Search commands, widgets, or type @bing weather",
        "commandPalette.empty": "No results found",
        "commands.openCommandPalette.title": "Open commands",
        "commands.openCommandPalette.description": "Search commands, widgets, and search providers",
        "commands.toggleTheme.title": "Toggle theme",
        "commands.toggleTheme.description.toDark": "Light → Dark",
        "commands.toggleTheme.description.toLight": "Dark → Light",
        "commands.toggleLayout.title": "Toggle layout",
        "commands.toggleLayout.description.toFocus": "Dashboard → Focus",
        "commands.toggleLayout.description.toDashboard": "Focus → Dashboard",
        "commands.addWidget.title": "Add widget",
        "commands.addWidget.description": "Add a widget to your workbench",
        "commands.openPluginManager.title": "Open plugin manager",
        "commands.openPluginManager.description": "View layout/widget/theme contributions",
        "commands.openSettings.title": "Open settings",
        "commands.openSettings.description": "Configure workbench",
        "commands.openShortcuts.title": "Keyboard shortcuts",
        "commands.openShortcuts.description": "View all shortcuts",
        "commands.openShortcuts.separator": ", ",
        "commands.openShortcuts.toast": "Shortcuts: {{shortcuts}}, Esc",
        "layoutHost.layoutToggle.toFocus": "Switch to focus",
        "layoutHost.layoutToggle.toDashboard": "Switch to dashboard",
        "layoutHost.rail.home": "Group My workbench",
        "layoutHost.rail.addWidget": "Add widget",
        "layoutHost.rail.toggleTheme": "Toggle theme",
        "layoutHost.common.command": "Commands",
        "layoutHost.common.settings": "Settings",
        "layoutHost.themeTarget.light": "Light",
        "layoutHost.themeTarget.dark": "Dark",
        "chrome.addWidget.title": "Add widget",
        "chrome.toolbar.search": "Search",
        "chrome.toolbar.settings": "Settings",
        "chrome.toolbar.toggleThemeToDark": "Switch to dark theme",
        "chrome.toolbar.toggleThemeToLight": "Switch to light theme",
        "chrome.settings.about.title": "About Tabora",
        "chrome.settings.about.description":
          "This implementation uses a dual-layout workbench skeleton. The settings center organizes plugin settings by fixed categories.",
        "chrome.settings.about.workspaceLabel": "Workspace: {{name}}.",
        "chrome.settings.about.enabledPluginsLabel": "Enabled official plugins: {{count}}.",
        "chrome.expand.meta.settings": "Instance settings",
        "chrome.expand.meta.expand": "Expanded view",
        "chrome.expand.close.settings": "Close instance settings",
        "chrome.expand.close.expand": "Close expanded view",
        "chrome.expand.viewMissing": "Expanded view unavailable: {{viewId}}",
        "chrome.expand.footerHint": "Esc to close · Double-click to open · Right-click menu",
        "chrome.modal.close": "Close",
        "chrome.fullscreen.close": "Close fullscreen view",
        "chrome.contextMenu.current": "Current",
        "placeholders.widgetInstanceInvalid": "Invalid widget instance: {{instanceId}}",
        "placeholders.searchContributionMissing": "Search contribution not found",
        "placeholders.searchViewUnavailable": "Search view unavailable: {{id}}",
        "widget.addNotSupported": "This layout cannot add widgets",
        "widget.instanceRemoved": "Instance removed",
        "widget.focused": "Focused widget",
        "widget.expandNotSupported": "This widget does not support expand: {{title}}",
        "widget.instanceSettingsNotSupported":
          "This widget does not support instance settings: {{title}}",
        "widget.instanceSettings.title": "{{title}} Settings",
        "settingsHost.sidebarTitle": "Settings",
        "settingsHost.group.plugins": "Plugins",
        "settingsHost.plugins.installed": "Installed",
        "settingsHost.title.plugins": "Installed plugins",
        "settingsHost.closeAriaLabel": "Close settings",
        "settingsHost.aboutUnavailable": "About content unavailable",
        "settingsHost.emptySection": "No settings in this section",
        "settingsHost.panelMissing": "Settings panel unavailable: {{panelId}}",
        "settingsHost.section.general": "General",
        "settingsHost.section.appearance": "Appearance",
        "settingsHost.section.search": "Search",
        "settingsHost.section.about": "About",
        "widget.removeAriaLabel": "Remove {{title}}",
        "pluginView.loadFailed": "Plugin view failed to load",
        "pluginView.retry": "Retry",
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
