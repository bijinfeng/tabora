import { describe, expect, it } from "vitest"

import { getSiteRoutePath, isPrototypeRoute, needsLandingStylesheet } from "./AppShell"

describe("AppShell route path handling", () => {
  it("normalizes the GitHub Pages base path before choosing the page shell", () => {
    expect(getSiteRoutePath("/tabora/", "/tabora/")).toBe("/")
    expect(getSiteRoutePath("/tabora/download", "/tabora/")).toBe("/download")
    expect(getSiteRoutePath("/tabora/docs", "/tabora/")).toBe("/docs")
  })

  it("keeps nested docs routes outside the prototype shell under the GitHub Pages base", () => {
    expect(isPrototypeRoute("/tabora/docs/components", "/tabora/")).toBe(false)
    expect(needsLandingStylesheet("/tabora/", "/tabora/")).toBe(true)
  })
})
