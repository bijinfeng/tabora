import type {
  PluginInstance,
  PluginManifest,
  SearchHistoryEntry,
  WorkbenchSearchSettings,
  Workspace,
} from "@tabora/plugin-api"
import type { PluginCatalog, ToastOptions } from "@tabora/orchestrator"
import type { ViewRegistry } from "@tabora/platform-kernel"
import type { InstanceRepository, PluginDataRepository } from "@tabora/storage"

import { renderWorkbenchWidgetIcon } from "../shared/WorkbenchShellIcons"
import type { WorkbenchDragControllerState } from "../drag/WorkbenchDragController"
import { createWorkbenchPointerDragHandlers } from "../drag/WorkbenchShellDragState"
import { createWorkbenchShellViewRuntime } from "./WorkbenchShellViewRuntime"
import { createWorkbenchWidgetController } from "../widget/WorkbenchShellWidgetController"
import type { WorkbenchExpandState } from "../surface/WorkbenchShellInteractions"
import { createWorkbenchSearchSurfaces } from "../search/WorkbenchShellSearchSurfaces"
import { createWorkbenchShellCommandModels } from "../command/WorkbenchShellCommands"
import type { WorkbenchShellConfig } from "../shared/shellConfig"
import type { WorkbenchContextMenuState } from "./WorkbenchShellState"
import {
  resolveDefaultProviderForSearch,
  resolveEnabledSearchProviders,
  resolveWidgetRenderModel,
} from "../shared/shellHelpers"
import { assignGridOrder } from "../shared/workbenchGrid"

type CommandExecutionContext = Parameters<
  ReturnType<typeof createWorkbenchShellCommandModels>["runCommand"]
>[1]

type CommandRuntime = ReturnType<typeof createWorkbenchShellCommandModels>
type WidgetRuntime = ReturnType<typeof createWorkbenchWidgetController>
type SearchRuntime = ReturnType<typeof createWorkbenchSearchSurfaces>
type DragRuntime = ReturnType<typeof createWorkbenchPointerDragHandlers>
type ViewRuntime = ReturnType<typeof createWorkbenchShellViewRuntime>
type ControllerCatalog = Pick<
  PluginCatalog,
  | "listSearchProviders"
  | "findLayoutContribution"
  | "findWidgetContribution"
  | "findSearchContribution"
>
type ControllerRegistryViews = Pick<ViewRegistry, "has" | "get">
type ControllerPlugins = Array<{
  manifest: {
    contributes: Pick<PluginManifest["contributes"], "commands" | "keybindings">
  }
}>
type ControllerInstanceRepo = Pick<InstanceRepository, "save" | "remove">
type ControllerPluginDataRepo = Pick<PluginDataRepository, "getByInstance" | "saveForInstance">
type SetInstances = (
  next: PluginInstance[] | ((instances: PluginInstance[]) => PluginInstance[]),
) => PluginInstance[] | void

export function createWorkbenchShellControllerRuntime(options: {
  services: {
    plugins: ControllerPlugins
    pluginCatalog: ControllerCatalog
    registryViews: ControllerRegistryViews
    instanceRepo: ControllerInstanceRepo
    pluginDataRepo: ControllerPluginDataRepo
  }
  state: {
    workspace: () => Workspace | null
    activeLayoutId: () => string
    instances: () => PluginInstance[]
    expandState: () => WorkbenchExpandState | null
    contextMenu: () => WorkbenchContextMenuState | null
    dragState: () => WorkbenchDragControllerState | null
    searchSettings: () => WorkbenchSearchSettings
    searchHistory: () => SearchHistoryEntry[]
    inlineSearchQuery: () => string
    inlineSearchOpen: () => boolean
    inlineSearchActiveResultIndex: () => number
    commandPaletteOpen: () => boolean
    isDark: () => boolean
  }
  shellConfig: WorkbenchShellConfig
  setters: {
    setInstances: SetInstances
    setExpandState: (state: WorkbenchExpandState | null) => void
    setContextMenu: (state: WorkbenchContextMenuState | null) => void
    setDragState: (state: WorkbenchDragControllerState | null) => void
    setCommandPaletteOpen: (open: boolean) => void
    setAddWidgetOpen: (open: boolean) => void
    setInlineSearchQuery: (query: string) => void
    setInlineSearchOpen: (open: boolean) => void
    setInlineSearchActiveResultIndex: (next: number | ((current: number) => number)) => void
    setModalViewId: (viewId: string | null) => void
    setModalProps: (props: Record<string, unknown>) => void
  }
  actions: {
    openSettings: (sectionId?: string) => void
    showToast: (message: string, options?: ToastOptions) => void
    focusWidgetInstance: (instanceId: string) => boolean
  }
  controllers: {
    workspaceController: {
      switchTheme: (themeId: string) => void | Promise<void>
      switchLayout: (layoutId: string) => void | Promise<void>
      setDefaultSearchProvider: (providerId: string) => void | Promise<void>
      saveSearchHistory: (entry: { query: string; providerId: string }) => Promise<void>
    }
    hostRuntime: {
      openExternal: (url: string) => boolean
      openExternalForPlugin: (pluginId: string, url: string) => boolean
    }
  }
}) {
  const pluginCommands = options.services.plugins.flatMap(
    (plugin) => plugin.manifest.contributes.commands ?? [],
  )
  const pluginKeybindings = options.services.plugins.flatMap(
    (plugin) => plugin.manifest.contributes.keybindings ?? [],
  )

  const runPluginCommand = (_commandId: string, _context: CommandExecutionContext) => {
    // Plugin command execution is routed here so widget context stays available for the future bus.
  }

  const commandRuntime: CommandRuntime = createWorkbenchShellCommandModels({
    isDark: options.state.isDark,
    activeLayoutId: options.state.activeLayoutId,
    shellConfig: options.shellConfig,
    pluginCommands,
    pluginKeybindings,
    setCommandPaletteOpen: options.setters.setCommandPaletteOpen,
    setAddWidgetOpen: options.setters.setAddWidgetOpen,
    openSettings: options.actions.openSettings,
    showToast: (message) => options.actions.showToast(message),
    switchTheme: (themeId) => {
      void options.controllers.workspaceController.switchTheme(themeId)
    },
    switchLayout: (layoutId) => {
      void options.controllers.workspaceController.switchLayout(layoutId)
    },
    runPluginCommand,
  })

  let viewRuntime: ViewRuntime
  const widgetController: WidgetRuntime = createWorkbenchWidgetController({
    getWorkspace: options.state.workspace,
    getActiveLayoutId: options.state.activeLayoutId,
    getInstances: options.state.instances,
    getExpandState: options.state.expandState,
    getContextMenu: options.state.contextMenu,
    setInstances: (instances) => {
      options.setters.setInstances(instances)
    },
    setExpandState: options.setters.setExpandState,
    setContextMenu: options.setters.setContextMenu,
    resolveLayoutRegions: (layoutId) =>
      options.services.pluginCatalog.findLayoutContribution(layoutId)?.regions ?? [],
    resolveWidgetContribution: (pluginId, contributionId) =>
      options.services.pluginCatalog.findWidgetContribution(pluginId, contributionId),
    resolveWidgetRenderModel: (instance) =>
      resolveWidgetRenderModel(
        instance,
        options.services.pluginCatalog.findWidgetContribution(
          instance.pluginId,
          instance.contributionId,
        ),
      ),
    hasView: (viewId) => options.services.registryViews.has(viewId),
    buildWidgetViewProps: (instance, model) => viewRuntime.buildWidgetViewProps(instance, model),
    assignGridOrder,
    saveInstance: (instance) => options.services.instanceRepo.save(instance),
    removeInstance: (instanceId) => options.services.instanceRepo.remove(instanceId),
    showToast: options.actions.showToast,
    focusWidgetInstance: options.actions.focusWidgetInstance,
    availableCommandIds: commandRuntime.availableCommandIds,
    runCommand: commandRuntime.runCommand,
  })

  const searchSurfaces: SearchRuntime = createWorkbenchSearchSurfaces({
    getProviders: () =>
      resolveEnabledSearchProviders(
        options.state.searchSettings(),
        options.services.pluginCatalog.listSearchProviders(),
      ),
    getDefaultProviderId: () =>
      resolveDefaultProviderForSearch(
        options.state.searchSettings(),
        options.services.pluginCatalog.listSearchProviders(),
      ),
    getCommands: commandRuntime.commandItems,
    getWidgets: () => widgetController.buildSearchableWidgets(),
    getHistory: options.state.searchHistory,
    getInlineSearchQuery: options.state.inlineSearchQuery,
    getInlineSearchOpen: options.state.inlineSearchOpen,
    getInlineSearchActiveResultIndex: options.state.inlineSearchActiveResultIndex,
    setInlineSearchQuery: options.setters.setInlineSearchQuery,
    setInlineSearchOpen: options.setters.setInlineSearchOpen,
    setInlineSearchActiveResultIndex: options.setters.setInlineSearchActiveResultIndex,
    setDefaultProvider: options.controllers.workspaceController.setDefaultSearchProvider,
    saveHistory: options.controllers.workspaceController.saveSearchHistory,
    openExternalForPlugin: options.controllers.hostRuntime.openExternalForPlugin,
    openExternal: options.controllers.hostRuntime.openExternal,
    showToast: options.actions.showToast,
    isCommandPaletteOpen: options.state.commandPaletteOpen,
    closeCommandPalette: () => options.setters.setCommandPaletteOpen(false),
  })

  const dragHandlers: DragRuntime = createWorkbenchPointerDragHandlers({
    getPersistedInstances: options.state.instances,
    getDragState: options.state.dragState,
    setDragState: options.setters.setDragState,
    persistGridOrder: (orderedInstances) => widgetController.persistGridOrder(orderedInstances),
    showToast: (message) => options.actions.showToast(message),
  })

  viewRuntime = createWorkbenchShellViewRuntime({
    registryViews: options.services.registryViews,
    widgetContribution: (instance) => widgetController.widgetContribution(instance),
    widgetRenderModel: (instance) => widgetController.widgetRenderModel(instance),
    findSearchContribution: (pluginId, contributionId) =>
      options.services.pluginCatalog.findSearchContribution(pluginId, contributionId),
    buildInlineSearchViewProps: (instance) => searchSurfaces.buildInlineSearchViewProps(instance),
    renderWidgetIcon: renderWorkbenchWidgetIcon,
    onPointerDown: (event, instanceId) => dragHandlers.onPointerDown(event, instanceId),
    onPointerMove: (event) => dragHandlers.onPointerMove(event),
    onPointerUp: (event) => dragHandlers.onPointerUp(event),
    onPointerCancel: (event) => dragHandlers.onPointerCancel(event),
    openWidgetExpand: widgetController.openWidgetExpand,
    setContextMenu: options.setters.setContextMenu,
    changeWidgetSize: widgetController.changeWidgetSize,
    removeWidget: widgetController.removeWidget,
    isDragging: (instanceId) => dragHandlers.isDragging(instanceId),
    pluginDataRepo: options.services.pluginDataRepo,
    saveInstance: (updated) => options.services.instanceRepo.save(updated),
    setInstances: options.setters.setInstances,
    setModalViewId: options.setters.setModalViewId,
    setModalProps: options.setters.setModalProps,
    showToast: options.actions.showToast,
    openExternalForPlugin: options.controllers.hostRuntime.openExternalForPlugin,
  })

  return {
    runCommand: commandRuntime.runCommand,
    shortcutRegistry: commandRuntime.shortcutRegistry,
    widgetController,
    searchSurfaces,
    dragHandlers,
    viewRuntime,
  }
}
