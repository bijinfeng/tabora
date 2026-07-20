import type { JSX } from "solid-js"
import type { PluginInstance, Workspace } from "@tabora/plugin-api"
import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"

import { createWorkbenchShellSurfaceProps } from "./WorkbenchShellSurfaceProps"
import { createWorkbenchShellSurfaceStub } from "../shell/WorkbenchShellSurfaceStub"

function mount(element: JSX.Element) {
  const host = document.createElement("div")
  document.body.appendChild(host)
  const dispose = render(() => element, host)
  return { host, dispose }
}

describe("createWorkbenchShellSurfaceProps", () => {
  it("renders settings about content from shell summaries", () => {
    const shell = createWorkbenchShellSurfaceStub({
      pluginSummaries: () => [{ enabled: true }, { enabled: true }],
    })
    shell.state.workspace.setWorkspaceState({ name: "默认工作区" } as unknown as Workspace)

    const props = createWorkbenchShellSurfaceProps(shell)
    const { host, dispose } = mount(props.settingsHost.aboutContent)

    expect(host.textContent).toContain("当前工作区：默认工作区")
    expect(host.textContent).toContain("已启用官方插件：2")

    dispose()
    host.remove()
  })

  it("closes add widget after dispatching add and defaults empty context sections", () => {
    const addedInstance = { id: "widget.notes-1" } as PluginInstance
    const addWidget = vi.fn(async () => addedInstance)
    const onAdded = vi.fn()
    const shell = createWorkbenchShellSurfaceStub({ addWidget })
    shell.state.overlays.setAddWidgetOpen(true, {
      activeGroupLabel: "Research",
      onAdded,
    })

    const props = createWorkbenchShellSurfaceProps(shell)
    props.addWidgetModal.onAdd("plugin.widgets", "widget.notes")

    expect(addWidget).toHaveBeenCalledWith("plugin.widgets", "widget.notes", undefined)
    expect(props.addWidgetModal.activeGroupLabel).toBe("Research")
    expect(shell.state.overlays.addWidgetOpen()).toBe(false)
    expect(props.contextMenuOverlay.sections).toEqual([])
    return vi.waitFor(() => expect(onAdded).toHaveBeenCalledWith(addedInstance))
  })

  it("uses catalog active contribution lists for add widget and settings surfaces", () => {
    const activeWidgets = [
      {
        pluginId: "plugin.enabled",
        pluginName: "Enabled",
        id: "widget.visible",
        title: "Visible Widget",
        description: "Shown by catalog",
        supportedSizes: ["S"],
        defaultSize: "S",
        allowMultipleInstances: true,
        views: { card: "visible.card" },
      },
    ]
    const activePanels = [
      {
        pluginId: "plugin.enabled",
        id: "settings.visible",
        title: "Visible Settings",
        view: "visible.settings",
        section: "general",
        scope: "workspace",
        order: 10,
      },
    ]
    const pluginSummaries = [
      {
        id: "plugin.enabled",
        enabled: true,
        contributes: {
          widgets: activeWidgets,
          settingsPanels: activePanels,
        },
      },
      {
        id: "plugin.disabled",
        enabled: false,
        contributes: {
          widgets: [
            {
              id: "widget.hidden",
              title: "Hidden Widget",
              supportedSizes: ["S"],
              defaultSize: "S",
              views: { card: "hidden.card" },
            },
          ],
          settingsPanels: [
            {
              id: "settings.hidden",
              title: "Hidden Settings",
              view: "hidden.settings",
              section: "general",
              scope: "workspace",
            },
          ],
        },
      },
    ]
    const listWidgetContributions = vi.fn(() => activeWidgets)
    const listSettingsPanels = vi.fn(() => activePanels)
    const shell = createWorkbenchShellSurfaceStub({
      listWidgetContributions,
      listSettingsPanels,
      pluginSummaries: () => pluginSummaries,
    })

    const props = createWorkbenchShellSurfaceProps(shell)

    expect(listWidgetContributions).toHaveBeenCalledOnce()
    expect(listSettingsPanels).toHaveBeenCalledOnce()
    // availableWidgets 是 catalog 返回值的投影（含 source / version / supportedSizes 等）
    expect(props.addWidgetModal.availableWidgets).toEqual([
      expect.objectContaining({
        pluginId: "plugin.enabled",
        id: "widget.visible",
        title: "Visible Widget",
        description: "Shown by catalog",
        supportedSizes: ["S"],
        defaultSize: "S",
        pluginName: "Enabled",
      }),
    ])
    expect(props.addWidgetModal.availableWidgets).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "widget.hidden" })]),
    )
    expect(props.settingsHost.panels).toEqual(activePanels)
    expect(props.settingsHost.panels).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "settings.hidden" })]),
    )
  })

  it("routes toast actions into command execution", () => {
    const runCommand = vi.fn()
    const shell = createWorkbenchShellSurfaceStub({ runCommand })

    const props = createWorkbenchShellSurfaceProps(shell)
    props.toastHost.onAction("open-settings")

    expect(runCommand).toHaveBeenCalledWith("open-settings", {})
  })

  it("maps plugin modal and fullscreen overlays from shell state", () => {
    const shell = createWorkbenchShellSurfaceStub()
    shell.state.overlays.setModalViewId("plugin.modal.view")
    shell.state.overlays.setFullscreenViewId("plugin.fullscreen.view")

    const props = createWorkbenchShellSurfaceProps(shell)

    expect(props.pluginModal.viewId).toBe("plugin.modal.view")
    expect(props.fullscreenOverlay.viewId).toBe("plugin.fullscreen.view")
    expect(typeof props.pluginModal.getView).toBe("function")
    expect(typeof props.fullscreenOverlay.getView).toBe("function")
  })

  it("exposes settings host close and section change handlers from overlays", () => {
    const shell = createWorkbenchShellSurfaceStub()
    shell.state.overlays.setSettingsOpen(true)

    const props = createWorkbenchShellSurfaceProps(shell)
    props.settingsHost.onSectionChange("search")
    props.settingsHost.onClose()

    expect(shell.state.overlays.activeSettingsSectionId()).toBe("search")
    expect(shell.state.overlays.settingsOpen()).toBe(false)
  })
})
