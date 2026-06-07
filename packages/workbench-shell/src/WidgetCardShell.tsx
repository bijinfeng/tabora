import type { JSX } from "solid-js"
import type { PluginInstance, WidgetSize } from "@tabora/plugin-api"
import { Maximize2, X } from "lucide-solid"

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

const SIZE_SPAN: Record<WidgetSize, number> = { S: 1, M: 2, L: 2, XL: 2 }
const SIZE_ROW_SPAN: Record<WidgetSize, number> = { S: 1, M: 1, L: 2, XL: 2 }

function gridColumnSpan(size: WidgetSize): number {
  return SIZE_SPAN[size] ?? 2
}

function gridRowSpan(size: WidgetSize): number {
  return SIZE_ROW_SPAN[size] ?? 1
}

export function WidgetCardShell(props: WidgetCardShellProps) {
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
      onPointerMove={props.callbacks.onPointerMove}
      onPointerUp={(event) => {
        if (
          event.target instanceof HTMLElement &&
          event.target.hasPointerCapture?.(event.pointerId)
        ) {
          event.target.releasePointerCapture(event.pointerId)
        }
        props.callbacks.onPointerUp(event)
      }}
      onPointerCancel={(event) => {
        if (
          event.target instanceof HTMLElement &&
          event.target.hasPointerCapture?.(event.pointerId)
        ) {
          event.target.releasePointerCapture(event.pointerId)
        }
        props.callbacks.onPointerCancel(event)
      }}
      onDblClick={props.callbacks.onDblClick}
      onContextMenu={props.callbacks.onContextMenu}
    >
      <div class="widget-card">
        <div
          class="card-header"
          onPointerDown={(event) => {
            const target = event.target
            if (
              target instanceof HTMLElement &&
              target.closest("button, input, textarea, select, a, [role='button']")
            ) {
              return
            }

            event.currentTarget.setPointerCapture?.(event.pointerId)
            props.callbacks.onPointerDown(event)
          }}
        >
          <div class="card-title">
            {props.icon}
            <span class="card-title-text">{props.title}</span>
          </div>
          <div class="card-actions">
            <button
              class="card-action-btn"
              aria-label={`展开 ${props.title}`}
              onClick={() => props.callbacks.onExpand()}
            >
              <Maximize2 size={14} />
            </button>
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
