import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import { PluginManagerCard } from "./plugin-manager"

describe("PluginManagerCard", () => {
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
