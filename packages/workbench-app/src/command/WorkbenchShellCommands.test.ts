import { describe, expect, it, vi } from "vitest"

import { createWorkbenchShellCommandModels } from "./WorkbenchShellCommands"

function createOptions(
  overrides: Partial<Parameters<typeof createWorkbenchShellCommandModels>[0]> = {},
): Parameters<typeof createWorkbenchShellCommandModels>[0] {
  return {
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
    ...overrides,
  } as any
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
})
