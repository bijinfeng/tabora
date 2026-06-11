import type { WidgetSize } from "@tabora/plugin-api"

import { createLayoutEngine } from "./layoutEngine"
import { resolveWorkbenchThemeToggleTarget, type WorkbenchShellConfig } from "../shared/shellConfig"
import { createWorkbenchLayoutHostAPI } from "./WorkbenchShellLayoutHost"
import {
  createWorkbenchLayoutRenderer,
  type WorkbenchSafeLayoutOptions,
} from "./WorkbenchShellLayoutRenderer"
import type { WorkbenchContextMenuState } from "../shell/WorkbenchShellState"

type LayoutHostOptions = Parameters<typeof createWorkbenchLayoutHostAPI>[0]
type LayoutEngineOptions = Parameters<typeof createLayoutEngine>[0]
type LayoutRendererOptions = Parameters<typeof createWorkbenchLayoutRenderer>[0]

type SafeLayoutBridges = {
  setContextMenu: (menu: WorkbenchContextMenuState | null) => void
  dndKit?: LayoutRendererOptions["dndKit"]
  widgetContribution: WorkbenchSafeLayoutOptions["widgetContribution"]
  resolveWidgetModel: WorkbenchSafeLayoutOptions["resolveWidgetModel"]
  getWidgetView: WorkbenchSafeLayoutOptions["getView"]
  renderWidgetIcon: WorkbenchSafeLayoutOptions["renderWidgetIcon"]
  buildWidgetViewProps: WorkbenchSafeLayoutOptions["buildWidgetViewProps"]
  openWidgetExpand: WorkbenchSafeLayoutOptions["onOpenExpand"]
  changeWidgetSize: (instanceId: string, size: WidgetSize) => Promise<void> | void
  removeWidget: (instanceId: string) => Promise<void> | void
  isDragging: WorkbenchSafeLayoutOptions["isDragging"]
}

type LayoutRendererBridges = Pick<
  LayoutRendererOptions,
  | "activeLayoutId"
  | "failedLayoutId"
  | "displayedInstances"
  | "resolveLayoutView"
  | "isMobile"
  | "clearLayoutError"
  | "recordLayoutError"
>

export function createWorkbenchShellLayoutRuntime(
  options: {
    shellConfig: WorkbenchShellConfig
  } & LayoutHostOptions &
    Pick<LayoutEngineOptions, "catalog" | "instanceRenderer"> &
    LayoutRendererBridges &
    SafeLayoutBridges,
) {
  const layoutHostAPI = createWorkbenchLayoutHostAPI({
    activeLayoutId: options.activeLayoutId,
    isDark: options.isDark,
    shellConfig: options.shellConfig,
    setCommandPaletteOpen: options.setCommandPaletteOpen,
    setAddWidgetOpen: options.setAddWidgetOpen,
    openSettings: options.openSettings,
    switchLayout: (layoutId) => {
      options.switchLayout(layoutId)
    },
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

  const layoutRendererOptions: Omit<LayoutRendererOptions, "failedLayoutId"> = {
    activeLayoutId: options.activeLayoutId,
    displayedInstances: options.displayedInstances,
    findLayoutContribution: (layoutId) => options.catalog.findLayoutContribution(layoutId),
    resolveLayoutView: options.resolveLayoutView,
    buildRegionSlots: (layoutId, instances) => layoutEngine.buildRegionSlots(layoutId, instances),
    buildHostAPI: () => layoutEngine.buildHostAPI(),
    isMobile: options.isMobile,
    clearLayoutError: options.clearLayoutError,
    recordLayoutError: options.recordLayoutError,
    safeLayout: {
      isDark: options.isDark,
      instances: options.displayedInstances,
      widgetContribution: options.widgetContribution,
      resolveWidgetModel: options.resolveWidgetModel,
      getView: options.getWidgetView,
      renderWidgetIcon: options.renderWidgetIcon,
      buildWidgetViewProps: options.buildWidgetViewProps,
      onOpenCommandPalette: () => options.setCommandPaletteOpen(true),
      onToggleTheme: () => {
        options.switchTheme(
          resolveWorkbenchThemeToggleTarget(options.isDark(), options.shellConfig.themeIds),
        )
      },
      onOpenSettings: () => options.openSettings(),
      onOpenExpand: options.openWidgetExpand,
      onOpenContextMenu: (event, instanceId) => {
        event.preventDefault()
        options.setContextMenu({ x: event.clientX, y: event.clientY, instanceId })
      },
      onResize: (instanceId, size) => {
        void options.changeWidgetSize(instanceId, size)
      },
      onRemove: (instanceId) => {
        void options.removeWidget(instanceId)
      },
      isDragging: options.isDragging,
    },
    ...(options.dndKit ? { dndKit: options.dndKit } : {}),
  }

  const layoutRenderer = createWorkbenchLayoutRenderer(
    options.failedLayoutId
      ? { ...layoutRendererOptions, failedLayoutId: options.failedLayoutId }
      : layoutRendererOptions,
  )

  return {
    renderSafeLayout: layoutRenderer.renderSafeLayout,
    renderActiveLayout: layoutRenderer.renderActiveLayout,
  }
}
