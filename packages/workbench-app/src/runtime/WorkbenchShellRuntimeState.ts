import type { PluginInstance, PluginRecord, Workspace } from "@tabora/plugin-api"

import type { WorkbenchRuntimeBootstrap } from "./bootstrap"
import { hydrateWorkbenchSessionState } from "../workspace/WorkbenchShellSessionState"
import { ensureWorkspaceSession } from "../workspace/workspaceSession"

type RuntimeBootstrap = Pick<
  WorkbenchRuntimeBootstrap,
  "kernel" | "plugins" | "repositories" | "defaultWorkspacePreset" | "shellConfig"
>

export async function initializeWorkbenchShellRuntime(options: {
  runtime: RuntimeBootstrap
  setPluginRecords: (records: PluginRecord[]) => void
  setKernelReady: (ready: boolean) => void
  setWorkspaceList: (workspaces: Workspace[]) => void
  setWorkspaceState: Parameters<typeof hydrateWorkbenchSessionState>[0]["setWorkspaceState"]
  setActiveLayoutId: Parameters<typeof hydrateWorkbenchSessionState>[0]["setActiveLayoutId"]
  setSearchSettings: Parameters<typeof hydrateWorkbenchSessionState>[0]["setSearchSettings"]
  setSearchHistory: Parameters<typeof hydrateWorkbenchSessionState>[0]["setSearchHistory"]
  setInstances: (instances: PluginInstance[]) => void
  applyThemeSelection: Parameters<typeof hydrateWorkbenchSessionState>[0]["applyThemeSelection"]
  applyBackgroundSelection: Parameters<
    typeof hydrateWorkbenchSessionState
  >[0]["applyBackgroundSelection"]
  reconcileInstancesForLayout: Parameters<
    typeof hydrateWorkbenchSessionState
  >[0]["reconcileInstancesForLayout"]
}) {
  const { kernel, plugins, repositories, defaultWorkspacePreset, shellConfig } = options.runtime

  await kernel.discover(plugins)
  await kernel.activateEnabledPlugins()
  options.setPluginRecords(await repositories.pluginRecordRepo.getAll())

  const session = await ensureWorkspaceSession({
    workspaceRepo: repositories.workspaceRepo,
    instanceRepo: repositories.instanceRepo,
    pluginDataRepo: repositories.pluginDataRepo,
    defaultWorkspacePreset,
    searchHistoryStorage: shellConfig.searchHistory,
  })

  await hydrateWorkbenchSessionState({
    session,
    setWorkspaceState: options.setWorkspaceState,
    setActiveLayoutId: options.setActiveLayoutId,
    setSearchSettings: options.setSearchSettings,
    setSearchHistory: options.setSearchHistory,
    setInstances: options.setInstances,
    applyThemeSelection: options.applyThemeSelection,
    applyBackgroundSelection: options.applyBackgroundSelection,
    reconcileInstancesForLayout: options.reconcileInstancesForLayout,
  })

  options.setWorkspaceList(await repositories.workspaceRepo.getAll())
  options.setKernelReady(true)
}

export function wireWorkbenchRuntimeEvents(options: {
  runtime: RuntimeBootstrap
  setModalViewId: (viewId: string | null) => void
  setModalProps: (props: Record<string, unknown>) => void
  setFullscreenViewId: (viewId: string | null) => void
  setFullscreenProps: (props: Record<string, unknown>) => void
  showToast: (
    message: string,
    options?: {
      type?: "success" | "error" | "warning" | "info"
      duration?: number
      action?: { label: string; commandId: string }
    },
  ) => void
  openExternal: (url: string) => void
}) {
  const disposeModalOpen = options.runtime.kernel.events.on("ui.modal.open", (payload) => {
    const modalPayload = payload as { viewId: string; props?: Record<string, unknown> }
    options.setModalViewId(modalPayload.viewId)
    options.setModalProps(modalPayload.props ?? {})
  })
  const disposeModalClose = options.runtime.kernel.events.on("ui.modal.close", () => {
    options.setModalViewId(null)
  })
  const disposeFullscreenOpen = options.runtime.kernel.events.on(
    "ui.fullscreen.open",
    (payload) => {
      const fullscreenPayload = payload as { viewId: string; props?: Record<string, unknown> }
      options.setFullscreenViewId(fullscreenPayload.viewId)
      options.setFullscreenProps(fullscreenPayload.props ?? {})
    },
  )
  const disposeFullscreenClose = options.runtime.kernel.events.on("ui.fullscreen.close", () => {
    options.setFullscreenViewId(null)
  })
  const disposeToast = options.runtime.kernel.events.on("ui.toast.show", (payload) => {
    const toastPayload = payload as {
      message: string
      options?: {
        type?: "success" | "error" | "warning" | "info"
        duration?: number
        action?: { label: string; commandId: string }
      }
    }
    if (typeof toastPayload.message === "string") {
      options.showToast(toastPayload.message, toastPayload.options)
    }
  })
  const disposeExternalOpen = options.runtime.kernel.events.on("host.external.open", (payload) => {
    const externalPayload = payload as { url: string }
    if (typeof externalPayload.url === "string") {
      options.openExternal(externalPayload.url)
    }
  })

  return () => {
    disposeModalOpen()
    disposeModalClose()
    disposeFullscreenOpen()
    disposeFullscreenClose()
    disposeToast()
    disposeExternalOpen()
  }
}
