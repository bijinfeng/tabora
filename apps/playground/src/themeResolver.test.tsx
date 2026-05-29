import { describe, expect, it } from "vitest"
import type { ThemeContribution } from "@tabora/plugin-api"
import { resolveThemeTokens } from "./themeResolver"

function makeTheme(id: string, tokens: Record<string, string>): ThemeContribution {
  return { id, title: id, tokens }
}

describe("resolveThemeTokens", () => {
  const light = makeTheme("official.theme.light", { "color-page": "255 255 255" })
  const dark = makeTheme("official.theme.dark", { "color-page": "18 18 18" })
  const themes = [light, dark]

  it("resolves theme tokens by ID", () => {
    const tokens = resolveThemeTokens("official.theme.light", themes)
    expect(tokens["color-page"]).toBe("255 255 255")
  })

  it("resolves dark theme tokens by ID", () => {
    const tokens = resolveThemeTokens("official.theme.dark", themes)
    expect(tokens["color-page"]).toBe("18 18 18")
  })

  it("falls back to first theme when ID is not found", () => {
    const tokens = resolveThemeTokens("unknown.theme", themes)
    expect(tokens["color-page"]).toBe("255 255 255")
  })

  it("returns empty tokens when no themes are available", () => {
    const tokens = resolveThemeTokens("any-id", [])
    expect(tokens).toEqual({})
  })

  it("does not contain hardcoded fallback values from the shell", () => {
    const tokens = resolveThemeTokens("official.theme.light", themes)
    expect(tokens["color-page"]).toBe("255 255 255")
    expect(tokens).not.toHaveProperty("radius-card")
  })
})
