import { afterEach, describe, expect, it, vi } from "vitest"
import { page, userEvent } from "vitest/browser"
import { render } from "solid-js/web"
import { builtinPlugins } from "@tabora/builtin-plugin-registry"
import type { BuiltinPlugin } from "@tabora/platform-kernel"

import { App } from "./App"

type PluginSnapshot = {
  activate: BuiltinPlugin["activate"]
  permissions: BuiltinPlugin["manifest"]["permissions"] | undefined
}

const builtinPluginSnapshots = new Map<string, PluginSnapshot>(
  builtinPlugins.map((plugin) => {
    const activate = Reflect.get(plugin, "activate") as BuiltinPlugin["activate"]
    return [
      plugin.manifest.id,
      {
        activate: (context) => activate(context),
        permissions: clonePermissions(plugin.manifest.permissions),
      },
    ]
  }),
)

let disposeApp: (() => void) | undefined

describe("workbench governance smoke", () => {
  afterEach(async () => {
    disposeApp?.()
    disposeApp = undefined
    restoreBuiltinPlugins()
    vi.restoreAllMocks()
    document.body.innerHTML = ""
    document.documentElement.removeAttribute("style")
    document.body.removeAttribute("style")
    localStorage.clear()
    await deleteDatabase("tabora")
  })

  it("opens quick links and allowed search through the host external-open path", async () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation((() => null) as typeof window.open)

    await mountFreshWorkbench()
    await waitFor(() => expect(findButtonByText("[data-quick-link]", "GitHub")).toBeTruthy())

    const quickLinkButton = findButtonByText("[data-quick-link]", "GitHub")
    expect(quickLinkButton?.tagName).toBe("BUTTON")
    expect(document.querySelector("[data-quick-links-card] a")).toBeFalsy()

    quickLinkButton?.click()
    await waitFor(() => expect(openSpy).toHaveBeenNthCalledWith(1, "https://github.com", "_blank"))

    await enterSearchQuery("tabora governance")
    await waitFor(() =>
      expect(openSpy).toHaveBeenNthCalledWith(
        2,
        "https://www.google.com/search?q=tabora%20governance",
        "_blank",
      ),
    )
  })

  it("shows a toast when search external-open permission is denied", async () => {
    patchPluginPermissions("official.search-providers.basic", [
      { type: "external-open", hosts: ["example.com"] },
    ])

    const openSpy = vi.spyOn(window, "open").mockImplementation((() => null) as typeof window.open)

    await mountFreshWorkbench()

    await enterSearchQuery("blocked query")

    await waitFor(() =>
      expect(document.querySelector("[data-toast-item]")?.textContent).toContain(
        "无法打开该搜索源，请检查插件权限",
      ),
    )
    expect(openSpy).not.toHaveBeenCalled()
  })

  it("falls back to the safe layout when the active layout view throws", async () => {
    patchLayoutToThrow(
      "official.layout.workbench-dashboard",
      "official.layout.workbench-dashboard.view",
    )

    await mountFreshWorkbench({ readySelector: "[data-safe-workbench-layout]" })

    await waitFor(() => expect(document.querySelector("[data-safe-workbench-layout]")).toBeTruthy())
    await waitFor(() =>
      expect(document.querySelector("[data-toast-item]")?.textContent).toContain(
        "布局加载失败，已切换到安全布局",
      ),
    )
    expect(
      document.querySelectorAll("[data-safe-workbench-layout] [data-workbench-grid-item]").length,
    ).toBeGreaterThan(0)

    findButtonByText("[data-safe-workbench-layout] button", "搜索")?.click()
    await waitFor(() => expect(document.querySelector("[data-command-palette-panel]")).toBeTruthy())
    clickRequired("[data-command-palette-overlay]")
    await waitFor(() => expect(document.querySelector("[data-command-palette-panel]")).toBeFalsy())

    findButtonByText("[data-safe-workbench-layout] button", "设置")?.click()
    await waitFor(() =>
      expect(document.querySelector('[data-workbench-overlay="settings"]')).toBeTruthy(),
    )
    const searchNavBtn = findButtonByText("[data-settings-nav] button", "搜索")
    expect(searchNavBtn).toBeTruthy()
    ;(searchNavBtn as HTMLElement).click()
    await waitFor(() =>
      expect(
        document.querySelector('[data-settings-section][aria-current="page"]')?.textContent,
      ).toContain("搜索"),
    )
    await waitFor(() =>
      expect(document.querySelector("#settings-search-provider-select")).toBeTruthy(),
    )
    clickRequired("[data-settings-close]")
    await waitFor(() =>
      expect(document.querySelector('[data-workbench-overlay="settings"]')).toBeFalsy(),
    )

    await page.viewport(390, 844)
    await waitFor(() => expect(hasHorizontalOverflow()).toBe(false))

    findButtonByText("[data-safe-workbench-layout] button", "设置")?.click()
    await waitFor(() =>
      expect(document.querySelector('[data-workbench-overlay="settings"]')).toBeTruthy(),
    )
    await waitFor(() => expect(hasHorizontalOverflow()).toBe(false))
  })
})

async function mountFreshWorkbench(options: { readySelector?: string } = {}): Promise<void> {
  await page.viewport(1280, 900)
  localStorage.clear()
  await deleteDatabase("tabora")
  document.body.innerHTML = '<div id="root"></div>'
  const root = document.getElementById("root")
  if (!root) {
    throw new Error("Root element #root was not found")
  }
  disposeApp = render(() => <App />, root)
  await vi.waitFor(
    () =>
      expect(document.querySelector(options.readySelector ?? "[data-layout-grid]")).toBeTruthy(),
    {
      timeout: 5_000,
    },
  )
}

function patchPluginPermissions(
  pluginId: string,
  permissions: BuiltinPlugin["manifest"]["permissions"],
): void {
  const plugin = requireBuiltinPlugin(pluginId)
  setPluginPermissions(plugin, clonePermissions(permissions))
}

function patchLayoutToThrow(pluginId: string, viewId: string): void {
  const plugin = requireBuiltinPlugin(pluginId)
  plugin.activate = (context) => {
    context.registry.views.register(viewId, () => {
      throw new Error("E2E layout failure")
    })
  }
}

function requireBuiltinPlugin(pluginId: string): BuiltinPlugin {
  const plugin = builtinPlugins.find((item) => item.manifest.id === pluginId)
  if (!plugin) {
    throw new Error(`Builtin plugin was not found: ${pluginId}`)
  }
  return plugin
}

function restoreBuiltinPlugins(): void {
  for (const plugin of builtinPlugins) {
    const snapshot = builtinPluginSnapshots.get(plugin.manifest.id)
    if (!snapshot) continue
    plugin.activate = snapshot.activate
    setPluginPermissions(plugin, clonePermissions(snapshot.permissions))
  }
}

function setPluginPermissions(
  plugin: BuiltinPlugin,
  permissions: BuiltinPlugin["manifest"]["permissions"],
): void {
  if (permissions) {
    plugin.manifest.permissions = permissions
  } else {
    delete plugin.manifest.permissions
  }
}

function clonePermissions(
  permissions: BuiltinPlugin["manifest"]["permissions"],
): BuiltinPlugin["manifest"]["permissions"] {
  return permissions?.map((permission) => {
    if ("hosts" in permission && Array.isArray(permission.hosts)) {
      return { ...permission, hosts: [...permission.hosts] }
    }
    return { ...permission }
  })
}

async function enterSearchQuery(query: string): Promise<void> {
  const input = document.querySelector<HTMLInputElement>(
    '[data-search-command-bar] input[type="search"]',
  )
  if (!input) {
    throw new Error("Search input was not found")
  }
  await userEvent.click(input)
  input.focus()
  input.value = ""
  input.dispatchEvent(new InputEvent("input", { bubbles: true, data: "" }))
  await userEvent.type(input, query)
  await waitFor(() =>
    expect(
      [...document.querySelectorAll<HTMLElement>("[data-search-suggestion]")].some((node) =>
        node.textContent?.includes("使用 Google 搜索"),
      ),
    ).toBe(true),
  )
  const searchButton = [...document.querySelectorAll<HTMLElement>("[data-search-suggestion]")].find(
    (node) => node.textContent?.includes("使用 Google 搜索"),
  )
  if (!searchButton) {
    throw new Error("Web search suggestion was not found")
  }
  searchButton.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }))
}

function findButtonByText(selector: string, text: string): HTMLElement | null {
  return (
    [...document.querySelectorAll<HTMLElement>(selector)].find((node) =>
      node.textContent?.includes(text),
    ) ?? null
  )
}

function clickRequired(selector: string): void {
  const node = document.querySelector<HTMLElement>(selector)
  if (!node) {
    throw new Error(`Clickable element was not found: ${selector}`)
  }
  node.click()
}

function hasHorizontalOverflow(): boolean {
  return document.documentElement.scrollWidth > document.documentElement.clientWidth
}

function deleteDatabase(name: string): Promise<void> {
  return new Promise((resolve) => {
    const request = indexedDB.deleteDatabase(name)
    request.onsuccess = () => resolve()
    request.onerror = () => resolve()
    request.onblocked = () => resolve()
  })
}

async function waitFor(assertion: () => void | Promise<void>): Promise<void> {
  await vi.waitFor(assertion, { timeout: 2_000 })
}
