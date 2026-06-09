import { createRoot } from "solid-js"
import { describe, expect, it } from "vitest"
import type { WorkbenchSearchSettings } from "@tabora/plugin-api"

import { createWorkbenchShellState } from "./WorkbenchShellState"

const initialSearchSettings: WorkbenchSearchSettings = {
  defaultProviderId: "official.search.google",
  enabledProviderIds: ["official.search.google"],
}

const initialVisualState = {
  layoutId: "community.layout.board",
  themeId: "theme.light.custom",
  backgroundId: "background.clouds",
}

describe("createWorkbenchShellState", () => {
  it("composes the shell state into domain-grouped stores", () => {
    createRoot((dispose) => {
      const state = createWorkbenchShellState({
        initialSearchSettings,
        initialVisualState,
        darkThemeId: "theme.dark.custom",
      })

      expect(Object.keys(state)).toEqual([
        "runtime",
        "workspace",
        "appearance",
        "widgets",
        "overlays",
        "search",
      ])

      dispose()
    })
  })

  it("routes injected visual + search defaults into their owning domains", () => {
    createRoot((dispose) => {
      const state = createWorkbenchShellState({
        initialSearchSettings,
        initialVisualState,
        darkThemeId: "theme.dark.custom",
      })

      expect(state.runtime.kernelReady()).toBe(false)
      expect(state.appearance.activeLayoutId()).toBe("community.layout.board")
      expect(state.appearance.backgroundId()).toBe("background.clouds")
      expect(state.appearance.isDark()).toBe(false)
      expect(state.search.searchSettings()).toEqual(initialSearchSettings)

      state.appearance.setThemeId("theme.dark.custom")
      expect(state.appearance.isDark()).toBe(true)

      dispose()
    })
  })
})
