import type { PluginInstance, SearchViewProps, WidgetContribution } from "@tabora/plugin-api"
import type { JSX } from "solid-js"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { WidgetRenderModel } from "./shellHelpers"

const mocks = vi.hoisted(() => ({
  createWorkbenchInstanceRenderer: vi.fn(() => ({ sentinel: "instance-renderer" })),
  buildWorkbenchWidgetViewProps: vi.fn(() => ({ sentinel: "widget-view-props" })),
}))

vi.mock("./WorkbenchShellInstanceRenderer", () => ({
  createWorkbenchInstanceRenderer: mocks.createWorkbenchInstanceRenderer,
}))

vi.mock("./WorkbenchShellViewBridge", async () => {
  const actual = await vi.importActual<typeof import("./WorkbenchShellViewBridge")>(
    "./WorkbenchShellViewBridge",
  )
  return {
    ...actual,
    buildWorkbenchWidgetViewProps: mocks.buildWorkbenchWidgetViewProps,
  }
})

import { createWorkbenchShellViewRuntime } from "./WorkbenchShellViewRuntime"

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

describe("createWorkbenchShellViewRuntime", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("builds widget view props through the shared bridge with host callbacks", () => {
    const saveInstance = vi.fn(async () => {})
    const setInstances = vi.fn()
    const removeWidget = vi.fn(async () => {})
    const changeWidgetSize = vi.fn(async () => {})
    const setModalViewId = vi.fn()
    const setModalProps = vi.fn()
    const openWidgetExpand = vi.fn()
    const showToast = vi.fn()
    const openExternalForPlugin = vi.fn(() => true)
    const buildInlineSearchViewProps = vi.fn(() => ({}) as SearchViewProps)
    const runtime = createWorkbenchShellViewRuntime({
      registryViews: new Map<string, unknown>(),
      widgetContribution: vi.fn(
        (): Pick<WidgetContribution, "views"> => ({
          views: { card: "widget.notes.card" },
        }),
      ),
      widgetRenderModel: vi.fn(
        (): WidgetRenderModel => ({
          title: "便签",
          icon: "pencil",
          currentSize: "M",
          supportedSizes: ["S", "M", "L"],
        }),
      ),
      findSearchContribution: vi.fn(() => undefined),
      buildInlineSearchViewProps,
      renderWidgetIcon: vi.fn(() => "icon" as unknown as JSX.Element),
      onPointerDown: vi.fn(),
      onPointerMove: vi.fn(),
      onPointerUp: vi.fn(),
      onPointerCancel: vi.fn(),
      openWidgetExpand,
      setContextMenu: vi.fn(),
      changeWidgetSize,
      removeWidget,
      isDragging: vi.fn(() => false),
      pluginDataRepo: { getByInstance: vi.fn(), saveForInstance: vi.fn() },
      saveInstance,
      setInstances,
      setModalViewId,
      setModalProps,
      showToast,
      openExternalForPlugin,
    })

    const result = runtime.buildWidgetViewProps(instance(), {
      title: "便签",
      icon: "pencil",
      currentSize: "M",
      supportedSizes: ["S", "M", "L"],
    })

    expect(result).toEqual({ sentinel: "widget-view-props" })
    expect(mocks.buildWorkbenchWidgetViewProps).toHaveBeenCalledWith(
      expect.objectContaining({
        saveInstance: expect.any(Function),
        setInstances,
        removeWidget,
        changeWidgetSize,
        setModalViewId,
        setModalProps,
        openWidgetExpand,
        showToast,
        openExternalForPlugin,
      }),
    )
  })

  it("creates the instance renderer with a context-menu bridge and inline search props", () => {
    const setContextMenu = vi.fn()
    const buildInlineSearchViewProps = vi.fn(() => ({ entry: "inline" }) as SearchViewProps)
    const runtime = createWorkbenchShellViewRuntime({
      registryViews: new Map<string, unknown>(),
      widgetContribution: vi.fn(() => undefined),
      widgetRenderModel: vi.fn(() => null),
      findSearchContribution: vi.fn(() => undefined),
      buildInlineSearchViewProps,
      renderWidgetIcon: vi.fn(() => "icon" as unknown as JSX.Element),
      onPointerDown: vi.fn(),
      onPointerMove: vi.fn(),
      onPointerUp: vi.fn(),
      onPointerCancel: vi.fn(),
      openWidgetExpand: vi.fn(),
      setContextMenu,
      changeWidgetSize: vi.fn(async () => {}),
      removeWidget: vi.fn(async () => {}),
      isDragging: vi.fn(() => false),
      pluginDataRepo: { getByInstance: vi.fn(), saveForInstance: vi.fn() },
      saveInstance: vi.fn(async () => {}),
      setInstances: vi.fn(),
      setModalViewId: vi.fn(),
      setModalProps: vi.fn(),
      showToast: vi.fn(),
      openExternalForPlugin: vi.fn(() => true),
    })

    expect(runtime.instanceRenderer).toEqual({ sentinel: "instance-renderer" })

    const rendererCalls = mocks.createWorkbenchInstanceRenderer.mock.calls as unknown as Array<
      [
        {
          buildSearchViewProps: (instance: PluginInstance) => SearchViewProps
          onOpenWidgetContextMenu: (event: MouseEvent, instanceId: string) => void
        },
      ]
    >
    const options = rendererCalls[0]?.[0]
    const preventDefault = vi.fn()
    options?.onOpenWidgetContextMenu(
      { preventDefault, clientX: 12, clientY: 34 } as unknown as MouseEvent,
      "widget-1",
    )

    expect(preventDefault).toHaveBeenCalledTimes(1)
    expect(setContextMenu).toHaveBeenCalledWith({ x: 12, y: 34, instanceId: "widget-1" })
    expect(options?.buildSearchViewProps(instance())).toEqual({ entry: "inline" })
    expect(buildInlineSearchViewProps).toHaveBeenCalledWith(
      expect.objectContaining({ id: "widget-1" }),
    )
  })
})
