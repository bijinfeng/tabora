import type {
  PluginInstance,
  SearchWidgetEntry,
  WidgetContextMenuContribution,
  WidgetSize,
} from "@tabora/plugin-api"
import { createDragSortPlan, createWidgetContextMenuModel } from "@tabora/orchestrator"

import {
  buildSearchableWidgetEntries,
  type BuildSearchableWidgetEntriesOptions,
  type WidgetRenderModel,
} from "./shellHelpers"

type WorkbenchContextMenuPosition = {
  instanceId: string
  x?: number
  y?: number
}

export function findWorkbenchWidgetInstance(
  instances: PluginInstance[],
  instanceId: string,
): PluginInstance | undefined {
  return instances.find((instance) => instance.id === instanceId)
}

export function resolveWorkbenchContextMenuInstance(
  menu: WorkbenchContextMenuPosition | null,
  instances: PluginInstance[],
): PluginInstance | null {
  if (!menu) return null
  return findWorkbenchWidgetInstance(instances, menu.instanceId) ?? null
}

export function resolveWorkbenchSupportedWidgetSizes(
  instance: PluginInstance | null,
  resolveWidgetRenderModel: (instance: PluginInstance) => WidgetRenderModel | null,
): WidgetSize[] {
  if (!instance) return []
  return resolveWidgetRenderModel(instance)?.supportedSizes ?? []
}

export function buildWorkbenchContextMenuModel(options: {
  menu: WorkbenchContextMenuPosition | null
  instances: PluginInstance[]
  resolveWidgetRenderModel: (instance: PluginInstance) => WidgetRenderModel | null
  resolveContextMenus: (instance: PluginInstance) => WidgetContextMenuContribution[]
  availableCommandIds: string[] | Set<string>
  runCommand: (commandId: string, context: { instance: PluginInstance }) => boolean
  hasInstanceSettings: (instance: PluginInstance) => boolean
  onResize: (instanceId: string, size: WidgetSize) => void
  onExpand: (instanceId: string) => void
  onOpenSettings: (instanceId: string) => void
  onRemove: (instanceId: string) => void
}) {
  const instance = resolveWorkbenchContextMenuInstance(options.menu, options.instances)
  if (!instance) return null

  return createWidgetContextMenuModel({
    instance,
    supportedSizes: resolveWorkbenchSupportedWidgetSizes(
      instance,
      options.resolveWidgetRenderModel,
    ),
    contextMenus: options.resolveContextMenus(instance),
    availableCommandIds: options.availableCommandIds,
    runCommand: options.runCommand,
    hasInstanceSettings: options.hasInstanceSettings(instance),
    onResize: options.onResize,
    onExpand: options.onExpand,
    onOpenSettings: options.onOpenSettings,
    onRemove: options.onRemove,
  })
}

export function buildWorkbenchSearchableWidgets(
  options: BuildSearchableWidgetEntriesOptions,
): SearchWidgetEntry[] {
  return buildSearchableWidgetEntries(options)
}

export function buildWorkbenchDragDropPlan(options: {
  dragId: string | null
  targetId: string
  instances: PluginInstance[]
}) {
  if (!options.dragId || options.dragId === options.targetId) return null
  return createDragSortPlan({
    sourceId: options.dragId,
    targetId: options.targetId,
    instances: options.instances,
  })
}

export function mergeWorkbenchGridOrder(
  currentInstances: PluginInstance[],
  orderedInstances: PluginInstance[],
): PluginInstance[] {
  const nextById = new Map(orderedInstances.map((instance) => [instance.id, instance]))
  return currentInstances.map((instance) => nextById.get(instance.id) ?? instance)
}
