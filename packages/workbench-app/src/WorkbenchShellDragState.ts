import type { PluginInstance } from "@tabora/plugin-api"

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

  return {
    displayedInstances: (): PluginInstance[] => {
      return options.getDragState()?.previewInstances ?? options.getPersistedInstances()
    },
    isDragging: (instanceId: string): boolean => {
      const dragState = options.getDragState()
      return dragState?.phase === "dragging" && dragState.sourceId === instanceId
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
