import type {
  LayoutRegion,
  PluginInstance,
  WidgetContribution,
  WidgetSize,
} from "@tabora/plugin-api"

import { gridColumnSpan, gridRowSpan } from "../shared/workbenchGrid"

export async function addWorkbenchWidget(options: {
  workspaceId: string
  pluginId: string
  contributionId: string
  currentInstances: PluginInstance[]
  layoutRegions: LayoutRegion[]
  resolveWidget: (
    pluginId: string,
    contributionId: string,
  ) => Pick<WidgetContribution, "defaultSize" | "supportedSizes"> | undefined
  assignGridOrder: (instances: PluginInstance[]) => PluginInstance[]
  saveInstance: (instance: PluginInstance) => Promise<void>
  setInstances: (instances: PluginInstance[]) => void
  buildInstanceId?: () => string
  now?: () => string
  size?: WidgetSize
}): Promise<PluginInstance | null> {
  const widget = options.resolveWidget(options.pluginId, options.contributionId)
  if (!widget) return null

  const timestamp = options.now?.() ?? new Date().toISOString()
  const instanceId = options.buildInstanceId?.() ?? `${options.contributionId}-${Date.now()}`
  const regionId = options.layoutRegions.find((region) => region.accepts.includes("widget"))?.id
  if (!regionId) return null

  const requestedSize = options.size
  const initialSize =
    requestedSize && widget.supportedSizes?.includes(requestedSize)
      ? requestedSize
      : widget.defaultSize

  const nextInstance: PluginInstance = {
    id: instanceId,
    workspaceId: options.workspaceId,
    pluginId: options.pluginId,
    contributionId: options.contributionId,
    extensionPoint: "widget",
    regionId,
    enabled: true,
    size: initialSize,
    config: {},
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  const nextInstances = options.assignGridOrder([...options.currentInstances, nextInstance])
  const savedInstance = nextInstances.find((instance) => instance.id === instanceId) ?? nextInstance

  await options.saveInstance(savedInstance)
  options.setInstances(nextInstances)
  return savedInstance
}

export async function removeWorkbenchWidget(options: {
  instanceId: string
  currentInstances: PluginInstance[]
  currentExpandInstanceId: string | null
  currentContextMenuInstanceId: string | null
  clearExpand: () => void
  clearContextMenu: () => void
  removeInstance: (instanceId: string) => Promise<void>
  setInstances: (instances: PluginInstance[]) => void
}) {
  if (options.currentExpandInstanceId === options.instanceId) {
    options.clearExpand()
  }
  if (options.currentContextMenuInstanceId === options.instanceId) {
    options.clearContextMenu()
  }

  await options.removeInstance(options.instanceId)
  options.setInstances(
    options.currentInstances.filter((instance) => instance.id !== options.instanceId),
  )
}

export async function resizeWorkbenchWidget(options: {
  instanceId: string
  newSize: WidgetSize
  currentInstances: PluginInstance[]
  saveInstance: (instance: PluginInstance) => Promise<void>
  setInstances: (instances: PluginInstance[]) => void
  now?: () => string
}) {
  const instance = options.currentInstances.find((current) => current.id === options.instanceId)
  if (!instance) return

  const updated: PluginInstance = {
    ...instance,
    size: options.newSize,
    grid: {
      ...(instance.grid ?? { x: 0, y: 0, rowSpan: 1 }),
      colSpan: gridColumnSpan(options.newSize),
      rowSpan: gridRowSpan(options.newSize),
    },
    updatedAt: options.now?.() ?? new Date().toISOString(),
  }

  await options.saveInstance(updated)
  options.setInstances(
    options.currentInstances.map((current) =>
      current.id === options.instanceId ? updated : current,
    ),
  )
}
