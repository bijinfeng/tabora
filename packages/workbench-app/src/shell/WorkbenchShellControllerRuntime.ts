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
import {
  createWorkbenchDndKitDragHandlers,
  type WorkbenchDndDragState,
} from "../drag/WorkbenchShellDragState"
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
import type {
  ShellTranslation,
  WorkbenchShellCommandPaletteCopy,
  WorkbenchShellPluginViewBoundaryCopy,
  WorkbenchShellWidgetCopy,
} from "../i18n"

type CommandExecutionContext = Parameters<
  ReturnType<typeof createWorkbenchShellCommandModels>["runCommand"]
>[1]

type CommandRuntime = ReturnType<typeof createWorkbenchShellCommandModels>
type WidgetRuntime = ReturnType<typeof createWorkbenchWidgetController>
type SearchRuntime = ReturnType<typeof createWorkbenchSearchSurfaces>
type DragRuntime = ReturnType<typeof createWorkbenchDndKitDragHandlers>
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
  tShell?: ShellTranslation
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
    dragState: () => WorkbenchDndDragState | null
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
    setDragState: (state: WorkbenchDndDragState | null) => void
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
  copy?: {
    getCommandPaletteCopy?: () => WorkbenchShellCommandPaletteCopy
    widgetShellCopy?: WorkbenchShellWidgetCopy
    pluginViewBoundaryCopy?: WorkbenchShellPluginViewBoundaryCopy
  }
  controllers: {
    workspaceController: {
      switchTheme: (themeId: string) => void | Promise<void>
      switchLayout: (layoutId: string) => void | Promise<void>
      setDefaultSearchProvider: (providerId: string) => void | Promise<void>
      saveSearchHistory: (entry: { query: string; providerId: string }) => Promise<void>
    }
    hostRuntime: {
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
    ...(options.tShell ? { tShell: options.tShell } : {}),
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
    ...(options.tShell ? { tShell: options.tShell } : {}),
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
    showToast: options.actions.showToast,
    isCommandPaletteOpen: options.state.commandPaletteOpen,
    closeCommandPalette: () => options.setters.setCommandPaletteOpen(false),
    ...(options.copy?.getCommandPaletteCopy
      ? { getCommandPaletteCopy: options.copy.getCommandPaletteCopy }
      : {}),
  })

  const dragHandlers: DragRuntime = createWorkbenchDndKitDragHandlers({
    getPersistedInstances: options.state.instances,
    getDragState: options.state.dragState,
    setDragState: options.setters.setDragState,
    persistGridOrder: (orderedInstances) => widgetController.persistGridOrder(orderedInstances),
    showToast: (message) => options.actions.showToast(message),
  })

  viewRuntime = createWorkbenchShellViewRuntime({
    registryViews: options.services.registryViews,
    ...(options.tShell ? { tShell: options.tShell } : {}),
    widgetContribution: (instance) => widgetController.widgetContribution(instance),
    widgetRenderModel: (instance) => widgetController.widgetRenderModel(instance),
    findSearchContribution: (pluginId, contributionId) =>
      options.services.pluginCatalog.findSearchContribution(pluginId, contributionId),
    buildInlineSearchViewProps: (instance) => searchSurfaces.buildInlineSearchViewProps(instance),
    renderWidgetIcon: renderWorkbenchWidgetIcon,
    openWidgetExpand: widgetController.openWidgetExpand,
    setContextMenu: options.setters.setContextMenu,
    buildContextMenuItems: (instanceId) => widgetController.buildContextMenuItems(instanceId),
    changeWidgetSize: widgetController.changeWidgetSize,
    removeWidget: widgetController.removeWidget,
    isDragging: (instanceId) => dragHandlers.isDragging(instanceId),
    sortableIndex: (instanceId) => dragHandlers.sortableIndex(instanceId),
    pluginDataRepo: options.services.pluginDataRepo,
    saveInstance: (updated) => options.services.instanceRepo.save(updated),
    setInstances: options.setters.setInstances,
    setModalViewId: options.setters.setModalViewId,
    setModalProps: options.setters.setModalProps,
    showToast: options.actions.showToast,
    openExternalForPlugin: options.controllers.hostRuntime.openExternalForPlugin,
    ...(options.copy?.widgetShellCopy ? { widgetShellCopy: options.copy.widgetShellCopy } : {}),
    ...(options.copy?.pluginViewBoundaryCopy
      ? { pluginViewBoundaryCopy: options.copy.pluginViewBoundaryCopy }
      : {}),
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
