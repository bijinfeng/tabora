import { createLayoutEngine } from "./layoutEngine"
import type { WorkbenchShellConfig } from "../shared/shellConfig"
import { createWorkbenchLayoutHostAPI } from "./WorkbenchShellLayoutHost"
import { createWorkbenchLayoutRenderer } from "./WorkbenchShellLayoutRenderer"

type LayoutHostOptions = Parameters<typeof createWorkbenchLayoutHostAPI>[0]
type LayoutEngineOptions = Parameters<typeof createLayoutEngine>[0]
type LayoutRendererOptions = Parameters<typeof createWorkbenchLayoutRenderer>[0]

type LayoutRendererBridges = Pick<
  LayoutRendererOptions,
  | "activeLayoutId"
  | "layoutError"
  | "displayedInstances"
  | "isMobile"
  | "clearLayoutError"
  | "recordLayoutError"
> & { dndKit?: LayoutRendererOptions["dndKit"] }

export function createWorkbenchShellLayoutRuntime(
  options: {
    shellConfig: WorkbenchShellConfig
  } & LayoutHostOptions &
    Pick<LayoutEngineOptions, "catalog" | "instanceRenderer"> &
    LayoutRendererBridges,
) {
  const layoutHostAPI = createWorkbenchLayoutHostAPI({
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

  const layoutEngine = createLayoutEngine({
    catalog: options.catalog,
    instanceRenderer: options.instanceRenderer,
    hostActions: layoutHostAPI,
  })

  const layoutRendererOptions: LayoutRendererOptions = {
    activeLayoutId: options.activeLayoutId,
    displayedInstances: options.displayedInstances,
    buildRegionSlots: (layoutId, instances) => layoutEngine.buildRegionSlots(layoutId, instances),
    buildHostAPI: () => layoutEngine.buildHostAPI(),
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
