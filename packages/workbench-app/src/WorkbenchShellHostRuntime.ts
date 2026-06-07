import type { HostPlatform } from "@tabora/host-adapters"

import { runWorkbenchRailAction } from "./WorkbenchShellHostActions"
import {
  initializeWorkbenchShellRuntime,
  wireWorkbenchRuntimeEvents,
} from "./WorkbenchShellRuntimeState"
import { canPluginOpenExternal } from "./shellController"

const DARK_THEME_ID = "official.theme.dark"
const LIGHT_THEME_ID = "official.theme.light"
const APPEARANCE_SETTINGS_PANEL_ID = "official.settings.workspace.appearance"

type RuntimeBootstrap = Parameters<typeof initializeWorkbenchShellRuntime>[0]["runtime"]
type RuntimeInitializationOptions = Omit<
  Parameters<typeof initializeWorkbenchShellRuntime>[0],
  "runtime"
>
type RuntimeEventOptions = Omit<
  Parameters<typeof wireWorkbenchRuntimeEvents>[0],
  "runtime" | "openExternal"
>
type WindowOpen = (url: string, target: string) => unknown

export function createWorkbenchShellHostRuntime(
  options: {
    runtime: RuntimeBootstrap
    hostPlatform: HostPlatform
    isDark: () => boolean
    setAddWidgetOpen: (open: boolean) => void
    openSettings: (panelId?: string) => void
    switchTheme: (themeId: string) => Promise<void> | void
    windowOpen: WindowOpen
  } & RuntimeInitializationOptions &
    RuntimeEventOptions,
) {
  const openExternal = (url: string): boolean => (
    options.runtime.kernel.events.emit("host.external.open", { url }),
    true
  )

  const openExternalForPlugin = (pluginId: string, url: string): boolean =>
    canPluginOpenExternal({
      pluginId,
      url,
      plugins: options.runtime.plugins,
    }) && openExternal(url)

  const runRailAction = (actionId: string) =>
    runWorkbenchRailAction(actionId, {
      platform: options.hostPlatform,
      onAddWidget: () => options.setAddWidgetOpen(true),
      onToggleTheme: () => {
        void options.switchTheme(options.isDark() ? LIGHT_THEME_ID : DARK_THEME_ID)
      },
      onOpenSettings: () => options.openSettings(APPEARANCE_SETTINGS_PANEL_ID),
    })

  const dispose = wireWorkbenchRuntimeEvents({
    runtime: options.runtime,
    setModalViewId: options.setModalViewId,
    setModalProps: options.setModalProps,
    setFullscreenViewId: options.setFullscreenViewId,
    setFullscreenProps: options.setFullscreenProps,
    showToast: options.showToast,
    openExternal: (url) => {
      options.windowOpen(url, "_blank")
    },
  })

  const initialize = () =>
    initializeWorkbenchShellRuntime({
      runtime: options.runtime,
      setPluginRecords: options.setPluginRecords,
      setKernelReady: options.setKernelReady,
      setWorkspaceList: options.setWorkspaceList,
      setWorkspaceState: options.setWorkspaceState,
      setActiveLayoutId: options.setActiveLayoutId,
      setSearchSettings: options.setSearchSettings,
      setSearchHistory: options.setSearchHistory,
      setInstances: options.setInstances,
      applyThemeSelection: options.applyThemeSelection,
      applyBackgroundSelection: options.applyBackgroundSelection,
      reconcileInstancesForLayout: options.reconcileInstancesForLayout,
    })

  return {
    openExternal,
    openExternalForPlugin,
    runRailAction,
    dispose,
    initialize,
  }
}
