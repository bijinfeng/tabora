import type {
  LayoutHostAPI,
  PluginInstance,
  RegionSlot,
  WidgetSize,
  WidgetViewProps,
} from "@tabora/plugin-api"
import type { LayoutViewProps } from "@tabora/plugin-api"
import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import type { JSX } from "solid-js"

import {
  createWorkbenchLayoutRenderer,
  type WorkbenchSafeLayoutOptions,
} from "./WorkbenchShellLayoutRenderer"

function instance(overrides: Partial<PluginInstance> = {}): PluginInstance {
  return {
    id: "widget-1",
    workspaceId: "workspace-1",
    pluginId: "plugin.widgets",
    contributionId: "widget.notes",
    extensionPoint: "widget",
    regionId: "mainGrid",
    enabled: true,
    size: "M",
    config: {},
    createdAt: "2026-06-07T00:00:00.000Z",
    updatedAt: "2026-06-07T00:00:00.000Z",
    ...overrides,
  }
}

function mount(
  element: ReturnType<ReturnType<typeof createWorkbenchLayoutRenderer>["renderActiveLayout"]>,
) {
  const host = document.createElement("div")
  document.body.appendChild(host)
  const dispose = render(() => element, host)
  return { host, dispose }
}

function safeLayoutProps(): WorkbenchSafeLayoutOptions {
  return {
    isDark: () => false,
    instances: () => [instance()],
    widgetContribution: vi.fn(() => ({
      views: { card: "widget.notes.card" },
    })),
    resolveWidgetModel: vi.fn(
      (): {
        title: string
        icon: string
        currentSize: WidgetSize
        supportedSizes: WidgetSize[]
      } => ({
        title: "便签",
        icon: "pencil",
        currentSize: "M",
        supportedSizes: ["S", "M", "L"],
      }),
    ),
    getView: vi.fn(() => undefined),
    renderWidgetIcon: vi.fn(() => <span>icon</span>),
    buildWidgetViewProps: vi.fn(),
    onOpenCommandPalette: vi.fn(),
    onToggleTheme: vi.fn(),
    onOpenSettings: vi.fn(),
    onOpenExpand: vi.fn(),
    onOpenContextMenu: vi.fn(),
    onResize: vi.fn(),
    onRemove: vi.fn(),
    isDragging: vi.fn(() => false),
  }
}

describe("createWorkbenchLayoutRenderer", () => {
  it("falls back to the safe layout when the active layout view is unavailable", () => {
    const renderer = createWorkbenchLayoutRenderer({
      activeLayoutId: () => "layout.missing",
      displayedInstances: () => [instance()],
      findLayoutContribution: () => undefined,
      resolveLayoutView: () => undefined,
      buildRegionSlots: vi.fn(),
      buildHostAPI: vi.fn(),
      isMobile: () => false,
      clearLayoutError: vi.fn(),
      recordLayoutError: vi.fn(),
      safeLayout: safeLayoutProps(),
    })

    const { host, dispose } = mount(renderer.renderActiveLayout())

    expect(host.textContent).toContain("Tabora")

    dispose()
    host.remove()
  })

  it("preserves plugin style scope when rendering safe layout widget views", () => {
    const safeLayout = safeLayoutProps()
    safeLayout.getView = vi.fn(() => (props: WidgetViewProps) => (
      <div>widget view {props.instanceId}</div>
    ))
    safeLayout.buildWidgetViewProps = vi.fn(
      (widgetInstance): WidgetViewProps => ({
        pluginId: widgetInstance.pluginId,
        instanceId: widgetInstance.id,
        contributionId: widgetInstance.contributionId,
        size: widgetInstance.size ?? "M",
        supportedSizes: ["S", "M", "L"],
        config: {},
        data: {
          get: vi.fn(async () => undefined),
          save: vi.fn(async () => {}),
        },
        host: {
          updateConfig: vi.fn(async () => {}),
          removeInstance: vi.fn(async () => {}),
          requestResize: vi.fn(async () => {}),
          openModal: vi.fn(),
          closeModal: vi.fn(),
          openExpand: vi.fn(),
          showToast: vi.fn(),
          openExternal: vi.fn(async () => true),
        },
      }),
    )

    const renderer = createWorkbenchLayoutRenderer({
      activeLayoutId: () => "layout.missing",
      displayedInstances: () => [instance()],
      findLayoutContribution: () => undefined,
      resolveLayoutView: () => undefined,
      buildRegionSlots: vi.fn(),
      buildHostAPI: vi.fn(),
      isMobile: () => false,
      clearLayoutError: vi.fn(),
      recordLayoutError: vi.fn(),
      safeLayout,
    })

    const { host, dispose } = mount(renderer.renderActiveLayout())

    expect(host.querySelector('[data-tabora-plugin-id="plugin.widgets"]')).toBeTruthy()

    dispose()
    host.remove()
  })

  it("renders the plugin-provided layout view with computed regions and host api", () => {
    const buildRegionSlots = vi.fn(
      (): Record<string, RegionSlot<JSX.Element>> => ({
        main: {
          regionId: "main",
          title: "Main",
          accepts: ["widget"],
          instances: [instance()],
          render: vi.fn(() => <div>widget</div>),
          renderInstance: vi.fn(),
          isEmpty: false,
        },
      }),
    )
    const hostApi: LayoutHostAPI = {
      getGlobalActions: vi.fn(() => []),
      openSettings: vi.fn(),
      openCommandPalette: vi.fn(),
      openAddWidget: vi.fn(),
      readLayoutState: vi.fn(),
      writeLayoutState: vi.fn(),
      showToast: vi.fn(),
      toggleTheme: vi.fn(),
      isDark: vi.fn(() => false),
    }
    const buildHostAPI = vi.fn(() => hostApi)
    const LayoutView = vi.fn((props: LayoutViewProps<JSX.Element>) => (
      <div>
        layout {String(props.isMobile)} {props.regions.main!.regionId}
      </div>
    ))
    const clearLayoutError = vi.fn()

    const renderer = createWorkbenchLayoutRenderer({
      activeLayoutId: () => "layout.dashboard",
      displayedInstances: () => [instance()],
      findLayoutContribution: () => ({
        id: "layout.dashboard",
        title: "Dashboard",
        view: "layout.dashboard.view",
        regions: [{ id: "main", title: "Main", accepts: ["widget"] }],
        defaultRegions: {},
        supportsResponsive: true,
      }),
      resolveLayoutView: (viewId) => (viewId === "layout.dashboard.view" ? LayoutView : undefined),
      buildRegionSlots,
      buildHostAPI,
      isMobile: () => true,
      clearLayoutError,
      recordLayoutError: vi.fn(),
      safeLayout: safeLayoutProps(),
    })

    const { host, dispose } = mount(renderer.renderActiveLayout())

    expect(host.textContent).toContain("layout true main")
    expect(buildRegionSlots).toHaveBeenCalledWith("layout.dashboard", [
      expect.objectContaining({ id: "widget-1" }),
    ])
    expect(buildHostAPI).toHaveBeenCalled()
    expect(clearLayoutError).toHaveBeenCalled()
    expect(LayoutView).toHaveBeenCalledWith(
      expect.objectContaining({
        isMobile: true,
        regions: expect.objectContaining({
          main: expect.objectContaining({ regionId: "main" }),
        }),
        host: hostApi,
      }),
    )

    dispose()
    host.remove()
  })

  it("uses the safe layout without retrying the broken layout when the active layout already failed", () => {
    const buildRegionSlots = vi.fn()
    const buildHostAPI = vi.fn()
    const clearLayoutError = vi.fn()
    const LayoutView = vi.fn(() => <div>broken layout</div>)

    const renderer = createWorkbenchLayoutRenderer({
      activeLayoutId: () => "layout.dashboard",
      failedLayoutId: () => "layout.dashboard",
      displayedInstances: () => [instance()],
      findLayoutContribution: () => ({
        id: "layout.dashboard",
        title: "Dashboard",
        view: "layout.dashboard.view",
        regions: [{ id: "main", title: "Main", accepts: ["widget"] }],
        defaultRegions: {},
        supportsResponsive: true,
      }),
      resolveLayoutView: (viewId) => (viewId === "layout.dashboard.view" ? LayoutView : undefined),
      buildRegionSlots,
      buildHostAPI,
      isMobile: () => false,
      clearLayoutError,
      recordLayoutError: vi.fn(),
      safeLayout: safeLayoutProps(),
    })

    const { host, dispose } = mount(renderer.renderActiveLayout())

    expect(host.textContent).toContain("Tabora")
    expect(LayoutView).not.toHaveBeenCalled()
    expect(buildRegionSlots).not.toHaveBeenCalled()
    expect(buildHostAPI).not.toHaveBeenCalled()
    expect(clearLayoutError).not.toHaveBeenCalled()

    dispose()
    host.remove()
  })
})
