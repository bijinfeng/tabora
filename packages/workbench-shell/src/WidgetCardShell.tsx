import type { JSX } from "solid-js"
import { onCleanup, onMount, Show } from "solid-js"
import { widgetGridColumnSpan, widgetGridRowSpan } from "@tabora/plugin-api"
import type { PluginInstance, WidgetSize } from "@tabora/plugin-api"
import { ContextMenu, type ContextMenuItem } from "@tabora/ui"
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
  /** 右键菜单项；提供时卡片用 @tabora/ui ContextMenu 渲染原生右键菜单 */
  contextMenuItems?: ContextMenuItem[]
  onContextMenuSelect?: (key: string) => void
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

  const bindRoot = (element: HTMLElement | undefined) => {
    props.callbacks.bindSortableRoot?.(element)
  }

  onMount(() => {
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

  const cardInner = (
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
  )

  const gridItemClassList = () => ({
    "grid-item": true,
    dragging: props.callbacks.isDragging,
  })

  const gridItemProps: Record<string, unknown> = {
    style: {
      "--widget-col-span": `${gridColumnSpan(props.currentSize)}`,
      "--widget-row-span": `${gridRowSpan(props.currentSize)}`,
    },
    "data-widget-size": props.currentSize,
    "data-widget-instance-id": props.instance.id,
    "aria-label": props.title,
    tabIndex: 0,
    onClick: (event: MouseEvent) => {
      if (event.detail === 2) props.callbacks.onExpand()
    },
    onDblClick: props.callbacks.onDblClick,
  }

  return (
    <Show
      when={props.contextMenuItems && props.contextMenuItems.length > 0}
      fallback={
        <div
          {...gridItemProps}
          classList={gridItemClassList()}
          ref={bindRoot}
          onContextMenu={(event) => {
            event.preventDefault()
            props.callbacks.onContextMenu(event)
          }}
        >
          {cardInner}
        </div>
      }
    >
      <ContextMenu
        items={props.contextMenuItems!}
        onSelect={(key) => props.onContextMenuSelect?.(key)}
        triggerRef={bindRoot}
        triggerClassList={gridItemClassList()}
        triggerProps={gridItemProps}
        aria-label={props.title}
      >
        {cardInner}
      </ContextMenu>
    </Show>
  )
}
