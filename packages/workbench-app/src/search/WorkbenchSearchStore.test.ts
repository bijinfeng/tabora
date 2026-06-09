import { createRoot } from "solid-js"
import { describe, expect, it } from "vitest"
import type { WorkbenchSearchSettings } from "@tabora/plugin-api"

import { createWorkbenchSearchStore } from "./WorkbenchSearchStore"

const initialSearchSettings: WorkbenchSearchSettings = {
  defaultProviderId: "official.search.google",
  enabledProviderIds: ["official.search.google"],
}

describe("createWorkbenchSearchStore", () => {
  it("initializes from injected search settings with empty inline state", () => {
    createRoot((dispose) => {
      const search = createWorkbenchSearchStore({ initialSearchSettings })

      expect(search.searchSettings()).toEqual(initialSearchSettings)
      expect(search.searchHistory()).toEqual([])
      expect(search.inlineSearchQuery()).toBe("")
      expect(search.inlineSearchOpen()).toBe(false)
      expect(search.inlineSearchActiveResultIndex()).toBe(-1)

      dispose()
    })
  })

  it("supports updater-style setters for settings and active index", () => {
    createRoot((dispose) => {
      const search = createWorkbenchSearchStore({ initialSearchSettings })

      search.setSearchSettings((previous) => ({
        ...previous,
        defaultProviderId: "official.search.bing",
      }))
      expect(search.searchSettings().defaultProviderId).toBe("official.search.bing")

      search.setInlineSearchActiveResultIndex(2)
      search.setInlineSearchActiveResultIndex((current) => current + 1)
      expect(search.inlineSearchActiveResultIndex()).toBe(3)

      dispose()
    })
  })

  it("updates inline query/open and search history through setters", () => {
    createRoot((dispose) => {
      const search = createWorkbenchSearchStore({ initialSearchSettings })

      search.setInlineSearchQuery("tabora")
      search.setInlineSearchOpen(true)
      expect(search.inlineSearchQuery()).toBe("tabora")
      expect(search.inlineSearchOpen()).toBe(true)

      const history = [
        {
          query: "tabora",
          providerId: "official.search.google",
          timestamp: "2026-06-09T00:00:00.000Z",
        },
      ]
      search.setSearchHistory(history)
      expect(search.searchHistory()).toEqual(history)

      dispose()
    })
  })
})
