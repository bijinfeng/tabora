import { describe, expect, it, vi } from "vitest"

import { createWorkbenchLayoutHostAPI } from "./WorkbenchShellLayoutHost"

describe("createWorkbenchLayoutHostAPI", () => {
  it("builds stable rail actions and routes them through rail action handlers", () => {
    const runRailAction = vi.fn()
    const host = createWorkbenchLayoutHostAPI({
      activeLayoutId: () => "official.layout.workbench-dashboard",
      isDark: () => false,
      setCommandPaletteOpen: vi.fn(),
      setAddWidgetOpen: vi.fn(),
      openSettings: vi.fn(),
      switchLayout: vi.fn(),
      switchTheme: vi.fn(),
      runRailAction,
    })

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
      activeLayoutId: () => "official.layout.workbench-dashboard",
      isDark: () => true,
      setCommandPaletteOpen,
      setAddWidgetOpen,
      openSettings,
      switchLayout,
      switchTheme,
      runRailAction: vi.fn(),
    })

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

    host.openSettings("official.settings.workspace.search")
    host.openCommandPalette()
    host.openAddWidget()
    host.toggleTheme()

    expect(setCommandPaletteOpen).toHaveBeenNthCalledWith(1, true)
    expect(switchLayout).toHaveBeenCalledWith("official.layout.workbench-stream")
    expect(switchTheme).toHaveBeenNthCalledWith(1, "official.theme.light")
    expect(openSettings).toHaveBeenCalledWith("official.settings.workspace.search")
    expect(setCommandPaletteOpen).toHaveBeenNthCalledWith(2, true)
    expect(setAddWidgetOpen).toHaveBeenCalledWith(true)
    expect(switchTheme).toHaveBeenNthCalledWith(2, "official.theme.light")
    expect(host.isDark()).toBe(true)
  })
})
