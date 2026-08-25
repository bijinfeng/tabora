import type { WorkbenchShellConfig } from "../shared/shellConfig"
import { createWorkbenchLayoutHostAPI } from "./WorkbenchShellLayoutHost"
import { createWorkbenchLayoutRenderer } from "./WorkbenchShellLayoutRenderer"

type LayoutHostOptions = Parameters<typeof createWorkbenchLayoutHostAPI>[0]
type LayoutRendererOptions = Parameters<typeof createWorkbenchLayoutRenderer>[0]

type LayoutRendererBridges = Pick<
  LayoutRendererOptions,
  | "activeLayoutId"
  | "layoutError"
  | "displayedInstances"
  | "isMobile"
  | "clearLayoutError"
  | "recordLayoutError"
  | "instanceRenderer"
>

export function createWorkbenchShellLayoutRuntime(
  options: {
    shellConfig: WorkbenchShellConfig
    layoutHostAPI?: ReturnType<typeof createWorkbenchLayoutHostAPI>
  } & LayoutHostOptions &
    LayoutRendererBridges & { dndKit?: LayoutRendererOptions["dndKit"] },
) {
  const layoutHostAPI =
    options.layoutHostAPI ??
    createWorkbenchLayoutHostAPI({
      activeLayoutId: options.activeLayoutId,
      isDark: options.isDark,
      ...(options.tShell ? { tShell: options.tShell } : {}),
      shellConfig: options.shellConfig,
      setCommandPaletteOpen: options.setCommandPaletteOpen,
      setAddWidgetOpen: options.setAddWidgetOpen,
      openSettings: options.openSettings,
      readLayoutState: options.readLayoutState,
      writeLayoutState: options.writeLayoutState,
      showToast: options.showToast,
      switchTheme: (themeId) => {
        options.switchTheme(themeId)
      },
      runRailAction: options.runRailAction,
    })

  const layoutRendererOptions: LayoutRendererOptions = {
    activeLayoutId: options.activeLayoutId,
    displayedInstances: options.displayedInstances,
    instanceRenderer: options.instanceRenderer,
    layoutHostAPI,
    isMobile: options.isMobile,
    layoutError: options.layoutError,
    clearLayoutError: options.clearLayoutError,
    recordLayoutError: options.recordLayoutError,
    ...(options.dndKit ? { dndKit: options.dndKit } : {}),
  }

  const layoutRenderer = createWorkbenchLayoutRenderer(layoutRendererOptions)

  return {
    renderActiveLayout: layoutRenderer.renderActiveLayout,
  }
}
