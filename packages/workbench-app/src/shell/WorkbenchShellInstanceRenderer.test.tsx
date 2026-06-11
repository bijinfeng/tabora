import type { JSX } from "solid-js"
import type { PluginInstance, SearchViewProps, WidgetViewProps } from "@tabora/plugin-api"
import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"

import { createWorkbenchInstanceRenderer } from "./WorkbenchShellInstanceRenderer"

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
})
