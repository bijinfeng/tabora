import { For } from "solid-js"
import type { JSX } from "solid-js"
import type { PluginInstance, WidgetSize } from "@tabora/plugin-api"

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

export function WidgetCardShell(props: WidgetCardShellProps) {
  return (
    <div
      class="grid-item"
      classList={{ dragging: props.callbacks.isDragging }}
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
            <div class="widget-size-bar">
              <For each={props.supportedSizes}>
                {(size) => (
                  <button
                    class="widget-size-btn"
                    classList={{ active: props.currentSize === size }}
                    onClick={() => props.callbacks.onResize(size)}
                  >
                    {size}
                  </button>
                )}
              </For>
            </div>
            <button
              class="card-action-btn"
              aria-label={`展开 ${props.title}`}
              onClick={() => props.callbacks.onExpand()}
            >
              ⤢
            </button>
            <button class="card-action-btn card-danger" onClick={() => props.callbacks.onRemove()}>
              ×
            </button>
          </div>
        </div>
        <div class="card-body">{props.children}</div>
      </div>
    </div>
  )
}
