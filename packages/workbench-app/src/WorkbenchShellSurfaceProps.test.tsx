import type { JSX } from "solid-js"
import type { WidgetViewProps } from "@tabora/plugin-api"
import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"

import { createWorkbenchShellSurfaceProps } from "./WorkbenchShellSurfaceProps"

function mount(element: JSX.Element) {
  const host = document.createElement("div")
  document.body.appendChild(host)
  const dispose = render(() => element, host)
  return { host, dispose }
}

function baseOptions(
  overrides: Partial<Parameters<typeof createWorkbenchShellSurfaceProps>[0]> = {},
): Parameters<typeof createWorkbenchShellSurfaceProps>[0] {
  return {
    content: <div>layout-content</div>,
    availableWidgets: [],
    widgetIconLabel: (icon) => icon ?? "",
    addWidgetOpen: true,
    addWidget: vi.fn(async () => {}),
    closeAddWidget: vi.fn(),
    settingsOpen: true,
    settingsPanels: [],
    activeSettingsSectionId: "general",
    onSettingsSectionChange: vi.fn(),
    closeSettings: vi.fn(),
    getSettingsView: () => undefined,
    buildSettingsPanelProps: vi.fn(),
    workspaceName: "默认工作区",
    enabledPluginCount: 2,
    expandState: null,
    getWidgetView: () => undefined,
    widgetIconForProps: (_props: WidgetViewProps) => <span>icon</span>,
    closeExpand: vi.fn(),
    modalViewId: null,
    modalProps: {},
    getModalView: () => undefined,
    closeModal: vi.fn(),
    fullscreenViewId: null,
    fullscreenProps: {},
    getFullscreenView: () => undefined,
    closeFullscreen: vi.fn(),
    contextMenu: null,
    contextSections: undefined,
    closeContextMenu: vi.fn(),
    toasts: [],
    runCommand: vi.fn(),
    commandPalette: {
      isOpen: false,
      onClose: vi.fn(),
      commands: [],
    },
    ...overrides,
  }
}

describe("createWorkbenchShellSurfaceProps", () => {
  it("renders settings about content from shell summaries", () => {
    const props = createWorkbenchShellSurfaceProps(baseOptions())
    const { host, dispose } = mount(props.settingsHost.aboutContent)

    expect(host.textContent).toContain("当前工作区：默认工作区")
    expect(host.textContent).toContain("已启用官方插件：2")

    dispose()
    host.remove()
  })

  it("closes add widget after dispatching add and defaults empty context sections", () => {
    const addWidget = vi.fn(async () => {})
    const closeAddWidget = vi.fn()
    const props = createWorkbenchShellSurfaceProps(
      baseOptions({
        addWidget,
        closeAddWidget,
      }),
    )

    props.addWidgetModal.onAdd("plugin.widgets", "widget.notes")

    expect(addWidget).toHaveBeenCalledWith("plugin.widgets", "widget.notes")
    expect(closeAddWidget).toHaveBeenCalledTimes(1)
    expect(props.contextMenuOverlay.sections).toEqual([])
  })

  it("routes toast actions into command execution", () => {
    const runCommand = vi.fn()
    const props = createWorkbenchShellSurfaceProps(
      baseOptions({
        runCommand,
      }),
    )

    props.toastHost.onAction("open-settings")

    expect(runCommand).toHaveBeenCalledWith("open-settings", {})
  })
})
