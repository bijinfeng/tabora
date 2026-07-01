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
  it("builds expand, size, and remove sections for a widget instance", () => {
    const model = createWidgetContextMenuModel({
      instance: instance("L"),
      supportedSizes: ["S", "M", "L"],
      onResize: vi.fn(),
      onExpand: vi.fn(),
      onRemove: vi.fn(),
    })

    expect(model.sections.map((section) => section.items.map((item) => item.label))).toEqual([
      ["展开卡片"],
      ["尺寸 S", "尺寸 M", "尺寸 L"],
      ["移除实例"],
    ])
    expect(model.sections[0]!.items[0]!.hint).toBe("双击")
    expect(model.sections[1]!.items.map((item) => item.isCurrent)).toEqual([false, false, true])
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

    expect(onExpand).toHaveBeenCalledWith("todo-1")
    expect(onResize).toHaveBeenCalledWith("todo-1", "S")
    expect(onRemove).toHaveBeenCalledWith("todo-1")
  })

  it("does not mark a current size when the instance has no explicit size", () => {
    const widget = instance()
    delete widget.size

    const model = createWidgetContextMenuModel({
      instance: widget,
      supportedSizes: ["S", "M", "L"],
      onResize: vi.fn(),
      onExpand: vi.fn(),
      onRemove: vi.fn(),
    })

    expect(model.sections[1]!.items.map((item) => item.isCurrent)).toEqual([false, false, false])
  })

  it("merges ordered plugin context menu items before remove", () => {
    const runCommand = vi.fn()
    const model = createWidgetContextMenuModel({
      instance: instance(),
      supportedSizes: ["S"],
      availableCommandIds: ["todo.focus", "todo.clear"],
      contextMenus: [
        {
          id: "clear",
          label: "清空待办",
          commandId: "todo.clear",
          order: 30,
          danger: true,
        },
        {
          id: "focus",
          label: "聚焦待办",
          commandId: "todo.focus",
          order: 10,
        },
      ],
      runCommand,
      onResize: vi.fn(),
      onExpand: vi.fn(),
      onRemove: vi.fn(),
    })

    expect(model.sections.map((section) => section.id)).toEqual([
      "expand",
      "size",
      "plugin",
      "remove",
    ])
    expect(model.sections[2]!.items.map((item) => item.label)).toEqual(["聚焦待办", "清空待办"])

    model.sections[2]!.items[0]!.run()
    model.sections[2]!.items[1]!.run()

    expect(runCommand).toHaveBeenCalledWith("todo.focus", { instance: instance() })
    expect(runCommand).toHaveBeenCalledWith("todo.clear", { instance: instance() })
    expect(model.sections[2]!.items[1]!.danger).toBe(true)
  })

  it("adds an instance settings action before remove when explicitly configured", () => {
    const onOpenSettings = vi.fn()
    const model = createWidgetContextMenuModel({
      instance: instance(),
      supportedSizes: ["S"],
      hasInstanceSettings: true,
      onOpenSettings,
      onResize: vi.fn(),
      onExpand: vi.fn(),
      onRemove: vi.fn(),
    })

    expect(model.sections.map((section) => section.id)).toEqual([
      "expand",
      "size",
      "settings",
      "remove",
    ])
    expect(model.sections[2]!.items.map((item) => item.label)).toEqual(["实例设置"])

    model.sections[2]!.items[0]!.run()

    expect(onOpenSettings).toHaveBeenCalledWith("todo-1")
  })

  it("does not add instance settings unless availability and handler are both explicit", () => {
    const withAvailabilityOnly = createWidgetContextMenuModel({
      instance: instance(),
      supportedSizes: ["S"],
      hasInstanceSettings: true,
      onResize: vi.fn(),
      onExpand: vi.fn(),
      onRemove: vi.fn(),
    })
    const withHandlerOnly = createWidgetContextMenuModel({
      instance: instance(),
      supportedSizes: ["S"],
      onOpenSettings: vi.fn(),
      onResize: vi.fn(),
      onExpand: vi.fn(),
      onRemove: vi.fn(),
    })

    expect(withAvailabilityOnly.sections.map((section) => section.id)).toEqual([
      "expand",
      "size",
      "remove",
    ])
    expect(withHandlerOnly.sections.map((section) => section.id)).toEqual([
      "expand",
      "size",
      "remove",
    ])
  })

  it("skips plugin context menu items without a declared command", () => {
    const model = createWidgetContextMenuModel({
      instance: instance(),
      supportedSizes: ["S"],
      availableCommandIds: ["todo.known"],
      contextMenus: [
        {
          id: "missing-command",
          label: "缺少命令",
          commandId: "todo.missing",
        },
        {
          id: "no-command",
          label: "无命令",
        },
      ],
      onResize: vi.fn(),
      onExpand: vi.fn(),
      onRemove: vi.fn(),
    })

    expect(model.sections.map((section) => section.id)).toEqual(["expand", "size", "remove"])
  })

  it("skips plugin command items when no command executor is configured", () => {
    const model = createWidgetContextMenuModel({
      instance: instance(),
      supportedSizes: ["S"],
      availableCommandIds: ["todo.unhandled"],
      contextMenus: [
        {
          id: "unhandled",
          label: "暂无实现",
          commandId: "todo.unhandled",
        },
      ],
      onResize: vi.fn(),
      onExpand: vi.fn(),
      onRemove: vi.fn(),
    })

    expect(model.sections.map((section) => section.id)).toEqual(["expand", "size", "remove"])
  })

  it("passes the current widget instance context when running a plugin command", () => {
    const widget = instance("XL")
    const runCommand = vi.fn()
    const model = createWidgetContextMenuModel({
      instance: widget,
      supportedSizes: ["XL"],
      availableCommandIds: ["todo.inspect"],
      contextMenus: [
        {
          id: "inspect",
          label: "检查实例",
          commandId: "todo.inspect",
        },
      ],
      runCommand,
      onResize: vi.fn(),
      onExpand: vi.fn(),
      onRemove: vi.fn(),
    })

    model.sections[2]!.items[0]!.run()

    expect(runCommand).toHaveBeenCalledWith("todo.inspect", { instance: widget })
  })
})
