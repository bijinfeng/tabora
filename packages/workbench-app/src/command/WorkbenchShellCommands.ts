import type { CommandContribution, KeybindingContribution } from "@tabora/plugin-api"
import {
  createCommandPaletteCommands,
  createShortcutRegistry,
  type CommandActionMap,
  type ShortcutRegistry,
} from "@tabora/orchestrator"

import { resolveWorkbenchThemeToggleTarget, type WorkbenchShellConfig } from "../shared/shellConfig"
import { createCommandExecutor, type CommandExecutionContext } from "../shared/shellHelpers"
import { currentShortcutPlatform, shortcutDisplay } from "../shared/WorkbenchShellUtils"
import type { ShellTranslation } from "../i18n"

export type WorkbenchShellCommandModelsOptions = {
  isDark: () => boolean
  tShell?: ShellTranslation
  shellConfig: WorkbenchShellConfig
  pluginCommands: CommandContribution[]
  pluginKeybindings: KeybindingContribution[]
  setCommandPaletteOpen: (open: boolean) => void
  setAddWidgetOpen: (open: boolean) => void
  openSettings: (sectionId?: string) => void
  showToast: (message: string) => void
  switchTheme: (themeId: string) => void
  hasPluginCommandHandler?: (commandId: string) => boolean
  runPluginCommand?: (commandId: string, context: CommandExecutionContext) => Promise<boolean>
}

function platformCommands(options: WorkbenchShellCommandModelsOptions): CommandContribution[] {
  const t = options.tShell
  return [
    {
      id: "open-command-palette",
      icon: "command",
      title: t?.("commands.openCommandPalette.title") ?? "打开命令",
      description: t?.("commands.openCommandPalette.description") ?? "搜索命令、卡片和搜索源",
      keywords: ["command", "palette", "search", "cmd"],
      category: "workspace",
      defaultShortcut: "⌘K",
    },
    {
      id: "toggle-theme",
      icon: "theme",
      title: t?.("commands.toggleTheme.title") ?? "切换主题",
      description: options.isDark()
        ? (t?.("commands.toggleTheme.description.toLight") ?? "暗色 → 明亮")
        : (t?.("commands.toggleTheme.description.toDark") ?? "明亮 → 暗色"),
      keywords: ["theme", "dark", "light", "appearance"],
      category: "workspace",
      defaultShortcut: "⌘T",
    },
    {
      id: "add-widget",
      icon: "plus",
      title: t?.("commands.addWidget.title") ?? "添加卡片",
      description: t?.("commands.addWidget.description") ?? "向工作台添加新卡片",
      keywords: ["widget", "card", "module"],
      category: "workspace",
      defaultShortcut: "⌘N",
    },
    {
      id: "open-plugin-manager",
      icon: "puzzle",
      title: t?.("commands.openPluginManager.title") ?? "打开插件管理",
      description:
        t?.("commands.openPluginManager.description") ?? "查看 layout / widget / theme 贡献",
      keywords: ["plugin", "plugins", "extension", "layout", "widget", "theme"],
      category: "workspace",
    },
    {
      id: "open-settings",
      icon: "settings",
      title: t?.("commands.openSettings.title") ?? "打开设置",
      description: t?.("commands.openSettings.description") ?? "配置工作台",
      keywords: ["settings", "preferences", "config"],
      category: "workspace",
      defaultShortcut: "⌘,",
    },
    {
      id: "open-shortcuts",
      icon: "circle-help",
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
    { id: "keybinding.add-widget", commandId: "add-widget", key: "mod+n" },
    { id: "keybinding.open-settings", commandId: "open-settings", key: "mod+," },
  ]
}

export function createWorkbenchShellCommandModels(options: WorkbenchShellCommandModelsOptions): {
  commandItems: () => ReturnType<typeof createCommandPaletteCommands>
  availableCommandIds: () => string[]
  shortcutRegistry: () => ShortcutRegistry
  runCommand: (commandId: string, context: CommandExecutionContext) => Promise<boolean>
} {
  const actions = (): CommandActionMap => ({
    "open-command-palette": () => options.setCommandPaletteOpen(true),
    "toggle-theme": () =>
      options.switchTheme(
        resolveWorkbenchThemeToggleTarget(options.isDark(), options.shellConfig.themeIds),
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
      executeCommand: async (commandId) => {
        const action = actions()[commandId]
        if (action) {
          await action()
          return
        }
        await options.runPluginCommand?.(commandId, { source: "shortcut" })
      },
      onCommandError: (error) => {
        options.showToast(error instanceof Error ? error.message : "命令执行失败")
      },
    })

  return {
    commandItems: () =>
      createCommandPaletteCommands({
        platformCommands: platformCommands(options),
        pluginCommands: options.pluginCommands,
        actions: actions(),
        ...(options.hasPluginCommandHandler
          ? { hasPluginCommandHandler: options.hasPluginCommandHandler }
          : {}),
        ...(options.runPluginCommand
          ? {
              executePluginCommand: (commandId: string) =>
                options.runPluginCommand!(commandId, { source: "palette" }),
              onCommandError: (error) => {
                options.showToast(error instanceof Error ? error.message : "命令执行失败")
              },
            }
          : {}),
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
      })(commandId, { ...context, source: context.source ?? "programmatic" }),
  }
}
