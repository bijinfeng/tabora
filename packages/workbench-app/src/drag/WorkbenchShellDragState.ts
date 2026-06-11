import type { PluginInstance } from "@tabora/plugin-api"
import type { DragDropProviderProps } from "@dnd-kit/solid"
import { createDragSortPlan } from "@tabora/orchestrator"

export type WorkbenchDndDragState = {
  sourceId: string
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
  let lastTargetId: string | null = null

  function startDndDrag(sourceId: string | null): void {
    if (!sourceId) return

    stopDndPointerTracking?.()
    lastTargetId = null
    options.setDragState({
      sourceId,
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
    lastTargetId = targetId
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
    if (!dragState) {
      lastTargetId = null
      return
    }

    const resolvedTargetId = targetId ?? lastTargetId
    lastTargetId = null

    if (canceled || !sourceId) return
    if (!resolvedTargetId || sourceId === resolvedTargetId) {
      persistRenderedDomOrderFallback(sourceId)
      return
    }

    persistDragSortPlan(sourceId, resolvedTargetId)
  }

  function persistDragSortPlan(sourceId: string, targetId: string): void {
    const plan = createDragSortPlan({
      sourceId,
      targetId,
      instances: options.getPersistedInstances(),
    })
    if (!plan.changed) return

    void options.persistGridOrder(plan.instances)
    options.showToast("排序已更新")
  }

  function persistRenderedDomOrderFallback(sourceId: string): void {
    const timeout = documentRoot.defaultView?.setTimeout ?? setTimeout
    timeout(() => {
      const instances = options.getPersistedInstances()
      const source = instances.find((instance) => instance.id === sourceId)
      if (!source) return

      const visualOrder = instances
        .filter(
          (instance) =>
            instance.regionId === source.regionId &&
            instance.extensionPoint === "widget" &&
            instance.enabled !== false,
        )
        .sort(byGrid)
      const fromIndex = visualOrder.findIndex((instance) => instance.id === sourceId)
      if (fromIndex < 0) return

      const renderedOrder = Array.from(
        documentRoot.querySelectorAll<HTMLElement>(".grid-item[data-widget-instance-id]"),
      )
        .map((element) => element.dataset.widgetInstanceId)
        .filter((id): id is string =>
          Boolean(id && visualOrder.some((instance) => instance.id === id)),
        )

      const targetId = renderedOrder[fromIndex]
      if (!targetId || targetId === sourceId) return
      persistDragSortPlan(sourceId, targetId)
    }, 0)
  }

  return {
    displayedInstances: (): PluginInstance[] =>
      orderDisplayedInstances(options.getPersistedInstances()),
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

function orderDisplayedInstances(instances: PluginInstance[]): PluginInstance[] {
  const sortedWidgetIds = new Map<string, number>()
  instances
    .filter((instance) => instance.extensionPoint === "widget" && instance.enabled !== false)
    .sort(byGrid)
    .forEach((instance, index) => sortedWidgetIds.set(instance.id, index))

  return [...instances].sort((left, right) => {
    const leftIndex = sortedWidgetIds.get(left.id)
    const rightIndex = sortedWidgetIds.get(right.id)
    if (leftIndex === undefined || rightIndex === undefined) return 0
    return leftIndex - rightIndex
  })
}
