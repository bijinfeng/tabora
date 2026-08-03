import { describe, expect, it, vi } from "vitest"
import type { WidgetViewProps } from "@tabora/plugin-api"

import { createWorkbenchShellSurfaceActionProps } from "./WorkbenchShellSurfaceActionProps"

// 预览跑在一个合成实例（add-widget-preview:*）上，而 buildWidgetViewProps 给出的
// host 会真的落库 / 移除实例 / 改尺寸 / 开浮层。若不隔离，插件在预览里的任何交互
// （便签自动保存、待办勾选）都会把这个假实例写进真实工作台。
describe("添加卡片弹窗的预览 host 隔离", () => {
  function createShellStub() {
    const liveHost = {
      updateConfig: vi.fn(async () => {}),
      removeInstance: vi.fn(async () => {}),
      requestResize: vi.fn(async () => {}),
      openModal: vi.fn(),
      closeModal: vi.fn(),
      openExpand: vi.fn(),
      showToast: vi.fn(),
      openExternal: vi.fn(async () => true),
    }

    let captured: WidgetViewProps | undefined
    const CardView = (viewProps: WidgetViewProps) => {
      captured = viewProps
      return null
    }

    const shell = {
      state: {
        overlays: {
          addWidgetOpen: () => true,
          addWidgetContext: () => undefined,
          setAddWidgetOpen: vi.fn(),
        },
        runtime: { toasts: () => [] },
      },
      views: {
        has: (id: string): boolean => id === "view.notes.card",
        get: (id: string) => (id === "view.notes.card" ? CardView : undefined),
      },
      catalog: {
        listWidgetContributions: () => [
          {
            pluginId: "official.widgets",
            id: "widget.notes",
            title: "便签",
            description: "快速记录",
            supportedSizes: ["S", "M"],
            defaultSize: "M",
            views: { card: "view.notes.card" },
            pluginName: "官方组件",
            pluginVersion: "1.0.0",
          },
        ],
      },
      controllerRuntime: {
        widgetController: { addWidget: vi.fn() },
        viewRuntime: {
          buildWidgetViewProps: () => ({
            instanceId: "add-widget-preview:official.widgets:widget.notes",
            pluginId: "official.widgets",
            contributionId: "widget.notes",
            size: "M",
            supportedSizes: ["S", "M"],
            config: {},
            data: { read: vi.fn(), write: vi.fn() },
            host: liveHost,
          }),
        },
        runCommand: vi.fn(),
        searchSurfaces: { buildCommandPaletteProps: () => ({}) },
      },
    }

    return { shell, liveHost, captured: () => captured }
  }

  it("预览 host 的写操作全部是空操作，不触达真实工作台", async () => {
    const { shell, liveHost, captured } = createShellStub()

    const props = createWorkbenchShellSurfaceActionProps(
      shell as unknown as Parameters<typeof createWorkbenchShellSurfaceActionProps>[0],
    )
    props.addWidgetModal.renderWidgetPreview("official.widgets", "widget.notes", "M")

    const host = captured()?.host
    expect(host).toBeDefined()

    await host!.updateConfig({ text: "改了" })
    await host!.removeInstance()
    await host!.requestResize("L")
    host!.openModal("view.any", {})
    host!.openExpand()
    host!.showToast("hi")

    expect(liveHost.updateConfig).not.toHaveBeenCalled()
    expect(liveHost.removeInstance).not.toHaveBeenCalled()
    expect(liveHost.requestResize).not.toHaveBeenCalled()
    expect(liveHost.openModal).not.toHaveBeenCalled()
    expect(liveHost.openExpand).not.toHaveBeenCalled()
    expect(liveHost.showToast).not.toHaveBeenCalled()
    expect(liveHost.openExternal).not.toHaveBeenCalled()
  })

  it("没有 card view 的卡片返回 null，交给弹窗兜底", () => {
    const { shell } = createShellStub()
    shell.views.has = () => false

    const props = createWorkbenchShellSurfaceActionProps(
      shell as unknown as Parameters<typeof createWorkbenchShellSurfaceActionProps>[0],
    )

    expect(props.addWidgetModal.renderWidgetPreview("official.widgets", "widget.notes", "M")).toBe(
      null,
    )
  })
})
