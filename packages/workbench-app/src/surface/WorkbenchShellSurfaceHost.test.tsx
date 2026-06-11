import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import type { WidgetViewProps } from "@tabora/plugin-api"

import { WorkbenchShellProvider } from "../shell/WorkbenchShellContext"
import { WorkbenchShellSurfaceHost } from "./WorkbenchShellSurfaceHost"
import { createWorkbenchShellSurfaceStub } from "../shell/WorkbenchShellSurfaceStub"

describe("WorkbenchShellSurfaceHost", () => {
  it("renders layout content together with composed overlay surfaces", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    const runCommand = vi.fn()

    const shell = createWorkbenchShellSurfaceStub({
      runCommand,
      layoutContent: () => <div>layout-content</div>,
      listWidgetContributions: () => [
        {
          pluginId: "official.widgets",
          id: "widget.notes",
          title: "便签",
          description: "快速记录",
          icon: "pencil",
        },
      ],
      buildCommandPaletteProps: () => ({
        isOpen: true,
        query: "",
        activeIdx: 0,
        onQueryChange: vi.fn(),
        onActiveIdxChange: vi.fn(),
        onClose: vi.fn(),
        commands: [
          {
            id: "open-settings",
            icon: "S",
            name: "打开设置",
            desc: "工作台设置",
            action: vi.fn(),
          },
        ],
      }),
    })

    shell.state.overlays.setAddWidgetOpen(true)
    shell.state.runtime.showToast("已保存", {
      type: "success",
      action: { label: "撤销", commandId: "undo-save" },
    })

    render(
      () => (
        <WorkbenchShellProvider shell={shell}>
          <WorkbenchShellSurfaceHost />
        </WorkbenchShellProvider>
      ),
      root,
    )

    expect(root.textContent).toContain("layout-content")
    expect(root.textContent).toContain("添加卡片")
    expect(root.textContent).toContain("便签")
    expect(root.textContent).toContain("已保存")
    expect(root.textContent).toContain("打开设置")

    root.querySelector<HTMLButtonElement>(".toast-action")?.click()
    expect(runCommand).toHaveBeenCalledWith("undo-save", {})

    root.remove()
  })

  it("renders localized host UI copy when a shell translation function is provided", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)

    const shell = createWorkbenchShellSurfaceStub({
      tShell: (key: string) => {
        if (key === "chrome.addWidget.title") return "Add widget"
        if (key === "chrome.contextMenu.current") return "Current"
        return key
      },
      layoutContent: () => <div>layout-content</div>,
      buildContextMenuModel: () => ({
        sections: [
          {
            items: [
              {
                label: "Small",
                isCurrent: true,
                run: () => {},
              },
            ],
          },
        ],
      }),
    })

    shell.state.overlays.setAddWidgetOpen(true)
    shell.state.overlays.setCtxMenu({ x: 8, y: 12, instanceId: "widget-1" })

    render(
      () => (
        <WorkbenchShellProvider shell={shell}>
          <WorkbenchShellSurfaceHost />
        </WorkbenchShellProvider>
      ),
      root,
    )

    expect(root.textContent).toContain("Add widget")
    expect(root.textContent).toContain("Current")

    root.remove()
  })

  it("renders localized overlay copy for expand, modal, and fullscreen surfaces", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)

    const shell = createWorkbenchShellSurfaceStub({
      tShell: (key: string, vars?: Record<string, string | number>) => {
        if (key === "chrome.expand.viewMissing") {
          return `Expanded view unavailable: ${String(vars?.viewId)}`
        }
        if (key === "chrome.expand.footerHint") return "Esc to close"
        if (key === "chrome.modal.close") return "Close"
        if (key === "chrome.fullscreen.close") return "Close fullscreen view"
        return key
      },
      layoutContent: () => <div>layout-content</div>,
    })

    const expandProps = {
      instanceId: "widget-1",
      pluginId: "plugin.widgets",
      contributionId: "widget.notes",
      size: "M",
      supportedSizes: ["S", "M", "L"],
      config: {},
      host: {} as WidgetViewProps["host"],
      data: {} as WidgetViewProps["data"],
    } satisfies WidgetViewProps

    shell.state.overlays.setExpandState({
      instanceId: "widget-1",
      title: "Notes",
      viewId: "missing.view",
      mode: "expand",
      props: expandProps,
    })
    shell.state.overlays.setModalViewId("missing.modal.view")
    shell.state.overlays.setFullscreenViewId("missing.fullscreen.view")

    render(
      () => (
        <WorkbenchShellProvider shell={shell}>
          <WorkbenchShellSurfaceHost />
        </WorkbenchShellProvider>
      ),
      root,
    )

    expect(root.textContent).toContain("Expanded view unavailable: missing.view")
    expect(root.textContent).toContain("Esc to close")
    expect(root.querySelector(".modal-close")?.getAttribute("aria-label")).toBe("Close")
    expect(root.querySelector(".fullscreen-close")?.getAttribute("aria-label")).toBe(
      "Close fullscreen view",
    )

    root.remove()
  })
})
