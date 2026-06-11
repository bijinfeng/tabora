import type { PluginInstance } from "@tabora/plugin-api"
import type { DragDropProviderProps } from "@dnd-kit/solid"
import { createDragSortPlan } from "@tabora/orchestrator"

import {
  beginWorkbenchDragController,
  completeWorkbenchDragController,
  type WorkbenchDragControllerState,
  type WorkbenchDragPoint,
  updateWorkbenchDragController,
} from "./WorkbenchDragController"

export function resolveWorkbenchDragTargetId(
  point: WorkbenchDragPoint,
  documentRoot: Document = document,
): string | null {
  const target = documentRoot.elementFromPoint(point.x, point.y)
  if (!(target instanceof HTMLElement)) {
    return null
  }

  return target.closest<HTMLElement>("[data-widget-instance-id]")?.dataset.widgetInstanceId ?? null
}

export function syncWorkbenchDragBodyState(
  dragging: boolean,
  documentRoot: Document = document,
): void {
  documentRoot.body.classList.toggle("drag-active", dragging)
}

export function createWorkbenchPointerDragHandlers(options: {
  getPersistedInstances: () => PluginInstance[]
  getDragState: () => WorkbenchDragControllerState | null
  setDragState: (state: WorkbenchDragControllerState | null) => void
  persistGridOrder: (instances: PluginInstance[]) => Promise<void>
  showToast: (message: string) => void
  documentRoot?: Document
}) {
  const documentRoot = options.documentRoot ?? document
  let stopDndPointerTracking: (() => void) | null = null

  function persistedWidgetIndex(instanceId: string): number {
    const instances = options.getPersistedInstances()
    const source = instances.find((instance) => instance.id === instanceId)
    if (!source) {
      return -1
    }

    return instances
      .filter(
        (instance) =>
          instance.extensionPoint === "widget" &&
          instance.enabled !== false &&
          instance.regionId === source.regionId,
      )
      .sort(byGrid)
      .findIndex((instance) => instance.id === instanceId)
  }

  function startDndDrag(sourceId: string | null): void {
    if (!sourceId) {
      return
    }

    stopDndPointerTracking?.()
    options.setDragState({
      ...beginWorkbenchDragController({
        pointerId: -1,
        sourceId,
        point: { x: 0, y: 0 },
        instances: options.getPersistedInstances(),
      }),
      phase: "dragging",
    })
    syncWorkbenchDragBodyState(true, documentRoot)

    const handlePointerMove = (event: PointerEvent) => {
      previewDndDrag(sourceId, resolveDndNativeEventTargetId(event, sourceId, documentRoot))
    }
    documentRoot.addEventListener("pointermove", handlePointerMove, true)
    stopDndPointerTracking = () => {
      documentRoot.removeEventListener("pointermove", handlePointerMove, true)
      stopDndPointerTracking = null
    }
  }

  function previewDndDrag(sourceId: string | null, targetId: string | null): void {
    const dragState = options.getDragState()
    if (!dragState || !sourceId || !targetId || sourceId === targetId) {
      return
    }

    const plan = createDragSortPlan({
      sourceId,
      targetId,
      instances: dragState.previewInstances,
    })

    options.setDragState({
      ...dragState,
      previewInstances: plan.changed ? plan.instances : dragState.previewInstances,
      overId: targetId,
    })
  }

  function finishDndDrag(
    sourceId: string | null,
    targetId: string | null,
    canceled: boolean,
  ): void {
    const dragState = options.getDragState()
    const resolvedTargetId = targetId ?? dragState?.overId ?? null
    stopDndPointerTracking?.()
    options.setDragState(null)
    syncWorkbenchDragBodyState(false, documentRoot)

    if (canceled || !sourceId || !resolvedTargetId || sourceId === resolvedTargetId) {
      return
    }

    const plan = createDragSortPlan({
      sourceId,
      targetId: resolvedTargetId,
      instances: options.getPersistedInstances(),
    })

    if (!plan.changed) {
      return
    }

    void options.persistGridOrder(plan.instances)
    options.showToast("排序已更新")
  }

  return {
    displayedInstances: (): PluginInstance[] => {
      return options.getDragState()?.previewInstances ?? options.getPersistedInstances()
    },
    sortableIndex: (instanceId: string): number => {
      return persistedWidgetIndex(instanceId)
    },
    isDragging: (instanceId: string): boolean => {
      const dragState = options.getDragState()
      return dragState?.phase === "dragging" && dragState.sourceId === instanceId
    },
    onDndDragStart: (event: Parameters<NonNullable<DragDropProviderProps["onDragStart"]>>[0]) => {
      startDndDrag(resolveDndEntityId(event.operation.source?.id))
    },
    onDndDragOver: (event: Parameters<NonNullable<DragDropProviderProps["onDragOver"]>>[0]) => {
      previewDndDrag(
        resolveDndEntityId(event.operation.source?.id),
        resolveDndEntityId(event.operation.target?.id),
      )
    },
    onDndDragMove: (event: Parameters<NonNullable<DragDropProviderProps["onDragMove"]>>[0]) => {
      const sourceId = resolveDndEntityId(event.operation.source?.id)
      previewDndDrag(
        sourceId,
        resolveDndEntityId(event.operation.target?.id) ??
          resolveDndNativeEventTargetId(event.nativeEvent, sourceId, documentRoot),
      )
    },
    onDndDragEnd: (event: Parameters<NonNullable<DragDropProviderProps["onDragEnd"]>>[0]) => {
      finishDndDrag(
        resolveDndEntityId(event.operation.source?.id),
        resolveDndEntityId(event.operation.target?.id),
        event.canceled,
      )
    },
    onPointerDown: (event: PointerEvent, instanceId: string): void => {
      if (event.button !== 0) {
        return
      }

      options.setDragState(
        beginWorkbenchDragController({
          pointerId: event.pointerId,
          sourceId: instanceId,
          point: { x: event.clientX, y: event.clientY },
          instances: options.getPersistedInstances(),
        }),
      )
    },
    onPointerMove: (event: PointerEvent): void => {
      const dragState = options.getDragState()
      if (!dragState || dragState.pointerId !== event.pointerId) {
        return
      }

      const nextState = updateWorkbenchDragController({
        state: dragState,
        point: { x: event.clientX, y: event.clientY },
        overId: resolveWorkbenchDragTargetId({ x: event.clientX, y: event.clientY }, documentRoot),
      })

      options.setDragState(nextState)
      syncWorkbenchDragBodyState(nextState.phase === "dragging", documentRoot)
    },
    onPointerUp: (event: PointerEvent): void => {
      const dragState = options.getDragState()
      if (!dragState || dragState.pointerId !== event.pointerId) {
        return
      }

      const completed = completeWorkbenchDragController(dragState)
      options.setDragState(null)
      syncWorkbenchDragBodyState(false, documentRoot)

      if (!completed.instances) {
        return
      }

      void options.persistGridOrder(completed.instances)
      options.showToast("排序已更新")
    },
    onPointerCancel: (event: PointerEvent): void => {
      const dragState = options.getDragState()
      if (!dragState || dragState.pointerId !== event.pointerId) {
        return
      }

      options.setDragState(null)
      syncWorkbenchDragBodyState(false, documentRoot)
    },
  }
}

function resolveDndEntityId(id: unknown): string | null {
  return typeof id === "string" || typeof id === "number" ? String(id) : null
}

function resolveDndNativeEventTargetId(
  event: Event | undefined,
  sourceId: string | null,
  documentRoot: Document,
): string | null {
  if (!(event instanceof MouseEvent)) {
    return null
  }

  const pointedElements = documentRoot.elementsFromPoint?.(event.clientX, event.clientY) ?? []
  const elements =
    pointedElements.length > 0
      ? pointedElements
      : [documentRoot.elementFromPoint(event.clientX, event.clientY)]

  for (const element of elements) {
    if (!(element instanceof HTMLElement)) continue
    const targetId = element.closest<HTMLElement>("[data-widget-instance-id]")?.dataset
      .widgetInstanceId
    if (targetId && targetId !== sourceId) {
      return targetId
    }
  }

  return resolveWorkbenchDragTargetId({ x: event.clientX, y: event.clientY }, documentRoot)
}

function byGrid(left: PluginInstance, right: PluginInstance): number {
  return (left.grid?.y ?? 0) - (right.grid?.y ?? 0) || (left.grid?.x ?? 0) - (right.grid?.x ?? 0)
}
