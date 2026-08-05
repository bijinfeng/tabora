import type {
  BackgroundProviderContribution,
  ThemeContribution,
  Workspace,
} from "@tabora/plugin-api"
import { describe, expect, it, vi } from "vitest"

import {
  applyWorkbenchBackgroundSelection,
  applyWorkbenchThemeSelection,
  switchWorkbenchBackground,
  switchWorkbenchTheme,
} from "./WorkbenchShellAppearanceState"

function workspace(overrides: Partial<Workspace> = {}): Workspace {
  return {
    id: "workspace-1",
    name: "Default",
    activeLayout: {
      pluginId: "official.layout",
      kind: "layout",
      id: "official.layout.workbench-dashboard",
    },
    activeTheme: { pluginId: "official.theme", kind: "theme", id: "official.theme.light" },
    activeBackgroundProvider: {
      pluginId: "official.background",
      kind: "background-provider",
      id: "official.background.default",
    },
    regions: {},
    createdAt: "2026-06-07T00:00:00.000Z",
    updatedAt: "2026-06-07T00:00:00.000Z",
    ...overrides,
  }
}

describe("applyWorkbenchThemeSelection", () => {
  it("applies resolved theme tokens and updates the active theme signal", () => {
    const themes: ThemeContribution[] = [
      { id: "official.theme.light", title: "Light", tokens: { "color-page": "255 255 255" } },
      { id: "official.theme.dark", title: "Dark", tokens: { "color-page": "10 10 10" } },
    ]
    const setThemeId = vi.fn()
    const applyTheme = vi.fn()

    applyWorkbenchThemeSelection({
      themeId: "official.theme.dark",
      themes,
      setThemeId,
      applyTheme,
    })

    expect(setThemeId).toHaveBeenCalledWith("official.theme.dark")
    expect(applyTheme).toHaveBeenCalledWith({ "color-page": "10 10 10" })
  })
})

describe("applyWorkbenchBackgroundSelection", () => {
  it("applies resolved background styles and updates the active background signal", () => {
    const backgrounds: BackgroundProviderContribution[] = [
      {
        id: "official.background.default",
        title: "Default",
        sourceType: "generated",
        defaultCss: { background: "rgb(255 255 255)" },
      },
      {
        id: "official.background.dark",
        title: "Dark",
        sourceType: "generated",
        defaultCss: { background: "rgb(10 10 10)" },
      },
    ]
    const setBackgroundId = vi.fn()
    const applyBackground = vi.fn()

    applyWorkbenchBackgroundSelection({
      backgroundId: "official.background.dark",
      backgrounds,
      setBackgroundId,
      applyBackground,
    })

    expect(setBackgroundId).toHaveBeenCalledWith("official.background.dark")
    expect(applyBackground).toHaveBeenCalledWith({ background: "rgb(10 10 10)" })
  })
})

describe("switchWorkbenchTheme", () => {
  it("applies the theme immediately and persists the workspace theme id", async () => {
    const currentWorkspace = workspace()
    const themes: ThemeContribution[] = [
      { id: "official.theme.light", title: "Light", tokens: { "color-page": "255 255 255" } },
      { id: "official.theme.dark", title: "Dark", tokens: { "color-page": "10 10 10" } },
    ]
    const setThemeId = vi.fn()
    const applyTheme = vi.fn()
    const theme = { pluginId: "official.theme", kind: "theme" as const, id: "official.theme.dark" }
    const persistTheme = vi.fn(async () => workspace({ activeTheme: theme }))
    const setWorkspaceState = vi.fn()

    await switchWorkbenchTheme({
      workspace: currentWorkspace,
      theme,
      themes,
      setThemeId,
      applyTheme,
      persistTheme,
      setWorkspaceState,
    })

    expect(setThemeId).toHaveBeenCalledWith("official.theme.dark")
    expect(applyTheme).toHaveBeenCalledWith({ "color-page": "10 10 10" })
    expect(persistTheme).toHaveBeenCalledWith("workspace-1", theme)
    expect(setWorkspaceState).toHaveBeenCalledWith(expect.objectContaining({ activeTheme: theme }))
  })
})

describe("switchWorkbenchBackground", () => {
  it("applies the background immediately and persists the workspace background id", async () => {
    const currentWorkspace = workspace()
    const backgrounds: BackgroundProviderContribution[] = [
      {
        id: "official.background.default",
        title: "Default",
        sourceType: "generated",
        defaultCss: { background: "rgb(255 255 255)" },
      },
      {
        id: "official.background.dark",
        title: "Dark",
        sourceType: "generated",
        defaultCss: { background: "rgb(10 10 10)" },
      },
    ]
    const setBackgroundId = vi.fn()
    const applyBackground = vi.fn()
    const background = {
      pluginId: "official.background",
      kind: "background-provider" as const,
      id: "official.background.dark",
    }
    const persistBackground = vi.fn(async () => workspace({ activeBackgroundProvider: background }))
    const setWorkspaceState = vi.fn()

    await switchWorkbenchBackground({
      workspace: currentWorkspace,
      background,
      backgrounds,
      setBackgroundId,
      applyBackground,
      persistBackground,
      setWorkspaceState,
    })

    expect(setBackgroundId).toHaveBeenCalledWith("official.background.dark")
    expect(applyBackground).toHaveBeenCalledWith({ background: "rgb(10 10 10)" })
    expect(persistBackground).toHaveBeenCalledWith("workspace-1", background)
    expect(setWorkspaceState).toHaveBeenCalledWith(
      expect.objectContaining({ activeBackgroundProvider: background }),
    )
  })
})
