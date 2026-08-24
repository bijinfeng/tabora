import type { JSX } from "solid-js"
import { render } from "solid-js/web"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { LayoutHostAPI, PluginInstance } from "@tabora/plugin-api"

const dashboardLayout = vi.hoisted(() =>
  vi.fn((props: { isMobile: boolean; regions: Record<string, unknown> }) => (
    <div data-layout="dashboard" {...(props.isMobile ? { "data-mobile": "" } : {})}>
      regions:{Object.keys(props.regions).join(",")}
    </div>
  )),
)

vi.mock("../surface/dashboard/dashboard-layout", () => ({
  DashboardLayout: dashboardLayout,
}))

import { createWorkbenchLayoutRenderer } from "./WorkbenchShellLayoutRenderer"

function instance(overrides: Partial<PluginInstance> = {}): PluginInstance {
  return {
    id: "widget-1",
    workspaceId: "workspace-1",
    contribution: { pluginId: "plugin.widgets", kind: "widget", id: "widget.notes" },
    regionId: "mainGrid",
    enabled: true,
    size: "M",
    config: {},
    createdAt: "2026-06-07T00:00:00.000Z",
    updatedAt: "2026-06-07T00:00:00.000Z",
    ...overrides,
  }
}

function mount(element: JSX.Element) {
  const host = document.createElement("div")
  document.body.appendChild(host)
  const dispose = render(() => element, host)
  return { host, dispose }
}

function baseOptions(): Parameters<typeof createWorkbenchLayoutRenderer>[0] {
  return {
    activeLayoutId: () => "layout.dashboard",
    layoutError: () => null,
    displayedInstances: () => [instance()],
    buildRegionSlots: vi.fn(() => ({})),
    buildHostAPI: vi.fn(() => ({}) as LayoutHostAPI),
    isMobile: () => false,
    clearLayoutError: vi.fn(),
    recordLayoutError: vi.fn(),
  }
}

describe("createWorkbenchLayoutRenderer", () => {
  beforeEach(() => {
    dashboardLayout.mockClear()
    dashboardLayout.mockImplementation(
      (props: { isMobile: boolean; regions: Record<string, unknown> }) => (
        <div data-layout="dashboard" {...(props.isMobile ? { "data-mobile": "" } : {})}>
          regions:{Object.keys(props.regions).join(",")}
        </div>
      ),
    )
  })

  it("renders the builtin dashboard layout with computed regions and host api", () => {
    const options = baseOptions()

    const { host, dispose } = mount(createWorkbenchLayoutRenderer(options).renderActiveLayout())

    expect(host.querySelector("[data-layout='dashboard']")).toBeTruthy()
    expect(options.buildRegionSlots).toHaveBeenCalledWith("layout.dashboard", [
      expect.objectContaining({ id: "widget-1" }),
    ])
    expect(options.buildHostAPI).toHaveBeenCalled()
    expect(options.clearLayoutError).toHaveBeenCalled()

    dispose()
    host.remove()
  })

  it("renders mobile breakpoint when isMobile returns true", () => {
    const options = baseOptions()
    options.isMobile = () => true

    const { host, dispose } = mount(createWorkbenchLayoutRenderer(options).renderActiveLayout())

    expect(host.querySelector("[data-layout='dashboard'][data-mobile]")).toBeTruthy()

    dispose()
    host.remove()
  })

  it("shows the recorded layout error without retrying the layout", () => {
    const options = baseOptions()
    options.layoutError = () => ({
      layoutId: "layout.dashboard",
      message: "router failed",
    })

    const { host, dispose } = mount(createWorkbenchLayoutRenderer(options).renderActiveLayout())

    expect(host.querySelector("[data-layout-unavailable]")).toBeTruthy()
    expect(host.textContent).toContain("router failed")
    expect(options.buildRegionSlots).not.toHaveBeenCalled()
    expect(options.buildHostAPI).not.toHaveBeenCalled()

    dispose()
    host.remove()
  })

  it("catches thrown layout errors and records them", () => {
    const options = baseOptions()
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    dashboardLayout.mockImplementation(() => {
      throw new Error("layout crashed")
    })

    const { host, dispose } = mount(createWorkbenchLayoutRenderer(options).renderActiveLayout())

    expect(host.querySelector("[data-layout-unavailable]")).toBeTruthy()
    expect(host.textContent).toContain("布局渲染失败")
    expect(options.recordLayoutError).toHaveBeenCalledWith(
      "layout.dashboard",
      expect.objectContaining({ message: "layout crashed" }),
    )
    expect(consoleError).toHaveBeenCalledWith("Layout error:", expect.any(Error))

    consoleError.mockRestore()
    dispose()
    host.remove()
  })
})
