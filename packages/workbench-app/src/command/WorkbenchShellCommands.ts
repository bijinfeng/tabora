import type { CommandContribution, KeybindingContribution } from "@tabora/plugin-api"
import {
  createCommandPaletteCommands,
  createShortcutRegistry,
  type CommandActionMap,
  type ShortcutRegistry,
} from "@tabora/orchestrator"

import {
  resolveWorkbenchLayoutToggleTarget,
  resolveWorkbenchThemeToggleTarget,
  type WorkbenchShellConfig,
} from "../shared/shellConfig"
import { createCommandExecutor, type CommandExecutionContext } from "../shared/shellHelpers"
import { currentShortcutPlatform, shortcutDisplay } from "../shared/WorkbenchShellUtils"

export type WorkbenchShellCommandModelsOptions = {
  isDark: () => boolean
  activeLayoutId: () => string
  shellConfig: WorkbenchShellConfig
  pluginCommands: CommandContribution[]
  pluginKeybindings: KeybindingContribution[]
  setCommandPaletteOpen: (open: boolean) => void
  setAddWidgetOpen: (open: boolean) => void
  openSettings: (sectionId?: string) => void
  showToast: (message: string) => void
  switchTheme: (themeId: string) => void
  switchLayout: (layoutId: string) => void
  runPluginCommand?: (commandId: string, context: CommandExecutionContext) => void
}

function platformCommands(options: WorkbenchShellCommandModelsOptions): CommandContribution[] {
  return [
    {
      id: "open-command-palette",
      icon: "⌘K",
      title: "打开命令",
      description: "搜索命令、卡片和搜索源",
      category: "workspace",
      defaultShortcut: "⌘K",
    },
    {
      id: "toggle-theme",
      icon: "T",
      title: "切换主题",
      description: options.isDark() ? "暗色 → 明亮" : "明亮 → 暗色",
      category: "workspace",
      defaultShortcut: "⌘T",
    },
    {
      id: "toggle-layout",
      icon: "L",
      title: "切换布局",
      description:
        options.activeLayoutId() === options.shellConfig.layoutIds.dashboard
          ? "仪表盘 → 专注"
          : "专注 → 仪表盘",
      category: "workspace",
      defaultShortcut: "⌘L",
    },
    {
      id: "add-widget",
      icon: "+",
      title: "添加卡片",
      description: "向工作台添加新卡片",
      category: "workspace",
      defaultShortcut: "⌘N",
    },
    {
      id: "open-plugin-manager",
      icon: "P",
      title: "打开插件管理",
      description: "查看 layout / widget / theme 贡献",
      category: "workspace",
    },
    {
      id: "open-settings",
      icon: "S",
      title: "打开设置",
      description: "配置工作台",
      category: "workspace",
      defaultShortcut: "⌘,",
    },
    {
      id: "open-shortcuts",
      icon: "?",
      title: "快捷键参考",
      description: "查看所有快捷键",
      category: "workspace",
    },
  ]
}

function platformKeybindings(): KeybindingContribution[] {
  return [
    { id: "keybinding.open-command-palette", commandId: "open-command-palette", key: "mod+k" },
    { id: "keybinding.toggle-theme", commandId: "toggle-theme", key: "mod+t" },
    { id: "keybinding.toggle-layout", commandId: "toggle-layout", key: "mod+l" },
    { id: "keybinding.add-widget", commandId: "add-widget", key: "mod+n" },
    { id: "keybinding.open-settings", commandId: "open-settings", key: "mod+," },
  ]
}

export function createWorkbenchShellCommandModels(options: WorkbenchShellCommandModelsOptions): {
  commandItems: () => ReturnType<typeof createCommandPaletteCommands>
  availableCommandIds: () => string[]
  shortcutRegistry: () => ShortcutRegistry
  runCommand: (commandId: string, context: CommandExecutionContext) => boolean
} {
  const actions = (): CommandActionMap => ({
    "open-command-palette": () => options.setCommandPaletteOpen(true),
    "toggle-theme": () =>
      options.switchTheme(
        resolveWorkbenchThemeToggleTarget(options.isDark(), options.shellConfig.themeIds),
      ),
    "toggle-layout": () =>
      options.switchLayout(
        resolveWorkbenchLayoutToggleTarget(options.activeLayoutId(), options.shellConfig.layoutIds),
      ),
    "add-widget": () => options.setAddWidgetOpen(true),
    "open-plugin-manager": () =>
      options.openSettings(
        options.shellConfig.settingsPanelIds.plugins ?? "official.settings.plugins",
      ),
    "open-settings": () => options.openSettings(options.shellConfig.settingsPanelIds.appearance),
    "open-shortcuts": () => {
      const shortcuts = shortcutRegistry()
        .listShortcutReferences()
        .map((reference) => shortcutDisplay(reference.key))
        .join("、")
      options.showToast(`快捷键：${shortcuts}、Esc`)
    },
  })

  const shortcutRegistry = (): ShortcutRegistry =>
    createShortcutRegistry({
      platform: currentShortcutPlatform(),
      platformKeybindings: platformKeybindings(),
      pluginKeybindings: options.pluginKeybindings,
      commands: actions(),
    })

  return {
    commandItems: () =>
      createCommandPaletteCommands({
        platformCommands: platformCommands(options),
        pluginCommands: options.pluginCommands,
        actions: actions(),
      }),
    availableCommandIds: () => [
      ...platformCommands(options).map((command) => command.id),
      ...options.pluginCommands.map((command) => command.id),
    ],
    shortcutRegistry,
    runCommand: (commandId, context) =>
      createCommandExecutor({
        actions: actions(),
        pluginCommandIds: options.pluginCommands.map((command) => command.id),
        ...(options.runPluginCommand ? { runPluginCommand: options.runPluginCommand } : {}),
      })(commandId, context),
  }
}
