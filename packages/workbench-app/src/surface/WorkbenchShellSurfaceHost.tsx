import { createMemo, Show } from "solid-js"
import { CommandPalette, SettingsHost, ToastHost } from "@tabora/workbench-shell"

import { WorkbenchAddWidgetModal, WorkbenchExpandOverlay } from "./WorkbenchShellChrome"
import { WorkbenchFullscreenOverlay, WorkbenchPluginModal } from "./WorkbenchPluginOverlays"
import { useWorkbenchShell } from "../shell/WorkbenchShellContext"
import { createWorkbenchShellSurfaceProps } from "./WorkbenchShellSurfaceProps"

export function WorkbenchShellSurfaceHost() {
  const shell = useWorkbenchShell()
  const surface = createMemo(() => createWorkbenchShellSurfaceProps(shell))
  const isMobileSettingsPage = () => {
    const current = surface()
    return current.settingsHost.open && current.settingsHost.surface === "mobile"
  }

  return (
    <>
      <Show when={!isMobileSettingsPage()}>
        {surface().content}
        <WorkbenchAddWidgetModal {...surface().addWidgetModal} />
        <WorkbenchExpandOverlay {...surface().expandOverlay} />
        <WorkbenchPluginModal {...surface().pluginModal} />
        <WorkbenchFullscreenOverlay {...surface().fullscreenOverlay} />
        <ToastHost {...surface().toastHost} />
        <CommandPalette {...surface().commandPalette} />
      </Show>
      <SettingsHost {...surface().settingsHost} />
    </>
  )
}
