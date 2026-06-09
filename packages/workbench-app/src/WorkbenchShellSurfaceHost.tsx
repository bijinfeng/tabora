import { createMemo } from "solid-js"
import { CommandPalette, SettingsHost, ToastHost } from "@tabora/workbench-shell"

import {
  WorkbenchAddWidgetModal,
  WorkbenchContextMenuOverlay,
  WorkbenchExpandOverlay,
  WorkbenchFullscreenOverlay,
  WorkbenchPluginModal,
} from "./WorkbenchShellChrome"
import { useWorkbenchShell } from "./WorkbenchShellContext"
import { createWorkbenchShellSurfaceProps } from "./WorkbenchShellSurfaceProps"

export function WorkbenchShellSurfaceHost() {
  const shell = useWorkbenchShell()
  const surface = createMemo(() => createWorkbenchShellSurfaceProps(shell))

  return (
    <>
      {surface().content}
      <WorkbenchAddWidgetModal {...surface().addWidgetModal} />
      <SettingsHost {...surface().settingsHost} />
      <WorkbenchExpandOverlay {...surface().expandOverlay} />
      <WorkbenchPluginModal {...surface().pluginModal} />
      <WorkbenchFullscreenOverlay {...surface().fullscreenOverlay} />
      <WorkbenchContextMenuOverlay {...surface().contextMenuOverlay} />
      <ToastHost {...surface().toastHost} />
      <CommandPalette {...surface().commandPalette} />
    </>
  )
}
