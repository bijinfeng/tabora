import { describe, expect, it } from "vitest"
import { render } from "solid-js/web"
import { Route, Router } from "@solidjs/router"

import {
  AppShell,
  getSiteHref,
  getSiteRoutePath,
  isPrototypeRoute,
  needsLandingStylesheet,
} from "./AppShell"
import { PrototypeTopnav } from "../shared/PrototypeTopnav"

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
    expect(needsLandingStylesheet("/tabora/docs", "/tabora/")).toBe(false)
    expect(needsLandingStylesheet("/tabora/docs/quickstart", "/tabora/")).toBe(false)
    expect(needsLandingStylesheet("/tabora/docs/button", "/tabora/")).toBe(false)
    expect(needsLandingStylesheet("/tabora/docs/components", "/tabora/")).toBe(false)
  })

  it("prefixes public site links with the deployment base path", () => {
    expect(getSiteHref("/", "/tabora/")).toBe("/tabora/")
    expect(getSiteHref("/download", "/tabora/")).toBe("/tabora/download")
    expect(getSiteHref("/docs/quickstart", "/tabora/")).toBe("/tabora/docs/quickstart")
    expect(getSiteHref("/#product", "/tabora/")).toBe("/tabora/#product")
    expect(getSiteHref("#platforms", "/tabora/")).toBe("#platforms")
    expect(getSiteHref("https://example.com", "/tabora/")).toBe("https://example.com")
  })

  it("lets the Solid router apply the base path to topnav route links once", () => {
    const root = document.createElement("div")
    window.history.pushState({}, "", "/tabora/")
    document.body.append(root)

    const dispose = render(
      () => (
        <Router root={AppShell} base="/tabora">
          <Route
            path="/"
            component={() => (
              <PrototypeTopnav
                active="home"
                actions={[{ href: "/download", label: "下载", variant: "primary" }]}
              />
            )}
          />
        </Router>
      ),
      root,
    )

    expect(root.querySelector<HTMLAnchorElement>(".site-nav-actions a")?.getAttribute("href")).toBe(
      "/tabora/download",
    )
    expect(root.querySelector<HTMLAnchorElement>(".site-logo")?.getAttribute("href")).toBe(
      "/tabora",
    )

    dispose()
    root.remove()
  })
})
