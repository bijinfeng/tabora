import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import type { WidgetViewProps } from "@tabora/plugin-api"

import { WorkbenchExpandOverlay } from "./WorkbenchExpandOverlay"
import type { WorkbenchExpandState } from "./WorkbenchShellInteractions"

function expandProps(): WidgetViewProps {
  return {
    instanceId: "widget-1",
    pluginId: "plugin.widgets",
    contributionId: "widget.notes",
    size: "M",
    supportedSizes: ["S", "M", "L"],
    config: {},
    data: { get: async () => undefined, save: async () => {} },
    host: {
      updateConfig: async () => {},
      removeInstance: async () => {},
      requestResize: async () => {},
      openModal: () => {},
      closeModal: () => {},
      openExpand: () => {},
      showToast: () => {},
      openExternal: async () => false,
    },
  }
}

function state(overrides?: Partial<WorkbenchExpandState>): WorkbenchExpandState {
  return {
    instanceId: "widget-1",
    title: "Notes",
    viewId: "widget.notes.expand",
    mode: "expand",
    props: expandProps(),
    ...overrides,
  }
}

const bodyView = () => <div class="test-expand-body">body</div>
const footerView = () => (
  <div class="test-expand-footer">
    <button type="button">自定义操作</button>
  </div>
)

describe("WorkbenchExpandOverlay footer", () => {
  it("renders the default footer (instance id + hint) when no footer view is provided", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)

    render(
      () => (
        <WorkbenchExpandOverlay
          expandState={state()}
          getView={(viewId) => (viewId === "widget.notes.expand" ? bodyView : undefined)}
          widgetIconForProps={() => <span>icon</span>}
          onClose={vi.fn()}
        />
      ),
      root,
    )

    const overlay = root.querySelector('[data-workbench-overlay="expand"]')
    const footer = root.querySelector("[data-workbench-overlay-footer]")
    expect(overlay?.getAttribute("role")).toBe("dialog")
    expect(overlay?.getAttribute("aria-modal")).toBe("true")
    expect(footer?.querySelector("[data-workbench-overlay-meta]")?.textContent).toBe("widget-1")
    expect(footer?.querySelector("[data-workbench-overlay-close-hint]")).toBeTruthy()
    expect(footer?.querySelector("[data-workbench-overlay-plugin-footer]")).toBeNull()
    expect(root.querySelector(".expand-overlay")).toBeNull()
    root.remove()
  })

  it("renders the plugin footer view when footerViewId resolves to a component", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)

    render(
      () => (
        <WorkbenchExpandOverlay
          expandState={state({ footerViewId: "widget.notes.expand-footer" })}
          getView={(viewId) =>
            viewId === "widget.notes.expand"
              ? bodyView
              : viewId === "widget.notes.expand-footer"
                ? footerView
                : undefined
          }
          widgetIconForProps={() => <span>icon</span>}
          onClose={vi.fn()}
        />
      ),
      root,
    )

    const footer = root.querySelector("[data-workbench-overlay-footer]")
    const pluginFooter = footer?.querySelector("[data-workbench-overlay-plugin-footer]")
    expect(pluginFooter).toBeTruthy()
    expect(pluginFooter?.getAttribute("data-tabora-plugin-id")).toBe("plugin.widgets")
    expect(footer?.textContent).toContain("自定义操作")
    // 默认 footer 元信息不再渲染
    expect(footer?.querySelector("[data-workbench-overlay-meta]")).toBeNull()
    root.remove()
  })

  it("falls back to the default footer when footerViewId is set but cannot be resolved", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)

    render(
      () => (
        <WorkbenchExpandOverlay
          expandState={state({ footerViewId: "widget.notes.missing-footer" })}
          getView={(viewId) => (viewId === "widget.notes.expand" ? bodyView : undefined)}
          widgetIconForProps={() => <span>icon</span>}
          onClose={vi.fn()}
        />
      ),
      root,
    )

    const footer = root.querySelector("[data-workbench-overlay-footer]")
    expect(footer?.querySelector("[data-workbench-overlay-meta]")?.textContent).toBe("widget-1")
    expect(footer?.querySelector("[data-workbench-overlay-plugin-footer]")).toBeNull()
    root.remove()
  })
})
