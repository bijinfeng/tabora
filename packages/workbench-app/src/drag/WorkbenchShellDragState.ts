import type { PluginInstance } from "@tabora/plugin-api"
import type { DragDropProviderProps } from "@dnd-kit/solid"
import { createDragSortPlan } from "@tabora/orchestrator"

export type WorkbenchDndDragState = {
  sourceId: string
  previewInstances: PluginInstance[]
  overId: string | null
}

type PersistedInstancesSource = {
  getPersistedInstances: () => PluginInstance[]
}

export function createWorkbenchDndKitDragHandlers(options: {
  getPersistedInstances: () => PluginInstance[]
  getDragState: () => WorkbenchDndDragState | null
  setDragState: (state: WorkbenchDndDragState | null) => void
  persistGridOrder: (instances: PluginInstance[]) => Promise<void>
  showToast: (message: string) => void
  documentRoot?: Document
}) {
  const documentRoot = options.documentRoot ?? document
  let stopDndPointerTracking: (() => void) | null = null

  function startDndDrag(sourceId: string | null): void {
    if (!sourceId) return

    stopDndPointerTracking?.()
    options.setDragState({
      sourceId,
      previewInstances: options.getPersistedInstances(),
      overId: null,
    })
    syncDndBodyState(true, documentRoot)

    const handlePointerMove = (event: PointerEvent) => {
      previewDndDrag(sourceId, resolveDndNativeEventTargetId(event, sourceId, documentRoot))
    }
    const handlePointerUp = (event: PointerEvent) => {
      finishDndDrag(sourceId, resolveDndNativeEventTargetId(event, sourceId, documentRoot), false)
    }
    const handlePointerCancel = () => {
      finishDndDrag(sourceId, null, true)
    }
    documentRoot.addEventListener("pointermove", handlePointerMove, true)
    documentRoot.addEventListener("pointerup", handlePointerUp, true)
    documentRoot.addEventListener("pointercancel", handlePointerCancel, true)
    stopDndPointerTracking = () => {
      documentRoot.removeEventListener("pointermove", handlePointerMove, true)
      documentRoot.removeEventListener("pointerup", handlePointerUp, true)
      documentRoot.removeEventListener("pointercancel", handlePointerCancel, true)
      stopDndPointerTracking = null
    }
  }

  function previewDndDrag(sourceId: string | null, targetId: string | null): void {
    const dragState = options.getDragState()
    if (!dragState || !sourceId || !targetId || sourceId === targetId) return

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
    stopDndPointerTracking?.()
    options.setDragState(null)
    syncDndBodyState(false, documentRoot)
    if (!dragState) return

    const resolvedTargetId = targetId ?? dragState.overId ?? null

    if (canceled || !sourceId || !resolvedTargetId || sourceId === resolvedTargetId) return

    const plan = createDragSortPlan({
      sourceId,
      targetId: resolvedTargetId,
      instances: options.getPersistedInstances(),
    })
    if (!plan.changed) return

    void options.persistGridOrder(plan.instances)
    options.showToast("排序已更新")
  }

  return {
    displayedInstances: (): PluginInstance[] =>
      options.getDragState()?.previewInstances ?? options.getPersistedInstances(),
    sortableIndex: (instanceId: string): number => persistedWidgetIndex(instanceId, options),
    isDragging: (instanceId: string): boolean => options.getDragState()?.sourceId === instanceId,
    onDndDragStart: (event: Parameters<NonNullable<DragDropProviderProps["onDragStart"]>>[0]) => {
      startDndDrag(resolveDndEntityId(event.operation.source?.id))
    },
    onDndDragMove: (event: Parameters<NonNullable<DragDropProviderProps["onDragMove"]>>[0]) => {
      const sourceId = resolveDndEntityId(event.operation.source?.id)
      previewDndDrag(
        sourceId,
        resolveDndEntityId(event.operation.target?.id) ??
          resolveDndNativeEventTargetId(event.nativeEvent, sourceId, documentRoot),
      )
    },
    onDndDragOver: (event: Parameters<NonNullable<DragDropProviderProps["onDragOver"]>>[0]) => {
      previewDndDrag(
        resolveDndEntityId(event.operation.source?.id),
        resolveDndEntityId(event.operation.target?.id),
      )
    },
    onDndDragEnd: (event: Parameters<NonNullable<DragDropProviderProps["onDragEnd"]>>[0]) => {
      finishDndDrag(
        resolveDndEntityId(event.operation.source?.id),
        resolveDndEntityId(event.operation.target?.id),
        event.canceled,
      )
    },
  }
}

function persistedWidgetIndex(instanceId: string, options: PersistedInstancesSource): number {
  const instances = options.getPersistedInstances()
  const source = instances.find((instance) => instance.id === instanceId)
  if (!source) return -1

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

function resolveDndEntityId(id: unknown): string | null {
  return typeof id === "string" || typeof id === "number" ? String(id) : null
}

function resolveDndNativeEventTargetId(
  event: Event | undefined,
  sourceId: string | null,
  documentRoot: Document,
): string | null {
  if (!(event instanceof MouseEvent)) return null

  const pointedElements = documentRoot.elementsFromPoint?.(event.clientX, event.clientY) ?? []
  const elements =
    pointedElements.length > 0
      ? pointedElements
      : [documentRoot.elementFromPoint(event.clientX, event.clientY)]

  for (const element of elements) {
    if (!(element instanceof HTMLElement)) continue
    const targetId = element.closest<HTMLElement>("[data-widget-instance-id]")?.dataset
      .widgetInstanceId
    if (targetId && targetId !== sourceId) return targetId
  }

  return null
}

function syncDndBodyState(dragging: boolean, documentRoot: Document): void {
  documentRoot.body.classList.toggle("drag-active", dragging)
}

function byGrid(left: PluginInstance, right: PluginInstance): number {
  return (left.grid?.y ?? 0) - (right.grid?.y ?? 0) || (left.grid?.x ?? 0) - (right.grid?.x ?? 0)
}
