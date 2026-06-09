import { createRoot } from "solid-js"
import { describe, expect, it } from "vitest"

import { createWorkbenchAppearanceStore } from "./WorkbenchAppearanceStore"

function createStore() {
  return createWorkbenchAppearanceStore({
    initialLayoutId: "community.layout.board",
    initialThemeId: "theme.light.custom",
    initialBackgroundId: "background.clouds",
    darkThemeId: "theme.dark.custom",
  })
}

describe("createWorkbenchAppearanceStore", () => {
  it("initializes from injected visual defaults", () => {
    createRoot((dispose) => {
      const appearance = createStore()

      expect(appearance.activeLayoutId()).toBe("community.layout.board")
      expect(appearance.themeId()).toBe("theme.light.custom")
      expect(appearance.backgroundId()).toBe("background.clouds")
      expect(appearance.isDark()).toBe(false)

      dispose()
    })
  })

  it("derives isDark from the active theme id", () => {
    createRoot((dispose) => {
      const appearance = createStore()

      appearance.setThemeId("theme.dark.custom")
      expect(appearance.isDark()).toBe(true)

      appearance.setThemeId("theme.light.custom")
      expect(appearance.isDark()).toBe(false)

      dispose()
    })
  })

  it("updates layout and background ids through setters", () => {
    createRoot((dispose) => {
      const appearance = createStore()

      appearance.setActiveLayoutId("official.layout.workbench-dashboard")
      appearance.setBackgroundId("background.aurora")

      expect(appearance.activeLayoutId()).toBe("official.layout.workbench-dashboard")
      expect(appearance.backgroundId()).toBe("background.aurora")

      dispose()
    })
  })
})
