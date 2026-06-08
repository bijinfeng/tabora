import { sortBy } from "es-toolkit/array"
import type { GridPlacement, PluginInstance, WidgetSize } from "@tabora/plugin-api"

export type DragSortPlanOptions = {
  sourceId: string
  targetId: string
  instances: PluginInstance[]
}

export type DragSortPlan = {
  changed: boolean
  instances: PluginInstance[]
}

const SIZE_COLUMN_SPAN: Record<WidgetSize, number> = { S: 1, M: 2, L: 2, XL: 2 }
const SIZE_ROW_SPAN: Record<WidgetSize, number> = { S: 1, M: 1, L: 2, XL: 2 }

function gridShape(instance: PluginInstance): Omit<GridPlacement, "x" | "y"> {
  if (!instance.size) {
    throw new Error(`Widget instance "${instance.id}" must declare size before sorting`)
  }
  return {
    colSpan: instance.grid?.colSpan ?? SIZE_COLUMN_SPAN[instance.size],
    rowSpan: instance.grid?.rowSpan ?? SIZE_ROW_SPAN[instance.size],
    ...(instance.grid?.locked === undefined ? {} : { locked: instance.grid.locked }),
  }
}

function withGridOrder(instance: PluginInstance, x: number): PluginInstance {
  if (instance.extensionPoint !== "widget") {
    return instance
  }

  return {
    ...instance,
    grid: {
      x,
      y: 0,
      ...gridShape(instance),
    },
  }
}

function visualSort(instances: PluginInstance[]): PluginInstance[] {
  return sortBy(instances, [
    (i) => i.grid?.y ?? 0,
    (i) => i.grid?.x ?? 0,
    (i) => i.createdAt,
    (i) => i.id,
  ])
}

export function createDragSortPlan(options: DragSortPlanOptions): DragSortPlan {
  const source = options.instances.find((instance) => instance.id === options.sourceId)
  const target = options.instances.find((instance) => instance.id === options.targetId)

  if (
    !source ||
    !target ||
    !source.enabled ||
    !target.enabled ||
    source.extensionPoint !== "widget" ||
    target.extensionPoint !== "widget" ||
    !source.size ||
    !target.size
  ) {
    return { changed: false, instances: options.instances }
  }

  if (source.regionId !== target.regionId || source.id === target.id) {
    return { changed: false, instances: options.instances }
  }

  const sortableRegionInstances = visualSort(
    options.instances.filter(
      (instance) =>
        instance.enabled &&
        instance.regionId === source.regionId &&
        instance.extensionPoint === "widget" &&
        Boolean(instance.size),
    ),
  )
  const fromIndex = sortableRegionInstances.findIndex((instance) => instance.id === source.id)
  const toIndex = sortableRegionInstances.findIndex((instance) => instance.id === target.id)

  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
    return { changed: false, instances: options.instances }
  }

  const reordered = [...sortableRegionInstances]
  ;[reordered[fromIndex], reordered[toIndex]] = [reordered[toIndex]!, reordered[fromIndex]!]

  const reorderedById = new Map(
    reordered.map((instance, index) => [instance.id, withGridOrder(instance, index)]),
  )
  const affectedSlots = visualSort(
    options.instances.filter(
      (instance) => instance.regionId === source.regionId && instance.extensionPoint === "widget",
    ),
  )
  const reorderedQueue = [...reordered]
  const nextAffectedById = new Map<string, PluginInstance>()

  for (const slot of affectedSlots) {
    if (!slot.enabled) {
      nextAffectedById.set(slot.id, slot)
      continue
    }

    const next = reorderedQueue.shift()
    if (next) {
      nextAffectedById.set(slot.id, reorderedById.get(next.id) ?? next)
    }
  }

  const output = options.instances.map((instance) => nextAffectedById.get(instance.id) ?? instance)

  return { changed: true, instances: output }
}
