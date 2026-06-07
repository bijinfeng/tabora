import type { PluginInstance } from "@tabora/plugin-api"
import { createDragSortPlan } from "@tabora/orchestrator"

export type WorkbenchDragPoint = {
  x: number
  y: number
}

export type WorkbenchDragControllerState = {
  pointerId: number
  sourceId: string
  startPoint: WorkbenchDragPoint
  currentPoint: WorkbenchDragPoint
  initialInstances: PluginInstance[]
  previewInstances: PluginInstance[]
  phase: "pending" | "dragging"
  overId: string | null
}

const DEFAULT_DRAG_THRESHOLD = 5

export function beginWorkbenchDragController(options: {
  pointerId: number
  sourceId: string
  point: WorkbenchDragPoint
  instances: PluginInstance[]
}): WorkbenchDragControllerState {
  return {
    pointerId: options.pointerId,
    sourceId: options.sourceId,
    startPoint: options.point,
    currentPoint: options.point,
    initialInstances: options.instances,
    previewInstances: options.instances,
    phase: "pending",
    overId: null,
  }
}

export function updateWorkbenchDragController(options: {
  state: WorkbenchDragControllerState
  point: WorkbenchDragPoint
  overId: string | null
  threshold?: number
}): WorkbenchDragControllerState {
  const nextPhase =
    options.state.phase === "dragging" ||
    hasDragThresholdCrossed(options.state.startPoint, options.point, options.threshold)
      ? "dragging"
      : "pending"

  if (nextPhase === "pending") {
    return {
      ...options.state,
      currentPoint: options.point,
    }
  }

  if (
    !options.overId ||
    options.overId === options.state.sourceId ||
    options.overId === options.state.overId
  ) {
    return {
      ...options.state,
      currentPoint: options.point,
      phase: "dragging",
      ...(options.overId === options.state.sourceId ? { overId: null } : {}),
    }
  }

  const plan = createDragSortPlan({
    sourceId: options.state.sourceId,
    targetId: options.overId,
    instances: options.state.previewInstances,
  })

  return {
    ...options.state,
    currentPoint: options.point,
    phase: "dragging",
    previewInstances: plan.changed ? plan.instances : options.state.previewInstances,
    overId: options.overId,
  }
}

export function completeWorkbenchDragController(state: WorkbenchDragControllerState): {
  changed: boolean
  instances: PluginInstance[] | null
} {
  const changed = hasInstanceOrderChanged(state.initialInstances, state.previewInstances)
  return {
    changed,
    instances: changed ? state.previewInstances : null,
  }
}

function hasDragThresholdCrossed(
  start: WorkbenchDragPoint,
  current: WorkbenchDragPoint,
  threshold = DEFAULT_DRAG_THRESHOLD,
): boolean {
  return Math.hypot(current.x - start.x, current.y - start.y) >= threshold
}

function hasInstanceOrderChanged(left: PluginInstance[], right: PluginInstance[]): boolean {
  if (left.length !== right.length) {
    return true
  }

  return left.some((instance, index) => instance.id !== right[index]?.id)
}
