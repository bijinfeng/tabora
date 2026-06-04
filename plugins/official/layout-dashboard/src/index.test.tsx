import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import type { LayoutHostAPI, RegionSlot } from "@tabora/plugin-api"
import { DashboardLayout, layoutDashboard } from "./index"

function makeHost(): LayoutHostAPI {
  return {
    getGlobalActions: (surface) =>
      surface === "rail"
        ? [
            { id: "settings", label: "设置", icon: "⚙", run: vi.fn() },
            { id: "command", label: "搜索", icon: "⌘", run: vi.fn() },
          ]
        : [],
    openSettings: vi.fn(),
    openCommandPalette: vi.fn(),
    openAddWidget: vi.fn(),
    toggleTheme: vi.fn(),
    isDark: () => false,
  }
}

function makeSlot(id: string): RegionSlot {
  return {
    regionId: id,
    title: id,
    accepts: ["widget"],
    instances: [],
    isEmpty: true,
    render: () => <div data-testid={`region-${id}`}>{id}</div>,
    renderInstance: () => null,
  }
}

describe("DashboardLayout", () => {
  it("渲染 rail 强制入口与 mainGrid", () => {
    const host = document.createElement("div")
    document.body.appendChild(host)
    const dispose = render(
      () => (
        <DashboardLayout
          isMobile={false}
          host={makeHost()}
          regions={{ topbar: makeSlot("topbar"), mainGrid: makeSlot("mainGrid") }}
        />
      ),
      host,
    )
    expect(host.querySelectorAll("button.dash-rail-btn").length).toBe(2)
    expect(host.querySelector("[data-testid='region-mainGrid']")).toBeTruthy()
    dispose()
  })
})

describe("layoutDashboard manifest", () => {
  it("声明 widget region 且 view 必填", () => {
    const layout = layoutDashboard.manifest.contributes.layouts![0]!
    expect(layout.regions.some((r) => r.accepts.includes("widget"))).toBe(true)
    expect(layout.view).toBeTruthy()
  })
})
