import type { JSX } from "solid-js"
import { onCleanup, onMount } from "solid-js"
import { widgetGridColumnSpan, widgetGridRowSpan } from "@tabora/plugin-api"
import type { PluginInstance, WidgetSize } from "@tabora/plugin-api"
import { X } from "lucide-solid"

export type WidgetHostCallbacks = {
  onPointerDown: (e: PointerEvent) => void
  onPointerMove: (e: PointerEvent) => void
  onPointerUp: (e: PointerEvent) => void
  onPointerCancel: (e: PointerEvent) => void
  onDblClick: (e: MouseEvent) => void
  onContextMenu: (e: MouseEvent) => void
  onResize: (size: WidgetSize) => void
  onRemove: () => void
  onExpand: () => void
  isDragging: boolean
  bindSortableRoot?: (element: HTMLElement | undefined) => void
  bindSortableHandle?: (element: HTMLElement | undefined) => void
}

export type WidgetCardShellProps = {
  instance: PluginInstance
  title: string
  icon?: JSX.Element
  supportedSizes: WidgetSize[]
  currentSize: WidgetSize
  children: JSX.Element
  callbacks: WidgetHostCallbacks
}

function gridColumnSpan(size: WidgetSize): number {
  return widgetGridColumnSpan(size)
}

function gridRowSpan(size: WidgetSize): number {
  return widgetGridRowSpan(size)
}

export function WidgetCardShell(props: WidgetCardShellProps) {
  let lastPointerUpAt = 0
  let lastPointerDownAt = 0
  let headerRef: HTMLDivElement | undefined
  let rootRef: HTMLDivElement | undefined
  let pendingDrag: {
    event: PointerEvent
    x: number
    y: number
  } | null = null

  function releasePointerCapture(event: PointerEvent) {
    if (event.target instanceof HTMLElement && event.target.hasPointerCapture?.(event.pointerId)) {
      event.target.releasePointerCapture(event.pointerId)
    }
  }

  function handlePointerUp(event: PointerEvent) {
    releasePointerCapture(event)
    pendingDrag = null
    const now = performance.now()
    if (event.detail === 2 || (lastPointerUpAt > 0 && now - lastPointerUpAt < 320)) {
      props.callbacks.onExpand()
      lastPointerUpAt = 0
    } else {
      lastPointerUpAt = now
    }
    props.callbacks.onPointerUp(event)
  }

  function handlePointerCancel(event: PointerEvent) {
    releasePointerCapture(event)
    pendingDrag = null
    props.callbacks.onPointerCancel(event)
  }

  function handlePointerDown(event: PointerEvent) {
    const target = event.target
    if (
      target instanceof HTMLElement &&
      target.closest("button, input, textarea, select, a, [role='button']")
    ) {
      return
    }

    const now = performance.now()
    if (lastPointerDownAt > 0 && now - lastPointerDownAt < 320) {
      props.callbacks.onExpand()
      lastPointerDownAt = 0
      return
    }
    lastPointerDownAt = now
    pendingDrag = {
      event,
      x: event.clientX,
      y: event.clientY,
    }
  }

  function handlePointerMove(event: PointerEvent) {
    const drag = pendingDrag
    if (drag) {
      const distance = Math.hypot(event.clientX - drag.x, event.clientY - drag.y)
      if (distance >= 4) {
        pendingDrag = null
        if (event.currentTarget instanceof HTMLElement) {
          event.currentTarget.setPointerCapture?.(event.pointerId)
        }
        props.callbacks.onPointerDown(drag.event)
      }
    }
    props.callbacks.onPointerMove(event)
  }

  onMount(() => {
    props.callbacks.bindSortableRoot?.(rootRef)
    props.callbacks.bindSortableHandle?.(
      headerRef?.querySelector<HTMLElement>(".card-title") ?? undefined,
    )
    if (props.callbacks.bindSortableRoot || props.callbacks.bindSortableHandle) {
      onCleanup(() => {
        props.callbacks.bindSortableHandle?.(undefined)
        props.callbacks.bindSortableRoot?.(undefined)
      })
      return
    }

    const header = headerRef
    if (!header) return
    const handleNativePointerDown = (event: PointerEvent) => {
      handlePointerDown(event)
      event.stopPropagation()
    }
    const handleNativePointerUp = (event: PointerEvent) => {
      handlePointerUp(event)
      event.stopPropagation()
    }
    const handleNativePointerMove = (event: PointerEvent) => {
      handlePointerMove(event)
      event.stopPropagation()
    }
    const handleNativePointerCancel = (event: PointerEvent) => {
      handlePointerCancel(event)
      event.stopPropagation()
    }

    header.addEventListener("pointerdown", handleNativePointerDown)
    header.addEventListener("pointermove", handleNativePointerMove)
    header.addEventListener("pointerup", handleNativePointerUp)
    header.addEventListener("pointercancel", handleNativePointerCancel)
    onCleanup(() => {
      header.removeEventListener("pointerdown", handleNativePointerDown)
      header.removeEventListener("pointermove", handleNativePointerMove)
      header.removeEventListener("pointerup", handleNativePointerUp)
      header.removeEventListener("pointercancel", handleNativePointerCancel)
    })
  })

  return (
    <div
      class="grid-item"
      classList={{ dragging: props.callbacks.isDragging }}
      style={{
        "--widget-col-span": `${gridColumnSpan(props.currentSize)}`,
        "--widget-row-span": `${gridRowSpan(props.currentSize)}`,
      }}
      data-widget-size={props.currentSize}
      data-widget-instance-id={props.instance.id}
      aria-label={props.title}
      tabIndex={0}
      ref={(element) => {
        rootRef = element
      }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onClick={(event) => {
        if (event.detail === 2) props.callbacks.onExpand()
      }}
      onDblClick={props.callbacks.onDblClick}
      onContextMenu={props.callbacks.onContextMenu}
    >
      <div class="widget-card">
        <div class="card-header" ref={(element) => (headerRef = element)}>
          <div class="card-title">
            {props.icon}
            <span class="card-title-text">{props.title}</span>
          </div>
          <div class="card-actions">
            <button
              class="card-action-btn card-danger"
              aria-label={`移除 ${props.title}`}
              onClick={() => props.callbacks.onRemove()}
            >
              <X size={15} />
            </button>
          </div>
        </div>
        <div class="card-body">{props.children}</div>
      </div>
    </div>
  )
}
