import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import { PluginManagerCard } from "./plugin-manager"
import { officialPluginManager } from "./plugin-manager-entry"

describe("PluginManagerCard", () => {
  it("uses injected i18n for section titles and plugin status", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)

    const I18nPluginManagerCard = PluginManagerCard as unknown as (props: any) => any

    render(
      () => (
        <I18nPluginManagerCard
          plugins={[
            {
              id: "plugin.desktop",
              name: "Desktop Plugin",
              version: "1.0.0",
              enabled: false,
              status: "skipped",
              disabledReason: null,
              requiredCapabilities: [],
              supportedPlatforms: ["desktop-webview"],
              permissions: [],
              contributes: {},
            },
          ]}
          host={{ togglePluginEnabled: vi.fn() }}
          i18n={{
            t: (key: string) =>
              ({
                "pluginManager.installed.title": "Installed plugins",
                "pluginManager.audit.title": "Permission audit",
                "pluginManager.status.incompatible": "Incompatible",
              })[key] ?? key,
          }}
        />
      ),
      root,
    )

    expect(root.textContent).toContain("Installed plugins")
    expect(root.textContent).toContain("Permission audit")
    expect(root.textContent).toContain("Incompatible")
    root.remove()
  })

  it("shows incompatible plugin status and reason", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)

    render(
      () => (
        <PluginManagerCard
          plugins={[
            {
              id: "plugin.desktop",
              name: "Desktop Plugin",
              version: "1.0.0",
              enabled: false,
              status: "skipped",
              disabledReason: 'Unsupported platform "web"',
              requiredCapabilities: ["localFile"],
              supportedPlatforms: ["desktop-webview"],
              permissions: [],
              contributes: {},
            },
          ]}
          host={{ togglePluginEnabled: vi.fn() } as never}
        />
      ),
      root,
    )

    expect(root.textContent).toContain("不兼容")
    expect(root.textContent).toContain('Unsupported platform "web"')
    expect(root.textContent).toContain("需要能力 localFile")
    root.remove()
  })
})

describe("officialPluginManager", () => {
  it("injects i18n into the status widget view when available", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)

    const registered = new Map<string, (props: any) => any>()
    const i18n = {
      locale: vi.fn(() => "en-US"),
      registerMessages: vi.fn(),
      t: (key: string) =>
        ({
          "pluginManager.widget.stat.activeWidgets": "Active widgets",
        })[key] ?? key,
      formatDate: vi.fn(() => "DATE"),
      formatNumber: vi.fn(() => "NUM"),
    }

    void officialPluginManager.activate({
      i18n,
      registry: {
        views: {
          register: (id: string, view: any) => {
            registered.set(id, view)
          },
        },
      },
    } as any)

    const view = registered.get("official.plugin-manager.status-widget")
    expect(view).toBeTruthy()

    render(() => view!({}), root)

    expect(root.textContent).toContain("Active widgets")
    root.remove()
  })
})
