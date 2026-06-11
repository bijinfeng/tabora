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
  t?: (key: string, vars?: Record<string, string | number>) => string
  setCommandPaletteOpen: (open: boolean) => void
  setAddWidgetOpen: (open: boolean) => void
  openSettings: (sectionId?: string) => void
  showToast: (message: string) => void
  switchTheme: (themeId: string) => void
  switchLayout: (layoutId: string) => void
  runPluginCommand?: (commandId: string, context: CommandExecutionContext) => void
}

function platformCommands(options: WorkbenchShellCommandModelsOptions): CommandContribution[] {
  const t =
    options.t ??
    ((key: string) =>
      ({
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
      })[key] ?? key)

  return [
    {
      id: "open-command-palette",
      icon: "⌘K",
      title: t("commands.openCommandPalette.title"),
      description: t("commands.openCommandPalette.desc"),
      category: "workspace",
      defaultShortcut: "⌘K",
    },
    {
      id: "toggle-theme",
      icon: "明",
      title: t("commands.toggleTheme.title"),
      description: options.isDark()
        ? t("commands.toggleTheme.descToLight")
        : t("commands.toggleTheme.descToDark"),
      category: "workspace",
      defaultShortcut: "⌘T",
    },
    {
      id: "toggle-layout",
      icon: "▦",
      title: t("commands.toggleLayout.title"),
      description:
        options.activeLayoutId() === options.shellConfig.layoutIds.dashboard
          ? t("commands.toggleLayout.descToFocus")
          : t("commands.toggleLayout.descToDashboard"),
      category: "workspace",
      defaultShortcut: "⌘L",
    },
    {
      id: "add-widget",
      icon: "+",
      title: t("commands.addWidget.title"),
      description: t("commands.addWidget.desc"),
      category: "workspace",
      defaultShortcut: "⌘N",
    },
    {
      id: "open-plugin-manager",
      icon: "◈",
      title: t("commands.openPluginManager.title"),
      description: t("commands.openPluginManager.desc"),
      category: "workspace",
    },
    {
      id: "open-settings",
      icon: "⚙",
      title: t("commands.openSettings.title"),
      description: t("commands.openSettings.desc"),
      category: "workspace",
      defaultShortcut: "⌘,",
    },
    {
      id: "open-shortcuts",
      icon: "?",
      title: t("commands.openShortcuts.title"),
      description: t("commands.openShortcuts.desc"),
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
  const t =
    options.t ??
    ((key: string, vars?: Record<string, string | number>) => {
      const message =
        {
          "toast.shortcuts": "快捷键：{{list}}、Esc",
        }[key] ?? key
      if (!vars) return message
      let result = message
      for (const [varKey, value] of Object.entries(vars)) {
        result = result.replaceAll(`{{${varKey}}}`, String(value))
      }
      return result
    })

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
      options.showToast(t("toast.shortcuts", { list: shortcuts }))
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
