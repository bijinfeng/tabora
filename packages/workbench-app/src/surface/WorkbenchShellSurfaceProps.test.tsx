import type { JSX } from "solid-js"
import type { Workspace } from "@tabora/plugin-api"
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
    const addWidget = vi.fn(async () => {})
    const shell = createWorkbenchShellSurfaceStub({ addWidget })
    shell.state.overlays.setAddWidgetOpen(true)

    const props = createWorkbenchShellSurfaceProps(shell)
    props.addWidgetModal.onAdd("plugin.widgets", "widget.notes")

    expect(addWidget).toHaveBeenCalledWith("plugin.widgets", "widget.notes")
    expect(shell.state.overlays.addWidgetOpen()).toBe(false)
    expect(props.contextMenuOverlay.sections).toEqual([])
  })

  it("routes toast actions into command execution", () => {
    const runCommand = vi.fn()
    const shell = createWorkbenchShellSurfaceStub({ runCommand })

    const props = createWorkbenchShellSurfaceProps(shell)
    props.toastHost.onAction("open-settings")

    expect(runCommand).toHaveBeenCalledWith("open-settings", {})
  })
})
