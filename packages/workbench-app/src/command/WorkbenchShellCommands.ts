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
import type { ShellTranslation } from "../i18n"

export type WorkbenchShellCommandModelsOptions = {
  isDark: () => boolean
  activeLayoutId: () => string
  tShell?: ShellTranslation
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
  const t = options.tShell
  return [
    {
      id: "open-command-palette",
      icon: "⌘K",
      title: t?.("commands.openCommandPalette.title") ?? "打开命令",
      description: t?.("commands.openCommandPalette.description") ?? "搜索命令、卡片和搜索源",
      keywords: ["command", "palette", "search", "cmd"],
      category: "workspace",
      defaultShortcut: "⌘K",
    },
    {
      id: "toggle-theme",
      icon: "明",
      title: t?.("commands.toggleTheme.title") ?? "切换主题",
      description: options.isDark()
        ? (t?.("commands.toggleTheme.description.toLight") ?? "暗色 → 明亮")
        : (t?.("commands.toggleTheme.description.toDark") ?? "明亮 → 暗色"),
      keywords: ["theme", "dark", "light", "appearance"],
      category: "workspace",
      defaultShortcut: "⌘T",
    },
    {
      id: "toggle-layout",
      icon: "▦",
      title: t?.("commands.toggleLayout.title") ?? "切换布局",
      description:
        options.activeLayoutId() === options.shellConfig.layoutIds.dashboard
          ? (t?.("commands.toggleLayout.description.toFocus") ?? "仪表盘 → 专注")
          : (t?.("commands.toggleLayout.description.toDashboard") ?? "专注 → 仪表盘"),
      keywords: ["layout", "dashboard", "focus", "仪表盘", "专注"],
      category: "workspace",
      defaultShortcut: "⌘L",
    },
    {
      id: "add-widget",
      icon: "+",
      title: t?.("commands.addWidget.title") ?? "添加卡片",
      description: t?.("commands.addWidget.description") ?? "向工作台添加新卡片",
      keywords: ["widget", "card", "module"],
      category: "workspace",
      defaultShortcut: "⌘N",
    },
    {
      id: "open-plugin-manager",
      icon: "◈",
      title: t?.("commands.openPluginManager.title") ?? "打开插件管理",
      description:
        t?.("commands.openPluginManager.description") ?? "查看 layout / widget / theme 贡献",
      keywords: ["plugin", "plugins", "extension", "layout", "widget", "theme"],
      category: "workspace",
    },
    {
      id: "open-settings",
      icon: "⚙",
      title: t?.("commands.openSettings.title") ?? "打开设置",
      description: t?.("commands.openSettings.description") ?? "配置工作台",
      keywords: ["settings", "preferences", "config"],
      category: "workspace",
      defaultShortcut: "⌘,",
    },
    {
      id: "open-shortcuts",
      icon: "?",
      title: t?.("commands.openShortcuts.title") ?? "快捷键参考",
      description: t?.("commands.openShortcuts.description") ?? "查看所有快捷键",
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
      const separator = options.tShell?.("commands.openShortcuts.separator") ?? "、"
      const shortcuts = shortcutRegistry()
        .listShortcutReferences()
        .map((reference) => shortcutDisplay(reference.key))
        .join(separator)
      options.showToast(
        options.tShell
          ? options.tShell("commands.openShortcuts.toast", { shortcuts })
          : `快捷键：${shortcuts}、Esc`,
      )
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
