import { render } from "solid-js/web"
import { describe, expect, it } from "vitest"
import { HostActionIcon } from "./host-action-icon"

describe("HostActionIcon", () => {
  it("uses Lucide SVG icons for rail actions", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    const dispose = render(
      () => (
        <>
          <HostActionIcon id="add-widget" icon="plus" />
          <HostActionIcon id="layout-switch" icon="layout-focus" />
          <HostActionIcon id="layout-switch" icon="layout-dashboard" />
          <HostActionIcon id="theme" icon="sun" />
          <HostActionIcon id="settings" icon="settings" />
          <HostActionIcon id="plugin-manager" icon="puzzle" />
        </>
      ),
      root,
    )

    expect(root.querySelectorAll("svg")).toHaveLength(6)
    expect(root.textContent).toBe("")
    dispose()
    root.remove()
  })
})
