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

function makeHost(overrides?: {
  layoutRun?: () => void
  layoutIcon?: string
  layoutLabel?: string
}): LayoutHostAPI {
  const addWidget = vi.fn()
  return {
    getGlobalActions: (surface) =>
      surface === "rail"
        ? [
            { id: "home", label: "分组 我的工作台", icon: "T", run: vi.fn() },
            { id: "add-widget", label: "添加卡片", icon: "+", run: vi.fn() },
            {
              id: "layout-switch",
              label: overrides?.layoutLabel ?? "切换到专注",
              icon: overrides?.layoutIcon ?? "layout-focus",
              run: overrides?.layoutRun ?? vi.fn(),
            },
            { id: "theme", label: "切换主题", icon: "☼", run: vi.fn() },
            { id: "settings", label: "设置", icon: "⚙", run: vi.fn() },
          ]
        : surface === "menu"
          ? [{ id: "add-widget", label: "添加卡片", icon: "+", run: addWidget }]
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

  it("rail plus creates a group instead of opening add-widget", () => {
    const host = document.createElement("div")
    document.body.appendChild(host)
    const layoutHost = makeHost()
    const dispose = render(
      () => (
        <DashboardLayout
          isMobile={false}
          host={layoutHost}
          regions={{ topbar: makeSlot("topbar"), mainGrid: makeSlot("mainGrid") }}
        />
      ),
      host,
    )

    host.querySelector<HTMLButtonElement>('button[aria-label="新建分组"]')?.click()
    expect(host.querySelector(".dash-inline-pop.open")).toBeTruthy()
    const input = host.querySelector<HTMLInputElement>(".dash-inline-pop input")
    input!.value = "Research"
    input!.dispatchEvent(new InputEvent("input", { bubbles: true }))
    input!.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }))

    expect(host.querySelector('button[aria-label="分组 Research"]')).toBeTruthy()
    expect(layoutHost.openAddWidget).not.toHaveBeenCalled()
    dispose()
  })

  it("rail layout button opens prototype switch popover before running layout action", () => {
    const host = document.createElement("div")
    document.body.appendChild(host)
    const layoutRun = vi.fn()
    const dispose = render(
      () => (
        <DashboardLayout
          isMobile={false}
          host={makeHost({ layoutRun })}
          regions={{ topbar: makeSlot("topbar"), mainGrid: makeSlot("mainGrid") }}
        />
      ),
      host,
    )

    host.querySelector<HTMLButtonElement>('button[aria-label="切换布局"]')?.click()
    expect(host.querySelector(".dash-layout-switch-pop.open")).toBeTruthy()
    expect(host.querySelector(".dash-layout-switch-header")?.textContent).toBe("布局")
    expect(host.querySelector(".dash-layout-switch-item.active")?.textContent).toContain(
      "Dashboard",
    )
    expect(host.querySelector(".dash-layout-switch-item.active")?.textContent).toContain("✓")
    expect(host.querySelector(".dash-layout-switch-pop")?.textContent).toContain(
      "控制面板：多卡片并列",
    )
    expect(host.querySelector(".dash-layout-switch-pop")?.textContent).toContain(
      "深度专注：主卡 + 卫星",
    )

    const items = host.querySelectorAll<HTMLButtonElement>(".dash-layout-switch-item")
    items[0]?.click()
    expect(layoutRun).not.toHaveBeenCalled()
    expect(host.querySelector(".dash-layout-switch-pop.open")).toBeFalsy()

    host.querySelector<HTMLButtonElement>('button[aria-label="切换布局"]')?.click()
    items[1]?.click()
    expect(layoutRun).toHaveBeenCalledTimes(1)
    expect(host.querySelector(".dash-layout-switch-pop.open")).toBeFalsy()
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
