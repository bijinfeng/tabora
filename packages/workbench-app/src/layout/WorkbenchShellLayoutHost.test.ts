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
      readLayoutState: vi.fn(),
      writeLayoutState: vi.fn(),
      showToast: vi.fn(),
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
    } as any)

    const railActions = host.getGlobalActions("rail")
    expect(railActions.map((action) => action.id)).toEqual([
      "home",
      "add-widget",
      "layout-switch",
      "theme",
      "settings",
    ])

    railActions[1]?.run()
    railActions[4]?.run()

    expect(runRailAction).toHaveBeenNthCalledWith(1, "add-widget")
    expect(runRailAction).toHaveBeenNthCalledWith(2, "settings")
  })

  it("builds toolbar actions with layout/theme toggles and imperative host helpers", () => {
    const setCommandPaletteOpen = vi.fn()
    const setAddWidgetOpen = vi.fn()
    const openSettings = vi.fn()
    const showToast = vi.fn()
    const readLayoutState = vi.fn(() => ({ cached: true }))
    const writeLayoutState = vi.fn()
    const switchLayout = vi.fn()
    const switchTheme = vi.fn()

    const host = createWorkbenchLayoutHostAPI({
      activeLayoutId: () => "layout.dashboard.custom",
      isDark: () => true,
      setCommandPaletteOpen,
      setAddWidgetOpen,
      openSettings,
      readLayoutState,
      writeLayoutState,
      showToast,
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
    } as any)

    const toolbarActions = host.getGlobalActions("toolbar")
    expect(toolbarActions.map((action) => action.id)).toEqual([
      "command",
      "layout-switch",
      "theme",
      "settings",
    ])
    expect(toolbarActions[1]?.label).toBe("切换到专注")

    toolbarActions[0]?.run()
    toolbarActions[1]?.run()
    toolbarActions[2]?.run()

    host.openSettings("settings.search.custom")
    host.openCommandPalette()
    host.openAddWidget()
    expect(host.readLayoutState("dashboard")).toEqual({ cached: true })
    host.writeLayoutState("dashboard", { groupCount: 2 })
    host.showToast("已保存", { type: "success" })
    host.toggleTheme()

    expect(setCommandPaletteOpen).toHaveBeenNthCalledWith(1, true)
    expect(switchLayout).toHaveBeenCalledWith("layout.focus.custom")
    expect(switchTheme).toHaveBeenNthCalledWith(1, "theme.light.custom")
    expect(openSettings).toHaveBeenCalledWith("settings.search.custom")
    expect(setCommandPaletteOpen).toHaveBeenNthCalledWith(2, true)
    expect(setAddWidgetOpen).toHaveBeenCalledWith(true)
    expect(readLayoutState).toHaveBeenCalledWith("dashboard")
    expect(writeLayoutState).toHaveBeenCalledWith("dashboard", { groupCount: 2 })
    expect(showToast).toHaveBeenCalledWith("已保存", { type: "success" })
    expect(switchTheme).toHaveBeenNthCalledWith(2, "theme.light.custom")
    expect(host.isDark()).toBe(true)
  })

  it("builds menu actions for layouts without rail or toolbar", () => {
    const setCommandPaletteOpen = vi.fn()
    const setAddWidgetOpen = vi.fn()
    const openSettings = vi.fn()
    const switchLayout = vi.fn()
    const switchTheme = vi.fn()

    const host = createWorkbenchLayoutHostAPI({
      activeLayoutId: () => "layout.dashboard.custom",
      isDark: () => false,
      setCommandPaletteOpen,
      setAddWidgetOpen,
      openSettings,
      readLayoutState: vi.fn(),
      writeLayoutState: vi.fn(),
      showToast: vi.fn(),
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
    } as any)

    const menuActions = host.getGlobalActions("menu")
    expect(menuActions.map((action) => action.id)).toEqual([
      "command",
      "add-widget",
      "layout-switch",
      "theme",
      "settings",
    ])

    menuActions[0]?.run()
    menuActions[1]?.run()
    menuActions[2]?.run()
    menuActions[3]?.run()
    menuActions[4]?.run()

    expect(setCommandPaletteOpen).toHaveBeenCalledWith(true)
    expect(setAddWidgetOpen).toHaveBeenCalledWith(true)
    expect(switchLayout).toHaveBeenCalledWith("layout.focus.custom")
    expect(switchTheme).toHaveBeenCalledWith("theme.dark.custom")
    expect(openSettings).toHaveBeenCalledWith("settings.appearance.custom")
  })

  it("uses tShell to localize global action labels", () => {
    const host = createWorkbenchLayoutHostAPI({
      activeLayoutId: () => "layout.dashboard.custom",
      isDark: () => true,
      tShell: (key: string) => {
        const messages: Record<string, string> = {
          "layoutHost.layoutToggle.toFocus": "Switch to focus",
          "layoutHost.rail.home": "Group My workbench",
          "layoutHost.common.command": "Commands",
          "layoutHost.common.settings": "Settings",
          "layoutHost.themeTarget.light": "Light",
        }
        return messages[key] ?? key
      },
      setCommandPaletteOpen: vi.fn(),
      setAddWidgetOpen: vi.fn(),
      openSettings: vi.fn(),
      readLayoutState: vi.fn(),
      writeLayoutState: vi.fn(),
      showToast: vi.fn(),
      switchLayout: vi.fn(),
      switchTheme: vi.fn(),
      runRailAction: vi.fn(),
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
    } as any)

    const railActions = host.getGlobalActions("rail")
    expect(railActions[0]?.label).toBe("Group My workbench")

    const toolbarActions = host.getGlobalActions("toolbar")
    expect(toolbarActions[0]?.label).toBe("Commands")
    expect(toolbarActions[1]?.label).toBe("Switch to focus")
    expect(toolbarActions[2]?.label).toBe("Light")
    expect(toolbarActions[3]?.label).toBe("Settings")
  })
})
