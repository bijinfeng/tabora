import type { JSX } from "solid-js"
import type { PluginInstance, WidgetSize } from "@tabora/plugin-api"
import { Maximize2, X } from "lucide-solid"

export type WidgetHostCallbacks = {
  onDragStart: (e: DragEvent) => void
  onDragOver: (e: DragEvent) => void
  onDrop: (e: DragEvent) => void
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
      draggable="true"
      onDragStart={props.callbacks.onDragStart}
      onDragOver={props.callbacks.onDragOver}
      onDrop={props.callbacks.onDrop}
      onDblClick={props.callbacks.onDblClick}
      onContextMenu={props.callbacks.onContextMenu}
    >
      <div class="widget-card">
        <div class="card-header">
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
