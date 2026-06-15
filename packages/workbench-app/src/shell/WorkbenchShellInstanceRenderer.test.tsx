import type { JSX } from "solid-js"
import type { PluginInstance, SearchViewProps, WidgetViewProps } from "@tabora/plugin-api"
import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"

import {
  createWorkbenchInstanceRenderer,
  workbenchSortableCollisionDetector,
} from "./WorkbenchShellInstanceRenderer"

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

function mount(element: JSX.Element) {
  const host = document.createElement("div")
  document.body.appendChild(host)
  const dispose = render(() => element, host)
  return { host, dispose }
}

function baseOptions(): Parameters<typeof createWorkbenchInstanceRenderer>[0] {
  return {
    registryViews: new Map<string, unknown>(),
    widgetContribution: () => ({
      views: { card: "widget.notes.card" },
    }),
    widgetRenderModel: () => ({
      title: "便签",
      icon: "pencil",
      currentSize: "M",
      supportedSizes: ["S", "M", "L"],
    }),
    findSearchContribution: () => ({
      id: "official.search.command-bar",
      title: "搜索",
      view: "official.search.command-bar.view",
    }),
    buildWidgetViewProps: () =>
      ({
        instanceId: "widget-1",
        pluginId: "plugin.widgets",
        contributionId: "widget.notes",
        size: "M",
        supportedSizes: ["S", "M", "L"],
        config: {},
        host: {} as WidgetViewProps["host"],
        data: {} as WidgetViewProps["data"],
      }) satisfies WidgetViewProps,
    buildSearchViewProps: () => ({ host: {} as SearchViewProps["host"] }) as SearchViewProps,
    renderWidgetIcon: () => <span>icon</span>,
    onOpenWidgetExpand: vi.fn(),
    onOpenWidgetContextMenu: vi.fn(),
    onChangeWidgetSize: vi.fn(),
    onRemoveWidget: vi.fn(),
    isDragging: () => false,
    sortableIndex: () => 0,
  }
}

describe("createWorkbenchInstanceRenderer", () => {
  it("renders widget error state when the widget model is missing", () => {
    const renderer = createWorkbenchInstanceRenderer({
      ...baseOptions(),
      widgetRenderModel: () => null,
    })

    const { host, dispose } = mount(renderer.renderWidget(instance()))
    expect(host.textContent).toContain("卡片实例无效")
    dispose()
  })

  it("renders localized widget error state when a shell translation function is provided", () => {
    const renderer = createWorkbenchInstanceRenderer({
      ...baseOptions(),
      widgetRenderModel: () => null,
      tShell: (key: string, vars?: Record<string, string | number>) => {
        if (key === "placeholders.widgetInstanceInvalid") {
          return `Invalid widget instance: ${String(vars?.instanceId)}`
        }
        return key
      },
    } as Parameters<typeof createWorkbenchInstanceRenderer>[0])

    const { host, dispose } = mount(renderer.renderWidget(instance()))
    expect(host.textContent).toContain("Invalid widget instance: widget-1")
    dispose()
  })

  it("renders the search contribution view when the view is registered", () => {
    const SearchView = (props: SearchViewProps) => <div>搜索 {props.entry}</div>
    const renderer = createWorkbenchInstanceRenderer({
      ...baseOptions(),
      registryViews: new Map<string, unknown>([["official.search.command-bar.view", SearchView]]),
      buildSearchViewProps: () =>
        ({
          entry: "inline",
          providers: [],
          defaultProviderId: "official.search.google",
          activeProviderId: "official.search.google",
          query: "",
          providerToken: null,
          recentSearches: [],
          results: [],
          activeResultIndex: -1,
          isOpen: false,
          host: {} as SearchViewProps["host"],
        }) satisfies SearchViewProps,
    })

    const { host, dispose } = mount(
      renderer.renderSearch(
        instance({
          id: "search-1",
          extensionPoint: "search",
          contributionId: "official.search.command-bar",
        }),
      ),
    )
    expect(host.textContent).toContain("搜索 inline")
    dispose()
  })

  it("renders a missing search placeholder when the contribution is absent", () => {
    const renderer = createWorkbenchInstanceRenderer({
      ...baseOptions(),
      findSearchContribution: () => undefined,
    })

    const { host, dispose } = mount(
      renderer.renderSearch(
        instance({
          id: "search-1",
          extensionPoint: "search",
          contributionId: "official.search.command-bar",
        }),
      ),
    )
    expect(host.textContent).toContain("搜索贡献未找到")
    dispose()
  })

  it("renders localized missing search placeholder when a shell translation function is provided", () => {
    const renderer = createWorkbenchInstanceRenderer({
      ...baseOptions(),
      findSearchContribution: () => undefined,
      tShell: (key: string) => {
        if (key === "placeholders.searchContributionMissing") return "Search contribution not found"
        return key
      },
    } as Parameters<typeof createWorkbenchInstanceRenderer>[0])

    const { host, dispose } = mount(
      renderer.renderSearch(
        instance({
          id: "search-1",
          extensionPoint: "search",
          contributionId: "official.search.command-bar",
        }),
      ),
    )
    expect(host.textContent).toContain("Search contribution not found")
    dispose()
  })

  it("passes injected copy to the widget shell", () => {
    const renderer = createWorkbenchInstanceRenderer({
      ...baseOptions(),
      registryViews: new Map<string, unknown>([["widget.notes.card", () => <div>Notes body</div>]]),
      widgetShellCopy: {
        removeAriaLabel: (title: string) => `Remove ${title}`,
      },
    } as Parameters<typeof createWorkbenchInstanceRenderer>[0])

    const { host, dispose } = mount(renderer.renderWidget(instance()))
    expect(host.querySelector("button.card-danger")?.getAttribute("aria-label")).toBe("Remove 便签")
    dispose()
  })

  it("passes injected copy to the plugin view boundary fallback", () => {
    const renderer = createWorkbenchInstanceRenderer({
      ...baseOptions(),
      registryViews: new Map<string, unknown>([
        [
          "widget.notes.card",
          () => {
            throw new Error("boom")
          },
        ],
      ]),
      pluginViewBoundaryCopy: {
        loadFailed: "Plugin view failed to load",
        retry: "Retry",
      },
    } as Parameters<typeof createWorkbenchInstanceRenderer>[0])

    const { host, dispose } = mount(renderer.renderWidget(instance()))
    expect(host.textContent).toContain("Plugin view failed to load")
    expect(host.querySelector(".plugin-error-retry-btn")?.textContent).toBe("Retry")
    dispose()
  })

  it("opens the widget context menu when right-clicking the sortable title handle", () => {
    const onOpenWidgetContextMenu = vi.fn()
    const renderer = createWorkbenchInstanceRenderer({
      ...baseOptions(),
      registryViews: new Map<string, unknown>([["widget.notes.card", () => <div>Notes body</div>]]),
      onOpenWidgetContextMenu,
    })

    const { host, dispose } = mount(renderer.renderWidget(instance()))
    const title = host.querySelector(".card-title") as HTMLElement
    const event = new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
      clientX: 48,
      clientY: 72,
      button: 2,
    })

    title.dispatchEvent(event)

    expect(onOpenWidgetContextMenu).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "contextmenu",
        clientX: 48,
        clientY: 72,
      }),
      "widget-1",
    )
    dispose()
  })
})

describe("workbenchSortableCollisionDetector", () => {
  const baseInput = {
    droppable: {
      id: "target",
      shape: {
        center: { x: 100, y: 100 },
        boundingRectangle: {
          left: 0,
          top: 0,
          right: 200,
          bottom: 200,
          width: 200,
          height: 200,
        },
      },
    },
  }

  it("ignores the target edge so card swaps do not flicker at boundaries", () => {
    const collision = workbenchSortableCollisionDetector({
      ...baseInput,
      dragOperation: {
        position: { current: { x: 10, y: 100 } },
      },
    } as Parameters<typeof workbenchSortableCollisionDetector>[0])

    expect(collision).toBeNull()
  })

  it("accepts the target interior for sortable card swaps", () => {
    const collision = workbenchSortableCollisionDetector({
      ...baseInput,
      dragOperation: {
        position: { current: { x: 100, y: 100 } },
      },
    } as Parameters<typeof workbenchSortableCollisionDetector>[0])

    expect(collision).toEqual(
      expect.objectContaining({
        id: "target",
        priority: 3,
        type: 2,
      }),
    )
  })
})
