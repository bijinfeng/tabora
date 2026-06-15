import { describe, expect, it, vi } from "vitest"
import { createCommandPaletteItems } from "@tabora/orchestrator"

import { createWorkbenchShellCommandModels } from "./WorkbenchShellCommands"

function createOptions(
  overrides: Partial<Parameters<typeof createWorkbenchShellCommandModels>[0]> = {},
): Parameters<typeof createWorkbenchShellCommandModels>[0] {
  const base: Parameters<typeof createWorkbenchShellCommandModels>[0] = {
    isDark: () => false,
    activeLayoutId: () => "layout.dashboard.custom",
    pluginCommands: [],
    pluginKeybindings: [],
    setCommandPaletteOpen: vi.fn(),
    setAddWidgetOpen: vi.fn(),
    openSettings: vi.fn(),
    showToast: vi.fn(),
    switchTheme: vi.fn(),
    switchLayout: vi.fn(),
    shellConfig: {
      themeIds: {
        light: "theme.light.custom",
        dark: "theme.dark.custom",
      },
      layoutIds: {
        dashboard: "layout.dashboard.custom",
        focus: "layout.focus.custom",
      },
      settingsPanelIds: {
        appearance: "settings.appearance.custom",
      },
      searchHistory: {
        pluginId: "search.plugin.custom",
        key: "search-history-custom",
      },
    },
  }

  return { ...base, ...overrides }
}

describe("createWorkbenchShellCommandModels", () => {
  it("uses injected shell ids for theme toggle, layout toggle, and settings entry", () => {
    const options = createOptions()
    const models = createWorkbenchShellCommandModels(options)

    models.runCommand("toggle-theme", {})
    models.runCommand("toggle-layout", {})
    models.runCommand("open-settings", {})
    models.runCommand("open-plugin-manager", {})

    expect(options.switchTheme).toHaveBeenCalledWith("theme.dark.custom")
    expect(options.switchLayout).toHaveBeenCalledWith("layout.focus.custom")
    expect(options.openSettings).toHaveBeenCalledWith("settings.appearance.custom")
    expect(options.openSettings).toHaveBeenCalledWith("official.settings.plugins")
  })

  it("exposes plugin management as a first-class command", () => {
    const models = createWorkbenchShellCommandModels(createOptions())

    expect(models.commandItems().map((command) => command.name)).toContain("打开插件管理")
    expect(models.commandItems().map((command) => [command.name, command.icon])).toEqual(
      expect.arrayContaining([
        ["切换主题", "明"],
        ["切换布局", "▦"],
        ["打开插件管理", "◈"],
        ["打开设置", "⚙"],
      ]),
    )
  })

  it("matches visible English layout labels in command search", () => {
    const dashboardModels = createWorkbenchShellCommandModels(createOptions())
    const focusModels = createWorkbenchShellCommandModels(
      createOptions({
        activeLayoutId: () => "layout.focus.custom",
      }),
    )

    expect(
      createCommandPaletteItems({
        query: "Focus",
        commands: dashboardModels.commandItems(),
      }).map((item) => item.id),
    ).toContain("toggle-layout")
    expect(
      createCommandPaletteItems({
        query: "Dashboard",
        commands: focusModels.commandItems(),
      }).map((item) => item.id),
    ).toContain("toggle-layout")
    expect(
      createCommandPaletteItems({
        query: "plugin",
        commands: dashboardModels.commandItems(),
      }).map((item) => item.id),
    ).toContain("open-plugin-manager")
  })

  it("uses tShell for platform command labels and shortcut toast", () => {
    const showToast = vi.fn()
    const models = createWorkbenchShellCommandModels(
      createOptions({
        showToast,
        tShell: (key: string, vars?: Record<string, string | number>) => {
          const messages: Record<string, string> = {
            "commands.openPluginManager.title": "Open plugin manager",
            "commands.toggleTheme.title": "Toggle theme",
            "commands.toggleLayout.title": "Toggle layout",
            "commands.openSettings.title": "Open settings",
            "commands.openShortcuts.separator": ", ",
            "commands.openShortcuts.toast": "Shortcuts: {{shortcuts}}, Esc",
          }
          const template = messages[key] ?? key
          return template.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars?.[k] ?? ""))
        },
      }),
    )

    expect(models.commandItems().map((command) => command.name)).toContain("Open plugin manager")
    expect(models.commandItems().map((command) => [command.name, command.icon])).toEqual(
      expect.arrayContaining([
        ["Toggle theme", "明"],
        ["Toggle layout", "▦"],
        ["Open plugin manager", "◈"],
        ["Open settings", "⚙"],
      ]),
    )

    models.runCommand("open-shortcuts", {})
    expect(showToast).toHaveBeenCalledWith(expect.stringContaining("Shortcuts:"))
  })
})
