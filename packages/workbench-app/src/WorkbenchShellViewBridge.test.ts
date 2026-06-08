import type { PluginInstance } from "@tabora/plugin-api"
import { describe, expect, it, vi } from "vitest"

import {
  buildWorkbenchWidgetViewProps,
  createWorkbenchScopedData,
  resolveWorkbenchView,
} from "./WorkbenchShellViewBridge"
import type { WidgetRenderModel } from "./shellHelpers"

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

function renderModel(size: "S" | "M" | "L" = "M"): WidgetRenderModel {
  return {
    title: "便签",
    icon: "pencil",
    currentSize: size,
    supportedSizes: ["S", "M", "L"],
  }
}

describe("createWorkbenchScopedData", () => {
  it("reads and writes plugin data scoped by plugin and instance id", async () => {
    const getByInstance = vi.fn(async (_pluginId: string, _instanceId: string, _key: string) => {
      return "stored"
    })
    const saveForInstance = vi.fn(
      async (_pluginId: string, _instanceId: string, _key: string, _value: unknown) => {},
    )
    const pluginDataRepo: Parameters<typeof createWorkbenchScopedData>[0]["pluginDataRepo"] = {
      getByInstance: <T>(pluginId: string, instanceId: string, key: string) =>
        getByInstance(pluginId, instanceId, key) as Promise<T | undefined>,
      saveForInstance: <T>(pluginId: string, instanceId: string, key: string, value: T) =>
        saveForInstance(pluginId, instanceId, key, value),
    }

    const data = createWorkbenchScopedData({
      pluginId: "plugin.widgets",
      instanceId: "widget-1",
      pluginDataRepo,
    })

    await expect(data.get<string>("notes")).resolves.toBe("stored")
    await data.save("notes", { text: "hello" })

    expect(getByInstance).toHaveBeenCalledWith("plugin.widgets", "widget-1", "notes")
    expect(saveForInstance).toHaveBeenCalledWith("plugin.widgets", "widget-1", "notes", {
      text: "hello",
    })
  })
})

describe("resolveWorkbenchView", () => {
  it("returns registered views and hides missing ones", () => {
    const view = vi.fn()
    const views = new Map<string, unknown>([["widget.notes.card", view]])

    expect(resolveWorkbenchView(views, "widget.notes.card")).toBe(view)
    expect(resolveWorkbenchView(views, "widget.notes.missing")).toBeUndefined()
  })
})

describe("buildWorkbenchWidgetViewProps", () => {
  it("bridges widget host actions back into shell callbacks and repositories", async () => {
    const currentInstance = instance()
    const saveInstance = vi.fn(async () => {})
    const setInstances = vi.fn()
    const removeWidget = vi.fn(async () => {})
    const changeWidgetSize = vi.fn(async () => {})
    const setModalViewId = vi.fn()
    const setModalProps = vi.fn()
    const openWidgetExpand = vi.fn()
    const showToast = vi.fn()
    const openExternalForPlugin = vi.fn(async () => true)
    const getByInstance = vi.fn(
      async (_pluginId: string, _instanceId: string, _key: string) => undefined,
    )
    const saveForInstance = vi.fn(
      async (_pluginId: string, _instanceId: string, _key: string, _value: unknown) => {},
    )
    const pluginDataRepo: Parameters<typeof createWorkbenchScopedData>[0]["pluginDataRepo"] = {
      getByInstance: <T>(pluginId: string, instanceId: string, key: string) =>
        getByInstance(pluginId, instanceId, key) as Promise<T | undefined>,
      saveForInstance: <T>(pluginId: string, instanceId: string, key: string, value: T) =>
        saveForInstance(pluginId, instanceId, key, value),
    }

    const props = buildWorkbenchWidgetViewProps({
      instance: currentInstance,
      model: renderModel(),
      pluginDataRepo,
      saveInstance,
      setInstances,
      removeWidget,
      changeWidgetSize,
      setModalViewId,
      setModalProps,
      openWidgetExpand,
      showToast,
      openExternalForPlugin,
    })

    await props.host.updateConfig({ title: "Inbox" })
    await props.host.removeInstance()
    await props.host.requestResize("L")
    props.host.openModal("widget.notes.modal", "invalid-props")
    props.host.closeModal()
    props.host.openExpand()
    props.host.showToast("已保存")
    await expect(props.host.openExternal("https://example.com")).resolves.toBe(true)

    expect(saveInstance).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "widget-1",
        config: { title: "Inbox" },
      }),
    )
    const updateInstances = setInstances.mock.calls[0]?.[0] as
      | ((instances: PluginInstance[]) => PluginInstance[])
      | undefined
    expect(updateInstances?.([currentInstance])).toEqual([
      expect.objectContaining({
        id: "widget-1",
        config: { title: "Inbox" },
      }),
    ])
    expect(removeWidget).toHaveBeenCalledWith("widget-1")
    expect(changeWidgetSize).toHaveBeenCalledWith("widget-1", "L")
    expect(setModalViewId).toHaveBeenNthCalledWith(1, "widget.notes.modal")
    expect(setModalProps).toHaveBeenCalledWith({ pluginId: "plugin.widgets" })
    expect(setModalViewId).toHaveBeenNthCalledWith(2, null)
    expect(openWidgetExpand).toHaveBeenCalledWith(currentInstance)
    expect(showToast).toHaveBeenCalledWith("已保存", undefined)
    expect(openExternalForPlugin).toHaveBeenCalledWith("plugin.widgets", "https://example.com")
  })

  it("exposes scoped widget data through the returned view props", async () => {
    const getByInstance = vi.fn(async (_pluginId: string, _instanceId: string, _key: string) => {
      return "stored"
    })
    const saveForInstance = vi.fn(
      async (_pluginId: string, _instanceId: string, _key: string, _value: unknown) => {},
    )
    const pluginDataRepo: Parameters<typeof createWorkbenchScopedData>[0]["pluginDataRepo"] = {
      getByInstance: <T>(pluginId: string, instanceId: string, key: string) =>
        getByInstance(pluginId, instanceId, key) as Promise<T | undefined>,
      saveForInstance: <T>(pluginId: string, instanceId: string, key: string, value: T) =>
        saveForInstance(pluginId, instanceId, key, value),
    }

    const props = buildWorkbenchWidgetViewProps({
      instance: instance(),
      model: renderModel(),
      pluginDataRepo,
      saveInstance: vi.fn(async () => {}),
      setInstances: vi.fn(),
      removeWidget: vi.fn(async () => {}),
      changeWidgetSize: vi.fn(async () => {}),
      setModalViewId: vi.fn(),
      setModalProps: vi.fn(),
      openWidgetExpand: vi.fn(),
      showToast: vi.fn(),
      openExternalForPlugin: vi.fn(async () => true),
    })

    await expect(props.data.get<string>("draft")).resolves.toBe("stored")
    await props.data.save("draft", { text: "hello" })

    expect(getByInstance).toHaveBeenCalledWith("plugin.widgets", "widget-1", "draft")
    expect(saveForInstance).toHaveBeenCalledWith("plugin.widgets", "widget-1", "draft", {
      text: "hello",
    })
  })
})
