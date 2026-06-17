import type { JSX } from "solid-js"
import { onCleanup, onMount } from "solid-js"
import { widgetGridColumnSpan, widgetGridRowSpan } from "@tabora/plugin-api"
import type { PluginInstance, WidgetSize } from "@tabora/plugin-api"
import { X } from "lucide-solid"

export type WidgetHostCallbacks = {
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
  copy?: {
    removeAriaLabel: (title: string) => string
  }
}

function gridColumnSpan(size: WidgetSize): number {
  return widgetGridColumnSpan(size)
}

function gridRowSpan(size: WidgetSize): number {
  return widgetGridRowSpan(size)
}

export function WidgetCardShell(props: WidgetCardShellProps) {
  let headerRef: HTMLDivElement | undefined
  let rootRef: HTMLDivElement | undefined

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
    }
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
      onClick={(event) => {
        if (event.detail === 2) props.callbacks.onExpand()
      }}
      onDblClick={props.callbacks.onDblClick}
      onContextMenu={(event) => {
        event.preventDefault()
        props.callbacks.onContextMenu(event)
      }}
    >
      <div class="widget-card">
        <div class="card-header" ref={(element) => (headerRef = element)}>
          <h3 class="card-title" data-allow-expand="true">
            {props.icon}
            <span class="card-title-text">{props.title}</span>
          </h3>
          <div class="card-actions">
            <button
              class="card-action-btn card-danger"
              aria-label={props.copy?.removeAriaLabel(props.title) ?? `移除 ${props.title}`}
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
