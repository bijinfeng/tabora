import { describe, expect, it } from "vitest"

import { getSiteRoutePath, isPrototypeRoute, needsLandingStylesheet } from "./AppShell"

describe("AppShell route path handling", () => {
  it("normalizes the GitHub Pages base path before choosing the page shell", () => {
    expect(getSiteRoutePath("/tabora/", "/tabora/")).toBe("/")
    expect(getSiteRoutePath("/tabora/download", "/tabora/")).toBe("/download")
    expect(getSiteRoutePath("/tabora/docs", "/tabora/")).toBe("/docs")
  })

  it("keeps public site routes in the prototype shell under the GitHub Pages base", () => {
    expect(isPrototypeRoute("/tabora/", "/tabora/")).toBe(true)
    expect(isPrototypeRoute("/tabora/download", "/tabora/")).toBe(true)
    expect(isPrototypeRoute("/tabora/docs", "/tabora/")).toBe(true)
    expect(isPrototypeRoute("/tabora/docs/quickstart", "/tabora/")).toBe(true)
    expect(isPrototypeRoute("/tabora/docs/button", "/tabora/")).toBe(true)
    expect(isPrototypeRoute("/tabora/docs/components", "/tabora/")).toBe(false)
  })

  it("loads design preview stylesheets only for public prototype routes", () => {
    expect(needsLandingStylesheet("/tabora/", "/tabora/")).toBe(true)
    expect(needsLandingStylesheet("/tabora/download", "/tabora/")).toBe(true)
    expect(needsLandingStylesheet("/tabora/docs", "/tabora/")).toBe(true)
    expect(needsLandingStylesheet("/tabora/docs/quickstart", "/tabora/")).toBe(true)
    expect(needsLandingStylesheet("/tabora/docs/button", "/tabora/")).toBe(true)
    expect(needsLandingStylesheet("/tabora/docs/components", "/tabora/")).toBe(false)
  })
})
