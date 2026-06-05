import { describe, expect, it, vi } from "vitest"
import type { PluginInstance, WidgetSize } from "@tabora/plugin-api"
import { createWidgetContextMenuModel } from "./context-menu-model"

function instance(size: WidgetSize = "M"): PluginInstance {
  return {
    id: "todo-1",
    workspaceId: "default",
    pluginId: "official.widgets.todo",
    contributionId: "todo",
    extensionPoint: "widget",
    regionId: "mainGrid",
    enabled: true,
    size,
    config: {},
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  }
}

describe("createWidgetContextMenuModel", () => {
  it("builds size, expand, and remove sections for a widget instance", () => {
    const model = createWidgetContextMenuModel({
      instance: instance("L"),
      supportedSizes: ["S", "M", "L"],
      onResize: vi.fn(),
      onExpand: vi.fn(),
      onRemove: vi.fn(),
    })

    expect(model.sections.map((section) => section.items.map((item) => item.label))).toEqual([
      ["尺寸 S", "尺寸 M", "尺寸 L"],
      ["展开详情"],
      ["移除实例"],
    ])
    expect(model.sections[0]!.items.map((item) => item.isCurrent)).toEqual([false, false, true])
    expect(model.sections[2]!.items[0]!.danger).toBe(true)
  })

  it("runs the corresponding callback for each action", () => {
    const onResize = vi.fn()
    const onExpand = vi.fn()
    const onRemove = vi.fn()
    const model = createWidgetContextMenuModel({
      instance: instance(),
      supportedSizes: ["S"],
      onResize,
      onExpand,
      onRemove,
    })

    model.sections[0]!.items[0]!.run()
    model.sections[1]!.items[0]!.run()
    model.sections[2]!.items[0]!.run()

    expect(onResize).toHaveBeenCalledWith("todo-1", "S")
    expect(onExpand).toHaveBeenCalledWith("todo-1")
    expect(onRemove).toHaveBeenCalledWith("todo-1")
  })

  it("falls back to the default medium size when the instance has no size", () => {
    const widget = instance()
    delete widget.size

    const model = createWidgetContextMenuModel({
      instance: widget,
      supportedSizes: ["S", "M", "L"],
      onResize: vi.fn(),
      onExpand: vi.fn(),
      onRemove: vi.fn(),
    })

    expect(model.sections[0]!.items.map((item) => item.isCurrent)).toEqual([false, true, false])
  })
})
