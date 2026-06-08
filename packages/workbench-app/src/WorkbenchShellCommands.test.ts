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
        stream: "layout.stream.custom",
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

    expect(options.switchTheme).toHaveBeenCalledWith("theme.dark.custom")
    expect(options.switchLayout).toHaveBeenCalledWith("layout.stream.custom")
    expect(options.openSettings).toHaveBeenCalledWith("settings.appearance.custom")
  })
})
