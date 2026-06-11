import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import type { JSX } from "solid-js"
import type { LayoutHostAPI, PluginInstance, RegionSlot } from "@tabora/plugin-api"
import { DashboardLayout, FocusLayout, layoutDashboard } from "./index"

function instance(overrides: Partial<PluginInstance>): PluginInstance {
  return {
    id: "widget-1",
    workspaceId: "workspace-1",
    pluginId: "official.widgets.today-focus",
    contributionId: "today-focus",
    extensionPoint: "widget",
    regionId: "focus",
    enabled: true,
    config: {},
    size: "M",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  }
}

function makeHost(): LayoutHostAPI {
  return {
    getGlobalActions: (surface) =>
      surface === "rail"
        ? [
            { id: "home", label: "分组 我的工作台", icon: "T", run: vi.fn() },
            { id: "add-widget", label: "添加卡片", icon: "+", run: vi.fn() },
            { id: "layout-switch", label: "切换到专注", icon: "layout-focus", run: vi.fn() },
            { id: "theme", label: "切换主题", icon: "☼", run: vi.fn() },
            { id: "settings", label: "设置", icon: "⚙", run: vi.fn() },
          ]
        : [],
    openSettings: vi.fn(),
    openCommandPalette: vi.fn(),
    openAddWidget: vi.fn(),
    toggleTheme: vi.fn(),
    isDark: () => false,
  }
}

function makeSlot(id: string): RegionSlot<JSX.Element> {
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
    expect(host.querySelectorAll("button.dash-rail-btn").length).toBe(5)
    expect(host.querySelector("[data-testid='region-mainGrid']")).toBeTruthy()
    dispose()
  })
})

describe("FocusLayout", () => {
  it("渲染 rail、focus hero 和 satellite 切换入口", () => {
    const host = document.createElement("div")
    document.body.appendChild(host)
    const dispose = render(
      () => (
        <FocusLayout
          isMobile={false}
          host={makeHost()}
          regions={{
            focus: {
              ...makeSlot("focus"),
              instances: [
                instance({
                  id: "today-focus-1",
                  pluginId: "official.widgets.today-focus",
                  contributionId: "today-focus",
                  size: "M",
                }),
                instance({
                  id: "todo-1",
                  pluginId: "official.widgets.todo",
                  contributionId: "todo",
                  size: "S",
                }),
              ],
              renderInstance: (instance) => <div data-testid={`focus-instance-${instance.id}`} />,
            },
          }}
        />
      ),
      host,
    )
    expect(host.querySelectorAll("button.dash-rail-btn").length).toBe(5)
    expect(host.querySelector("[data-layout='focus']")).toBeTruthy()
    expect(host.querySelector("[data-testid='focus-instance-today-focus-1']")).toBeTruthy()
    expect(host.querySelector("button.focus-satellite")).toBeTruthy()
    dispose()
  })
})

describe("layoutDashboard manifest", () => {
  it("在同一个插件中声明 dashboard 和 focus 两个布局", () => {
    const layouts = layoutDashboard.manifest.contributes.layouts!
    expect(layouts.map((layout) => layout.id)).toEqual([
      "official.layout.workbench-dashboard",
      "official.layout.workbench-focus",
    ])
    expect(layouts.every((layout) => layout.view)).toBe(true)
    expect(layouts[1]!.regions).toEqual([
      { id: "focus", title: "专注卡片", accepts: ["widget"], required: true },
    ])
  })
})
