import type { JSX } from "solid-js"
import { render } from "solid-js/web"
import { describe, expect, it, vi } from "vitest"
import type { LayoutHostAPI, LayoutViewProps, PluginInstance } from "@tabora/plugin-api"

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
  const LayoutView = (props: LayoutViewProps<JSX.Element>) => (
    <div>
      layout {String(props.isMobile)} {Object.keys(props.regions).join(",")}
    </div>
  )

  return {
    activeLayoutId: () => "layout.dashboard",
    layoutError: () => null,
    displayedInstances: () => [instance()],
    findLayoutContribution: () => ({
      id: "layout.dashboard",
      title: "Dashboard",
      view: "layout.dashboard.view",
      regions: [{ id: "main", title: "Main", accepts: ["widget"] }],
      defaultRegions: {},
      supportsResponsive: true,
    }),
    resolveLayoutView: () => LayoutView,
    buildRegionSlots: vi.fn(() => ({})),
    buildHostAPI: vi.fn(() => ({}) as LayoutHostAPI),
    isMobile: () => true,
    clearLayoutError: vi.fn(),
    recordLayoutError: vi.fn(),
  }
}

describe("createWorkbenchLayoutRenderer", () => {
  it("shows an explicit unavailable state when the layout plugin is missing", () => {
    const options = baseOptions()
    const renderer = createWorkbenchLayoutRenderer({
      ...options,
      findLayoutContribution: () => undefined,
      resolveLayoutView: () => undefined,
    })

    const { host, dispose } = mount(renderer.renderActiveLayout())

    expect(host.querySelector("[data-layout-unavailable]")).toBeTruthy()
    expect(host.textContent).toContain("没有可用的布局插件")
    expect(host.textContent).toContain("布局插件未注册")

    dispose()
    host.remove()
  })

  it("renders the plugin-provided layout view with computed regions and host api", () => {
    const options = baseOptions()
    const LayoutView = vi.fn((props: LayoutViewProps<JSX.Element>) => (
      <div>
        layout {String(props.isMobile)} {Object.keys(props.regions).join(",")}
      </div>
    ))
    options.resolveLayoutView = () => LayoutView

    const { host, dispose } = mount(createWorkbenchLayoutRenderer(options).renderActiveLayout())

    expect(host.textContent).toContain("layout true")
    expect(options.buildRegionSlots).toHaveBeenCalledWith("layout.dashboard", [
      expect.objectContaining({ id: "widget-1" }),
    ])
    expect(options.buildHostAPI).toHaveBeenCalled()
    expect(options.clearLayoutError).toHaveBeenCalled()
    expect(LayoutView).toHaveBeenCalledWith(
      expect.objectContaining({
        isMobile: true,
        host: expect.anything(),
      }),
    )

    dispose()
    host.remove()
  })

  it("shows the recorded layout error without retrying the broken view", () => {
    const options = baseOptions()
    const LayoutView = vi.fn(() => <div>broken layout</div>)
    options.resolveLayoutView = () => LayoutView
    options.layoutError = () => ({
      layoutId: "layout.dashboard",
      message: "router failed",
    })

    const { host, dispose } = mount(createWorkbenchLayoutRenderer(options).renderActiveLayout())

    expect(host.querySelector("[data-layout-unavailable]")).toBeTruthy()
    expect(host.textContent).toContain("router failed")
    expect(LayoutView).not.toHaveBeenCalled()
    expect(options.buildRegionSlots).not.toHaveBeenCalled()
    expect(options.buildHostAPI).not.toHaveBeenCalled()

    dispose()
    host.remove()
  })

  it("records a thrown layout error and exposes the unavailable state", () => {
    const options = baseOptions()
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    options.resolveLayoutView = () => () => {
      throw new Error("layout crashed")
    }

    const { host, dispose } = mount(createWorkbenchLayoutRenderer(options).renderActiveLayout())

    expect(host.querySelector("[data-layout-unavailable]")).toBeTruthy()
    expect(host.textContent).toContain("布局插件渲染失败")
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
