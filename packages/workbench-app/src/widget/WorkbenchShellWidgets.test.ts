import type {
  PluginInstance,
  WidgetContextMenuContribution,
  WidgetContribution,
  WidgetSize,
} from "@tabora/plugin-api"
import { describe, expect, it, vi } from "vitest"

import {
  buildWorkbenchContextMenuModel,
  buildWorkbenchSearchableWidgets,
  findWorkbenchWidgetInstance,
  mergeWorkbenchGridOrder,
  resolveWorkbenchContextMenuInstance,
  resolveWorkbenchSupportedWidgetSizes,
} from "./WorkbenchShellWidgets"
import type { WidgetRenderModel } from "../shared/shellHelpers"

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
    createdAt: "2026-06-06T00:00:00.000Z",
    updatedAt: "2026-06-06T00:00:00.000Z",
    ...overrides,
  }
}

function renderModel(size: WidgetSize = "M"): WidgetRenderModel {
  return {
    title: "便签",
    icon: "pencil",
    currentSize: size,
    supportedSizes: ["S", "M", "L"],
  }
}

function widget(id: string, title: string, icon?: string): WidgetContribution {
  return {
    id,
    title,
    ...(icon ? { icon } : {}),
    supportedSizes: ["S", "M"],
    defaultSize: "M",
    allowMultipleInstances: true,
    views: { card: `${id}.card` },
  }
}

describe("workbench widget helpers", () => {
  it("finds widget instances by id and resolves the active context menu instance", () => {
    const instances = [instance(), instance({ id: "widget-2" })]

    expect(findWorkbenchWidgetInstance(instances, "widget-2")).toMatchObject({ id: "widget-2" })
    expect(
      resolveWorkbenchContextMenuInstance({ x: 10, y: 20, instanceId: "widget-1" }, instances),
    ).toMatchObject({ id: "widget-1" })
    expect(resolveWorkbenchContextMenuInstance(null, instances)).toBeNull()
  })

  it("resolves supported widget sizes from the widget render model", () => {
    expect(
      resolveWorkbenchSupportedWidgetSizes(instance(), (currentInstance) =>
        currentInstance.id === "widget-1" ? renderModel() : null,
      ),
    ).toEqual(["S", "M", "L"])
    expect(resolveWorkbenchSupportedWidgetSizes(null, () => renderModel())).toEqual([])
  })

  it("builds a workbench context menu model for the active instance", () => {
    const runCommand = vi.fn()
    const contextMenus: WidgetContextMenuContribution[] = [
      {
        id: "plugin.inspect",
        label: "检查实例",
        commandId: "plugin.inspect",
      },
    ]
    const model = buildWorkbenchContextMenuModel({
      menu: { x: 10, y: 20, instanceId: "widget-1" },
      instances: [instance()],
      resolveWidgetRenderModel: () => renderModel(),
      resolveContextMenus: () => contextMenus,
      availableCommandIds: ["plugin.inspect"],
      runCommand,
      hasInstanceSettings: () => true,
      onResize: vi.fn(),
      onExpand: vi.fn(),
      onOpenSettings: vi.fn(),
      onRemove: vi.fn(),
    })

    expect(model?.sections.map((section) => section.id)).toEqual([
      "expand",
      "size",
      "plugin",
      "settings",
      "remove",
    ])
  })

  it("builds searchable widget entries from instances and contribution resolver", () => {
    const focus = vi.fn()
    const entries = buildWorkbenchSearchableWidgets({
      instances: [instance(), instance({ id: "search-1", extensionPoint: "search" })],
      resolveWidgetContribution: (_pluginId, contributionId) =>
        contributionId === "widget.notes" ? widget("notes", "便签", "pencil") : undefined,
      buildFocusAction: (instanceId) => () => focus(instanceId),
    })

    expect(entries).toHaveLength(1)
    expect(entries[0]).toMatchObject({
      instanceId: "widget-1",
      name: "便签",
      icon: "✎",
    })
  })

  it("merges persisted grid order back into the current instances", () => {
    const currentInstances = [
      instance({ id: "widget-1", updatedAt: "2026-06-06T00:00:00.000Z" }),
      instance({
        id: "widget-2",
        contributionId: "widget.todo",
        updatedAt: "2026-06-06T00:00:00.000Z",
      }),
    ]

    const orderedInstances = [
      { ...currentInstances[1]!, updatedAt: "2026-06-06T12:00:00.000Z" },
      { ...currentInstances[0]!, updatedAt: "2026-06-06T12:00:00.000Z" },
    ]
    const merged = mergeWorkbenchGridOrder(currentInstances, orderedInstances)

    expect(merged.map((currentInstance) => currentInstance.id)).toEqual(["widget-1", "widget-2"])
    expect(merged.map((currentInstance) => currentInstance.updatedAt)).toEqual([
      "2026-06-06T12:00:00.000Z",
      "2026-06-06T12:00:00.000Z",
    ])
  })
})
