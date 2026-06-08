import { describe, expect, it, vi } from "vitest"

import { createWorkbenchLayoutHostAPI } from "./WorkbenchShellLayoutHost"

describe("createWorkbenchLayoutHostAPI", () => {
  it("builds stable rail actions and routes them through rail action handlers", () => {
    const runRailAction = vi.fn()
    const host = createWorkbenchLayoutHostAPI({
      activeLayoutId: () => "layout.dashboard.custom",
      isDark: () => false,
      setCommandPaletteOpen: vi.fn(),
      setAddWidgetOpen: vi.fn(),
      openSettings: vi.fn(),
      switchLayout: vi.fn(),
      switchTheme: vi.fn(),
      runRailAction,
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
    } as any)

    const railActions = host.getGlobalActions("rail")
    expect(railActions.map((action) => action.id)).toEqual([
      "home",
      "add-widget",
      "theme",
      "settings",
    ])

    railActions[1]?.run()
    railActions[3]?.run()

    expect(runRailAction).toHaveBeenNthCalledWith(1, "add-widget")
    expect(runRailAction).toHaveBeenNthCalledWith(2, "settings")
  })

  it("builds toolbar actions with layout/theme toggles and imperative host helpers", () => {
    const setCommandPaletteOpen = vi.fn()
    const setAddWidgetOpen = vi.fn()
    const openSettings = vi.fn()
    const switchLayout = vi.fn()
    const switchTheme = vi.fn()

    const host = createWorkbenchLayoutHostAPI({
      activeLayoutId: () => "layout.dashboard.custom",
      isDark: () => true,
      setCommandPaletteOpen,
      setAddWidgetOpen,
      openSettings,
      switchLayout,
      switchTheme,
      runRailAction: vi.fn(),
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
    } as any)

    const toolbarActions = host.getGlobalActions("toolbar")
    expect(toolbarActions.map((action) => action.id)).toEqual([
      "command",
      "layout-switch",
      "theme",
      "settings",
    ])
    expect(toolbarActions[1]?.label).toBe("切换到流式")

    toolbarActions[0]?.run()
    toolbarActions[1]?.run()
    toolbarActions[2]?.run()

    host.openSettings("settings.search.custom")
    host.openCommandPalette()
    host.openAddWidget()
    host.toggleTheme()

    expect(setCommandPaletteOpen).toHaveBeenNthCalledWith(1, true)
    expect(switchLayout).toHaveBeenCalledWith("layout.stream.custom")
    expect(switchTheme).toHaveBeenNthCalledWith(1, "theme.light.custom")
    expect(openSettings).toHaveBeenCalledWith("settings.search.custom")
    expect(setCommandPaletteOpen).toHaveBeenNthCalledWith(2, true)
    expect(setAddWidgetOpen).toHaveBeenCalledWith(true)
    expect(switchTheme).toHaveBeenNthCalledWith(2, "theme.light.custom")
    expect(host.isDark()).toBe(true)
  })
})
