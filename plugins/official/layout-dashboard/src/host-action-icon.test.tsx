import { render } from "solid-js/web"
import { describe, expect, it } from "vitest"
import { HostActionIcon } from "./host-action-icon"

describe("HostActionIcon", () => {
  it("uses prototype SVG glyphs for rail actions", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    const dispose = render(
      () => (
        <>
          <HostActionIcon id="add-widget" icon="+" />
          <HostActionIcon id="layout-switch" icon="layout-focus" />
          <HostActionIcon id="layout-switch" icon="layout-dashboard" />
          <HostActionIcon id="theme" icon="☼" />
          <HostActionIcon id="settings" icon="⚙" />
          <HostActionIcon id="plugin-manager" icon="◈" />
        </>
      ),
      root,
    )

    expect(root.querySelectorAll("line[x1='12'][y1='5']")).toHaveLength(1)
    const svgs = root.querySelectorAll("svg")
    const dashboardLayoutSwitch = svgs[1] as SVGSVGElement
    const focusLayoutSwitch = svgs[2] as SVGSVGElement
    expect(dashboardLayoutSwitch.querySelectorAll("rect[rx='1.2']")).toHaveLength(4)
    expect(focusLayoutSwitch.querySelectorAll("rect[rx='1.2']")).toHaveLength(4)
    expect(root.querySelector("circle[cx='12'][cy='12'][r='5']")).toBeTruthy()
    expect(root.querySelector("path[d^='M19.4 15']")).toBeTruthy()
    expect(root.textContent).toContain("◈")
    dispose()
    root.remove()
  })
})
