import { afterEach, describe, expect, it } from "vitest"
import type { ResolvedPluginStyle } from "@tabora/platform-kernel"

import { activePluginStyles, createPluginStyleManager } from "./pluginStyleManager"

function style(overrides: Partial<ResolvedPluginStyle> = {}): ResolvedPluginStyle {
  return {
    pluginId: "plugin.a",
    href: "data:text/css,.plugin-a{}",
    sourceHref: "./styles.css",
    scope: "plugin",
    order: 0,
    source: "builtin",
    ...overrides,
  }
}

function links() {
  return Array.from(
    document.head.querySelectorAll<HTMLLinkElement>("link[data-tabora-plugin-style]"),
  )
}

describe("createPluginStyleManager", () => {
  afterEach(() => {
    document.head.innerHTML = ""
  })

  it("inserts plugin stylesheets in deterministic order", () => {
    const manager = createPluginStyleManager(document)

    manager.apply([
      style({ pluginId: "plugin.b", href: "data:text/css,.plugin-b{}", order: 20 }),
      style({ pluginId: "plugin.a", href: "data:text/css,.plugin-a{}", order: 10 }),
    ])

    expect(links().map((link) => link.href)).toEqual([
      "data:text/css,.plugin-a{}",
      "data:text/css,.plugin-b{}",
    ])
    expect(links()[0]?.dataset.taboraPluginStyle).toBe("plugin.a")
    expect(links()[0]?.dataset.taboraStyleScope).toBe("plugin")
  })

  it("removes stylesheets that are no longer active", () => {
    const manager = createPluginStyleManager(document)

    manager.apply([
      style({ pluginId: "plugin.a", href: "data:text/css,.plugin-a{}" }),
      style({ pluginId: "plugin.b", href: "data:text/css,.plugin-b{}" }),
    ])
    manager.apply([style({ pluginId: "plugin.b", href: "data:text/css,.plugin-b{}" })])

    expect(links().map((link) => link.dataset.taboraPluginStyle)).toEqual(["plugin.b"])
  })

  it("cleans up managed stylesheets on dispose", () => {
    const manager = createPluginStyleManager(document)

    manager.apply([style()])
    manager.dispose()

    expect(links()).toEqual([])
  })
})

describe("activePluginStyles", () => {
  it("keeps styles only for active plugins", () => {
    expect(
      activePluginStyles({
        styles: [
          style({ pluginId: "plugin.enabled", href: "data:text/css,.enabled{}" }),
          style({ pluginId: "plugin.disabled", href: "data:text/css,.disabled{}" }),
          style({ pluginId: "plugin.skipped", href: "data:text/css,.skipped{}" }),
        ],
        plugins: [
          {
            manifest: {
              id: "plugin.enabled",
              name: "Enabled",
              version: "1.0.0",
              apiVersion: "1.0.0",
              entry: "./index",
              engine: { platform: "tabora" },
              contributes: {},
            },
            enabled: true,
            activate() {},
          },
          {
            manifest: {
              id: "plugin.disabled",
              name: "Disabled",
              version: "1.0.0",
              apiVersion: "1.0.0",
              entry: "./index",
              engine: { platform: "tabora" },
              contributes: {},
            },
            enabled: true,
            activate() {},
          },
          {
            manifest: {
              id: "plugin.skipped",
              name: "Skipped",
              version: "1.0.0",
              apiVersion: "1.0.0",
              entry: "./index",
              engine: { platform: "tabora" },
              contributes: {},
            },
            enabled: true,
            activate() {},
          },
        ],
        records: [
          { id: "plugin.enabled", enabled: true, status: "active" },
          { id: "plugin.disabled", enabled: false, status: "disabled" },
          { id: "plugin.skipped", enabled: false, status: "skipped" },
        ],
      }).map((pluginStyle) => pluginStyle.pluginId),
    ).toEqual(["plugin.enabled"])
  })
})
