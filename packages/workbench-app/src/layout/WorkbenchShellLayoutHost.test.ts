import { describe, expect, it, vi } from "vitest"
import type { LayoutHostAPI } from "@tabora/plugin-api"

import { createWorkbenchLayoutHostAPI } from "./WorkbenchShellLayoutHost"

const baseShellConfig = {
  themeIds: {
    light: "theme.light.custom",
    dark: "theme.dark.custom",
  },
  layoutIds: {
    dashboard: "layout.dashboard.custom",
  },
  settingsPanelIds: {
    appearance: "settings.appearance.custom",
  },
  searchHistory: {
    pluginId: "search.plugin.custom",
    key: "search-history-custom",
  },
}

describe("createWorkbenchLayoutHostAPI", () => {
  it("builds stable rail actions and routes them through rail action handlers", () => {
    const runRailAction = vi.fn()
    const host = createWorkbenchLayoutHostAPI({
      activeLayoutId: () => "layout.dashboard.custom",
      isDark: () => false,
      setCommandPaletteOpen: vi.fn(),
      setAddWidgetOpen: vi.fn(),
      openSettings: vi.fn(),
      readLayoutState: vi.fn() as unknown as LayoutHostAPI["readLayoutState"],
      writeLayoutState: vi.fn() as unknown as LayoutHostAPI["writeLayoutState"],
      showToast: vi.fn() as unknown as LayoutHostAPI["showToast"],
      switchTheme: vi.fn(),
      runRailAction,
      shellConfig: baseShellConfig,
    } satisfies Parameters<typeof createWorkbenchLayoutHostAPI>[0])

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

  it("builds toolbar actions with theme toggle and imperative host helpers", () => {
    const setCommandPaletteOpen = vi.fn()
    const setAddWidgetOpen = vi.fn()
    const openSettings = vi.fn()
    const showToast = vi.fn() as unknown as LayoutHostAPI["showToast"]
    const readLayoutState = vi.fn(
      (_key: string) => ({ cached: true }) as unknown,
    ) as unknown as LayoutHostAPI["readLayoutState"]
    const writeLayoutState = vi.fn() as unknown as LayoutHostAPI["writeLayoutState"]
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
      switchTheme,
      runRailAction: vi.fn(),
      shellConfig: baseShellConfig,
    } satisfies Parameters<typeof createWorkbenchLayoutHostAPI>[0])

    const toolbarActions = host.getGlobalActions("toolbar")
    expect(toolbarActions.map((action) => action.id)).toEqual(["command", "theme", "settings"])

    toolbarActions[0]?.run()
    toolbarActions[1]?.run()

    host.openSettings("settings.search.custom")
    host.openCommandPalette()
    const addWidgetContext = { activeGroupLabel: "Research" }
    host.openAddWidget(addWidgetContext)
    expect(host.readLayoutState("dashboard")).toEqual({ cached: true })
    host.writeLayoutState("dashboard", { groupCount: 2 })
    host.showToast("已保存", { type: "success" })
    host.toggleTheme()

    expect(setCommandPaletteOpen).toHaveBeenNthCalledWith(1, true)
    expect(switchTheme).toHaveBeenNthCalledWith(1, "theme.light.custom")
    expect(openSettings).toHaveBeenCalledWith("settings.search.custom")
    expect(setCommandPaletteOpen).toHaveBeenNthCalledWith(2, true)
    expect(setAddWidgetOpen).toHaveBeenCalledWith(true, addWidgetContext)
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
    const switchTheme = vi.fn()

    const host = createWorkbenchLayoutHostAPI({
      activeLayoutId: () => "layout.dashboard.custom",
      isDark: () => false,
      setCommandPaletteOpen,
      setAddWidgetOpen,
      openSettings,
      readLayoutState: vi.fn() as unknown as LayoutHostAPI["readLayoutState"],
      writeLayoutState: vi.fn() as unknown as LayoutHostAPI["writeLayoutState"],
      showToast: vi.fn() as unknown as LayoutHostAPI["showToast"],
      switchTheme,
      runRailAction: vi.fn(),
      shellConfig: baseShellConfig,
    } satisfies Parameters<typeof createWorkbenchLayoutHostAPI>[0])

    const menuActions = host.getGlobalActions("menu")
    expect(menuActions.map((action) => action.id)).toEqual([
      "command",
      "add-widget",
      "theme",
      "settings",
    ])

    menuActions[0]?.run()
    menuActions[1]?.run()
    menuActions[2]?.run()
    menuActions[3]?.run()

    expect(setCommandPaletteOpen).toHaveBeenCalledWith(true)
    expect(setAddWidgetOpen).toHaveBeenCalledWith(true)
    expect(switchTheme).toHaveBeenCalledWith("theme.dark.custom")
    expect(openSettings).toHaveBeenCalledWith("settings.appearance.custom")
  })

  it("uses tShell to localize global action labels", () => {
    const host = createWorkbenchLayoutHostAPI({
      activeLayoutId: () => "layout.dashboard.custom",
      isDark: () => true,
      tShell: (key: string) => {
        const messages: Record<string, string> = {
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
      readLayoutState: vi.fn() as unknown as LayoutHostAPI["readLayoutState"],
      writeLayoutState: vi.fn() as unknown as LayoutHostAPI["writeLayoutState"],
      showToast: vi.fn() as unknown as LayoutHostAPI["showToast"],
      switchTheme: vi.fn(),
      runRailAction: vi.fn(),
      shellConfig: baseShellConfig,
    } satisfies Parameters<typeof createWorkbenchLayoutHostAPI>[0])

    const railActions = host.getGlobalActions("rail")
    expect(railActions[0]?.label).toBe("Group My workbench")

    const toolbarActions = host.getGlobalActions("toolbar")
    expect(toolbarActions[0]?.label).toBe("Commands")
    expect(toolbarActions[1]?.label).toBe("Light")
    expect(toolbarActions[2]?.label).toBe("Settings")
  })
})
