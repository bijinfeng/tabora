import { describe, expect, it } from "vitest"
import { render } from "solid-js/web"
import { Route, Router } from "@solidjs/router"

import { AppShell, getSiteHref, getSiteRoutePath, isPrototypeRoute } from "./AppShell"
import { PrototypeTopnav } from "../shared/PrototypeTopnav"
import { SiteToast } from "../shared/SiteToast"
import prototypeTopnavSource from "../shared/PrototypeTopnav.tsx?raw"
import homePageSource from "../routes/home/HomePage.tsx?raw"
import workbenchPreviewSource from "../routes/home/components/WorkbenchPreview.tsx?raw"

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

  it("prefixes public site links with the deployment base path", () => {
    expect(getSiteHref("/", "/tabora/")).toBe("/tabora/")
    expect(getSiteHref("/download", "/tabora/")).toBe("/tabora/download")
    expect(getSiteHref("/docs/quickstart", "/tabora/")).toBe("/tabora/docs/quickstart")
    expect(getSiteHref("/#product", "/tabora/")).toBe("/tabora/#product")
    expect(getSiteHref("#platforms", "/tabora/")).toBe("#platforms")
    expect(getSiteHref("https://example.com", "/tabora/")).toBe("https://example.com")
  })

  it("keeps the UI link button route explicit under the router base", () => {
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

    expect(
      root.querySelector<HTMLAnchorElement>("[data-site-nav-actions] a")?.getAttribute("href"),
    ).toBe("/download")
    expect(root.querySelector<HTMLAnchorElement>("[data-site-logo]")?.getAttribute("href")).toBe(
      "/tabora",
    )

    dispose()
    root.remove()
  })

  it("renders the shared shell with stable selectors instead of semantic CSS classes", () => {
    const root = document.createElement("div")
    window.history.pushState({}, "", "/tabora/docs/components")
    document.body.append(root)

    const dispose = render(
      () => (
        <Router root={AppShell} base="/tabora">
          <Route path="/docs/components" component={() => <SiteToast visible message="已更新" />} />
        </Router>
      ),
      root,
    )

    expect(root.querySelector("[data-site-shell]")).not.toBeNull()
    expect(root.querySelector("[data-site-toast]")).not.toBeNull()
    expect(root.querySelector('[role="banner"]')).not.toBeNull()
    expect(root.querySelector('nav[aria-label="主导航"]')).not.toBeNull()
    expect(root.querySelector(".site")).toBeNull()
    expect(root.querySelector(".topbar")).toBeNull()
    expect(root.querySelector(".toast")).toBeNull()

    dispose()
    root.remove()
  })

  it("uses the shared IconButton for the theme toggle", () => {
    expect(prototypeTopnavSource).toContain(
      '<IconButton\n            size="lg"\n            variant="secondary"',
    )
  })

  it("keeps the landing navigation and workbench rail aligned with the landing prototype", () => {
    expect(prototypeTopnavSource).toContain('i18n.t("nav.officialPlugins")')
    expect(homePageSource).toContain('i18n.t("action.devDocs")')
    expect(prototypeTopnavSource).not.toContain("LocaleToggleButton")
    expect(prototypeTopnavSource).toContain('import { Button, IconButton } from "@tabora/ui"')
    expect(workbenchPreviewSource).toContain(
      'import { Button, IconButton, Input } from "@tabora/ui"',
    )
    expect(workbenchPreviewSource).toContain('<IconButton variant="ghost"')
  })
})
