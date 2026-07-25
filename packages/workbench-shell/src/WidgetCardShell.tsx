import * as stylex from "@stylexjs/stylex"
import type { JSX } from "solid-js"
import { onCleanup, Show } from "solid-js"
import { widgetGridColumnSpan, widgetGridRowSpan } from "@tabora/plugin-api"
import type { PluginInstance, WidgetSize } from "@tabora/plugin-api"
import { ContextMenu, IconButton, type ContextMenuItem } from "@tabora/ui"
import { Minus } from "lucide-solid"
import { color, motion, radius, shadow, zIndex } from "@tabora/theme/tokens.stylex"
import { widgetCardStyleVars } from "./WidgetCardShell.stylex"

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

const styles = stylex.create({
  gridItem: {
    [widgetCardStyleVars.actionsOpacity]: 0,
    [widgetCardStyleVars.headerCursor]: "grab",
    gridColumn: "span var(--widget-col-span, 1)",
    gridRow: "span var(--widget-row-span, 1)",
    minHeight: 0,
    minWidth: 0,
    ":hover": {
      [widgetCardStyleVars.actionsOpacity]: 1,
    },
    ":focus-within": {
      [widgetCardStyleVars.actionsOpacity]: 1,
    },
    "@media (hover: none)": {
      [widgetCardStyleVars.actionsOpacity]: 1,
    },
    "@media (max-width: 768px)": {
      gridColumn: "span 1",
      gridRow: "auto",
    },
  },
  dragging: {
    [widgetCardStyleVars.actionsOpacity]: 1,
    [widgetCardStyleVars.headerCursor]: "grabbing",
  },
  card: {
    backgroundColor: color.surface,
    borderColor: color.line,
    borderRadius: radius.card,
    borderStyle: "solid",
    borderWidth: 1,
    display: "flex",
    flexDirection: "column",
    height: "100%",
    overflow: "visible",
    padding: 0,
    position: "relative",
    transitionDuration: motion.fast,
    transitionProperty: "border-color",
    transitionTimingFunction: motion.ease,
    ":hover": {
      borderColor: color.lineStrong,
    },
    "@media (max-width: 768px)": {
      height: "auto",
      minHeight: 0,
    },
  },
  cardDragging: {
    borderColor: color.accent,
    boxShadow: shadow.dragging,
    opacity: 0.92,
    zIndex: zIndex.sticky,
  },
  actions: {
    alignItems: "center",
    display: "flex",
    gap: 2,
    opacity: widgetCardStyleVars.actionsOpacity,
    pointerEvents: "none",
    position: "absolute",
    right: -3,
    top: -3,
    transitionDuration: motion.fast,
    transitionProperty: "opacity",
    transitionTimingFunction: motion.ease,
    zIndex: 1,
  },
  action: {
    alignItems: "center",
    backgroundColor: color.surface,
    borderStyle: "none",
    borderWidth: 0,
    borderRadius: radius.pill,
    boxShadow: shadow.sm,
    color: color.textSubtle,
    cursor: "pointer",
    display: "flex",
    height: 18,
    justifyContent: "center",
    pointerEvents: "auto",
    transitionDuration: motion.fast,
    transitionProperty: "background-color, box-shadow, color",
    transitionTimingFunction: motion.ease,
    width: 18,
    ":hover": {
      backgroundColor: color.surface,
      boxShadow: shadow.md,
      color: color.textMuted,
    },
    ":focus-visible": {
      outlineColor: color.focus,
      outlineOffset: 2,
      outlineStyle: "solid",
      outlineWidth: 2,
    },
  },
  body: {
    display: "grid",
    flex: 1,
    height: "100%",
    minHeight: 0,
    minWidth: 0,
    overflowX: "hidden",
    overflowY: "hidden",
    width: "100%",
  },
})

function gridItemXstyle(size: WidgetSize, dragging: boolean) {
  void size
  return [styles.gridItem, dragging && styles.dragging]
}

export function WidgetCardShell(props: WidgetCardShellProps) {
  const bindGridItem = (element: HTMLElement | undefined) => {
    props.callbacks.bindSortableRoot?.(element)
    props.callbacks.bindSortableHandle?.(element)
  }

  onCleanup(() => {
    props.callbacks.bindSortableHandle?.(undefined)
    props.callbacks.bindSortableRoot?.(undefined)
  })

  const cardInner = (
    <div
      {...stylex.attrs(styles.card, props.callbacks.isDragging && styles.cardDragging)}
      data-widget-card
    >
      <div {...stylex.attrs(styles.actions)} data-widget-card-actions>
        <IconButton
          size="sm"
          xstyle={styles.action}
          style={{
            width: "18px",
            height: "18px",
            "border-radius": "999px",
          }}
          data-widget-card-remove
          aria-label={props.copy?.removeAriaLabel(props.title) ?? `移除 ${props.title}`}
          onClick={(event) => {
            event.stopPropagation()
            props.callbacks.onRemove()
          }}
        >
          <Minus size={10} />
        </IconButton>
      </div>
      <div {...stylex.attrs(styles.body)} data-widget-card-body>
        {props.children}
      </div>
    </div>
  )

  const gridItemProps: Record<string, unknown> = {
    style: {
      "--widget-col-span": `${gridColumnSpan(props.currentSize)}`,
      "--widget-row-span": `${gridRowSpan(props.currentSize)}`,
    },
    "data-workbench-grid-item": "",
    "data-widget-size": props.currentSize,
    "data-widget-instance-id": props.instance.id,
    "data-dragging": props.callbacks.isDragging ? "" : undefined,
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
          {...stylex.attrs(...gridItemXstyle(props.currentSize, props.callbacks.isDragging))}
          ref={bindGridItem}
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
        triggerRef={bindGridItem}
        xstyle={gridItemXstyle(props.currentSize, props.callbacks.isDragging)}
        triggerProps={gridItemProps}
        aria-label={props.title}
      >
        {cardInner}
      </ContextMenu>
    </Show>
  )
}
