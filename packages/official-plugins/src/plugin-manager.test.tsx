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
              grantedPermissions: [],
              contributionKinds: [],
            },
          ]}
          host={{ togglePluginEnabled: vi.fn() } as never}
        />
      ),
      root,
    )

    expect(root.querySelector("[data-plugin-settings-card]")).toBeTruthy()
    expect(root.querySelector(".plugin-settings-stack")).toBeNull()
    expect(root.textContent).toContain("不兼容")
    expect(root.textContent).toContain('Unsupported platform "web"')
    expect(root.textContent).toContain("需要能力 localFile")
    root.remove()
  })

  it("revokes only granted permissions and leaves just-in-time ones to re-prompt", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    const revokePluginPermission = vi.fn(async () => {})

    render(
      () => (
        <PluginManagerCard
          plugins={[
            {
              id: "plugin.weather",
              name: "Weather",
              version: "1.0.0",
              enabled: true,
              permissions: [
                { type: "network", hosts: ["api.example.com"] },
                { type: "external-open", hosts: ["example.com"] },
              ],
              grantedPermissions: [{ type: "network", hosts: ["api.example.com"] }],
              contributionKinds: [],
            },
          ]}
          host={{ revokePluginPermission } as never}
        />
      ),
      root,
    )

    const revokeButtons = root.querySelectorAll('button[aria-label^="撤销"]')
    expect(revokeButtons).toHaveLength(1)
    expect(root.textContent).toContain("已授权")
    expect(root.textContent).toContain("使用时请求")
    ;(revokeButtons[0] as HTMLButtonElement).click()
    expect(revokePluginPermission).toHaveBeenCalledWith("plugin.weather", {
      type: "network",
      hosts: ["api.example.com"],
    })
    root.remove()
  })

  it("hides revoke controls when the host cannot manage plugins", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)

    render(
      () => (
        <PluginManagerCard
          plugins={[
            {
              id: "plugin.weather",
              name: "Weather",
              version: "1.0.0",
              enabled: true,
              permissions: [{ type: "network", hosts: ["api.example.com"] }],
              grantedPermissions: [{ type: "network", hosts: ["api.example.com"] }],
              contributionKinds: [],
            },
          ]}
          host={{} as never}
        />
      ),
      root,
    )

    expect(root.querySelector('button[aria-label^="撤销"]')).toBeNull()
    expect(root.textContent).toContain("已授权")
    root.remove()
  })
})
