import { afterEach, describe, expect, it, vi } from "vitest"
import { page, userEvent } from "vitest/browser"
import { render } from "solid-js/web"
import { builtinPlugins } from "@tabora/builtin-plugin-registry"
import type { PluginModule } from "@tabora/plugin-api"
import type { LoadedPluginPackage } from "@tabora/platform-kernel"

// The dashboard is a host builtin, so the only way to exercise the host LayoutBoundary is to make
// the real DashboardLayout throw. The flag keeps every other test on the genuine component.
const forceLayoutThrowKey = "__TABORA_FORCE_LAYOUT_THROW__"

vi.mock(
  "../../../packages/workbench-app/src/surface/dashboard/dashboard-layout",
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import("../../../packages/workbench-app/src/surface/dashboard/dashboard-layout")
      >()
    return {
      ...actual,
      DashboardLayout: (props: Parameters<typeof actual.DashboardLayout>[0]) => {
        if ((globalThis as Record<string, unknown>)[forceLayoutThrowKey]) {
          throw new Error("E2E layout failure")
        }
        return actual.DashboardLayout(props)
      },
    }
  },
)

import { App } from "./App"

type PluginSnapshot = {
  activate: PluginModule["activate"]
  permissions: PluginModule["manifest"]["permissions"] | undefined
}

const builtinPluginSnapshots = new Map<string, PluginSnapshot>(
  builtinPlugins.map((plugin) => {
    return [
      plugin.module.manifest.id,
      {
        activate: plugin.module.activate.bind(plugin.module),
        permissions: clonePermissions(plugin.module.manifest.permissions),
      },
    ]
  }),
)

let disposeApp: (() => void) | undefined

describe("workbench governance smoke", () => {
  afterEach(async () => {
    disposeApp?.()
    disposeApp = undefined
    delete (globalThis as Record<string, unknown>)[forceLayoutThrowKey]
    restoreBuiltinPlugins()
    vi.restoreAllMocks()
    document.body.innerHTML = ""
    document.documentElement.removeAttribute("style")
    document.body.removeAttribute("style")
    window.history.replaceState({}, "", "/")
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
    patchPluginPermissions("official.search.command-bar", [
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

  it("shows an explicit layout error when the active layout view throws", async () => {
    ;(globalThis as Record<string, unknown>)[forceLayoutThrowKey] = true

    await mountFreshWorkbench({ readySelector: "[data-layout-unavailable]" })

    await waitFor(() => expect(document.querySelector("[data-layout-unavailable]")).toBeTruthy())
    await waitFor(() =>
      expect(document.querySelector("[data-layout-unavailable]")?.textContent).toContain(
        "E2E layout failure",
      ),
    )
    expect(document.querySelector("[data-layout-grid]")).toBeFalsy()
  })

  it("keeps settings categories in secondary routes and browser history", async () => {
    await mountFreshWorkbench()

    const settingsButton = document.querySelector<HTMLButtonElement>('button[aria-label="设置"]')
    expect(settingsButton).toBeTruthy()
    await userEvent.click(settingsButton!)
    await waitFor(() => expect(window.location.pathname).toBe("/settings/general"))
    expect(document.querySelector('[data-active-view="general"]')).toBeTruthy()

    const appearanceButton = document.querySelector<HTMLButtonElement>(
      '[data-settings-section="appearance"]',
    )
    expect(appearanceButton).toBeTruthy()
    await userEvent.click(appearanceButton!)
    await waitFor(() => expect(window.location.pathname).toBe("/settings/appearance"))
    expect(document.querySelector('[data-active-view="appearance"]')).toBeTruthy()

    window.history.back()
    await waitFor(() => expect(window.location.pathname).toBe("/settings/general"))
    expect(document.querySelector('[data-active-view="general"]')).toBeTruthy()

    const closeButton = document.querySelector<HTMLButtonElement>("[data-settings-close]")
    expect(closeButton).toBeTruthy()
    await userEvent.click(closeButton!)
    await waitFor(() => expect(window.location.pathname).toBe("/"))
    expect(document.querySelector('[data-workbench-overlay="settings"]')).toBeFalsy()
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
  permissions: PluginModule["manifest"]["permissions"],
): void {
  const plugin = requireBuiltinPlugin(pluginId)
  setPluginPermissions(plugin, clonePermissions(permissions))
}

function requireBuiltinPlugin(pluginId: string): LoadedPluginPackage {
  const plugin = builtinPlugins.find((item) => item.module.manifest.id === pluginId)
  if (!plugin) {
    throw new Error(`Builtin plugin was not found: ${pluginId}`)
  }
  return plugin
}

function restoreBuiltinPlugins(): void {
  for (const plugin of builtinPlugins) {
    const snapshot = builtinPluginSnapshots.get(plugin.module.manifest.id)
    if (!snapshot) continue
    plugin.module.activate = snapshot.activate
    setPluginPermissions(plugin, clonePermissions(snapshot.permissions))
  }
}

function setPluginPermissions(
  plugin: LoadedPluginPackage,
  permissions: PluginModule["manifest"]["permissions"],
): void {
  if (permissions) {
    plugin.module.manifest.permissions = permissions
  } else {
    delete plugin.module.manifest.permissions
  }
}

function clonePermissions(
  permissions: PluginModule["manifest"]["permissions"],
): PluginModule["manifest"]["permissions"] {
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
      [...document.querySelectorAll<HTMLElement>("[data-command-result-item]")].some((node) =>
        node.textContent?.includes("使用 Google 搜索"),
      ),
    ).toBe(true),
  )
  const searchButton = [
    ...document.querySelectorAll<HTMLElement>("[data-command-result-item]"),
  ].find((node) => node.textContent?.includes("使用 Google 搜索"))
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
