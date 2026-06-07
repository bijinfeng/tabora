import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"

import { WorkbenchShellSurfaceHost } from "./WorkbenchShellSurfaceHost"

describe("WorkbenchShellSurfaceHost", () => {
  it("renders layout content together with composed overlay surfaces", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    const onToastAction = vi.fn()

    render(
      () => (
        <WorkbenchShellSurfaceHost
          content={<div>layout-content</div>}
          addWidgetModal={{
            open: true,
            availableWidgets: [
              {
                pluginId: "official.widgets",
                id: "widget.notes",
                title: "便签",
                description: "快速记录",
                icon: "pencil",
              },
            ],
            widgetIconLabel: (icon) => icon ?? "",
            onAdd: vi.fn(),
            onClose: vi.fn(),
          }}
          settingsHost={{
            open: false,
            panels: [],
            activeSectionId: "general",
            onSectionChange: vi.fn(),
            onClose: vi.fn(),
            getView: () => undefined,
            panelProps: vi.fn(),
          }}
          expandOverlay={{
            expandState: null,
            getView: () => undefined,
            widgetIconForProps: () => <span>icon</span>,
            onClose: vi.fn(),
          }}
          pluginModal={{
            viewId: null,
            modalProps: {},
            getView: () => undefined,
            onClose: vi.fn(),
          }}
          fullscreenOverlay={{
            viewId: null,
            fullscreenProps: {},
            getView: () => undefined,
            onClose: vi.fn(),
          }}
          contextMenuOverlay={{
            menu: null,
            sections: [],
            onClose: vi.fn(),
          }}
          toastHost={{
            toasts: [
              {
                id: "toast-1",
                message: "已保存",
                type: "success",
                action: {
                  label: "撤销",
                  commandId: "undo-save",
                },
              },
            ],
            onAction: onToastAction,
          }}
          commandPalette={{
            isOpen: true,
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
          }}
        />
      ),
      root,
    )

    expect(root.textContent).toContain("layout-content")
    expect(root.textContent).toContain("添加卡片")
    expect(root.textContent).toContain("便签")
    expect(root.textContent).toContain("已保存")
    expect(root.textContent).toContain("打开设置")

    root.querySelector<HTMLButtonElement>(".toast-action")?.click()
    expect(onToastAction).toHaveBeenCalledWith("undo-save")

    root.remove()
  })
})
