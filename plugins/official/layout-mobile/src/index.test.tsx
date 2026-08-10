import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import type { JSX } from "solid-js"
import type { LayoutHostAPI, LayoutInstance, RegionSlot } from "@tabora/plugin-api/sdk"
import { MobileLayout } from "./index"

function instance(overrides: Partial<LayoutInstance>): LayoutInstance {
  return {
    id: "widget-1",
    contribution: { pluginId: "official.widgets.weather", kind: "widget", id: "weather" },
    regionId: "mainGrid",
    enabled: true,
    config: {},
    size: "M",
    ...overrides,
  }
}

function makeHost(overrides?: { layoutState?: unknown }): LayoutHostAPI {
  return {
    getGlobalActions: (surface) =>
      surface === "rail"
        ? [
            { id: "home", label: "分组 我的工作台", icon: "home", run: vi.fn() },
            { id: "theme", label: "切换主题", icon: "moon", run: vi.fn() },
            { id: "settings", label: "设置", icon: "settings", run: vi.fn() },
          ]
        : surface === "menu"
          ? [{ id: "add-widget", label: "添加卡片", icon: "plus", run: vi.fn() }]
          : [],
    openSettings: vi.fn(),
    openCommandPalette: vi.fn(),
    openAddWidget: vi.fn(),
    showToast: vi.fn(),
    readLayoutState: <T = unknown,>() => overrides?.layoutState as T | undefined,
    writeLayoutState: vi.fn(),
    toggleTheme: vi.fn(),
    isDark: () => false,
  }
}

function makeSlot(id: string, instances: LayoutInstance[] = []): RegionSlot<JSX.Element> {
  return {
    regionId: id,
    title: id,
    accepts: ["widget"],
    instances,
    isEmpty: instances.length === 0,
    render: () => <div data-testid={`region-${id}`}>{id}</div>,
    renderInstance: (current) => <div data-testid={`instance-${current.id}`}>{current.id}</div>,
  }
}

describe("MobileLayout", () => {
  it("renders the bottom bar, search topbar, and a single-column widget list", () => {
    const host = document.createElement("div")
    document.body.appendChild(host)
    const dispose = render(
      () => (
        <MobileLayout
          isMobile={true}
          host={makeHost()}
          regions={{
            topbar: makeSlot("topbar"),
            mainGrid: makeSlot("mainGrid", [instance({ id: "weather-1" })]),
          }}
        />
      ),
      host,
    )

    expect(host.querySelector("[data-layout='mobile']")).toBeTruthy()
    expect(host.querySelector("[data-workbench-mobile-bar]")).toBeTruthy()
    expect(host.querySelector("[data-mobile-greeting]")).toBeTruthy()
    expect(host.querySelector("[data-testid='instance-weather-1']")).toBeTruthy()
    dispose()
    host.remove()
  })

  it("merges mainGrid and focus widgets into one list", () => {
    const host = document.createElement("div")
    document.body.appendChild(host)
    const dispose = render(
      () => (
        <MobileLayout
          isMobile={true}
          host={makeHost()}
          regions={{
            mainGrid: makeSlot("mainGrid", [instance({ id: "notes-1" })]),
            focus: makeSlot("focus", [instance({ id: "todo-1", regionId: "focus" })]),
          }}
        />
      ),
      host,
    )

    expect(host.querySelector("[data-testid='instance-notes-1']")).toBeTruthy()
    expect(host.querySelector("[data-testid='instance-todo-1']")).toBeTruthy()
    dispose()
    host.remove()
  })

  it("shows the empty state when the active group has no widgets", () => {
    const host = document.createElement("div")
    document.body.appendChild(host)
    const dispose = render(
      () => (
        <MobileLayout
          isMobile={true}
          host={makeHost()}
          regions={{
            mainGrid: makeSlot("mainGrid", []),
          }}
        />
      ),
      host,
    )

    expect(host.textContent).toContain("暂无卡片")
    dispose()
    host.remove()
  })
})
