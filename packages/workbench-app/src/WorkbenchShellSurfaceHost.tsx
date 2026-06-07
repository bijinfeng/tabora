import type { JSX } from "solid-js"
import { CommandPalette, SettingsHost, ToastHost } from "@tabora/workbench-shell"

import {
  WorkbenchAddWidgetModal,
  WorkbenchContextMenuOverlay,
  WorkbenchExpandOverlay,
  WorkbenchFullscreenOverlay,
  WorkbenchPluginModal,
} from "./WorkbenchShellChrome"

export function WorkbenchShellSurfaceHost(props: {
  content: JSX.Element
  addWidgetModal: Parameters<typeof WorkbenchAddWidgetModal>[0]
  settingsHost: Parameters<typeof SettingsHost>[0]
  expandOverlay: Parameters<typeof WorkbenchExpandOverlay>[0]
  pluginModal: Parameters<typeof WorkbenchPluginModal>[0]
  fullscreenOverlay: Parameters<typeof WorkbenchFullscreenOverlay>[0]
  contextMenuOverlay: Parameters<typeof WorkbenchContextMenuOverlay>[0]
  toastHost: Parameters<typeof ToastHost>[0]
  commandPalette: Parameters<typeof CommandPalette>[0]
}) {
  return (
    <>
      {props.content}
      <WorkbenchAddWidgetModal {...props.addWidgetModal} />
      <SettingsHost {...props.settingsHost} />
      <WorkbenchExpandOverlay {...props.expandOverlay} />
      <WorkbenchPluginModal {...props.pluginModal} />
      <WorkbenchFullscreenOverlay {...props.fullscreenOverlay} />
      <WorkbenchContextMenuOverlay {...props.contextMenuOverlay} />
      <ToastHost {...props.toastHost} />
      <CommandPalette {...props.commandPalette} />
    </>
  )
}
