import * as stylex from "@stylexjs/stylex"
import type { JSX } from "solid-js"
import { onCleanup, onMount, Show } from "solid-js"
import { widgetGridColumnSpan, widgetGridRowSpan } from "@tabora/plugin-api"
import type { PluginInstance, WidgetSize } from "@tabora/plugin-api"
import { ContextMenu, type ContextMenuItem } from "@tabora/ui"
import { X } from "lucide-solid"
import {
  color,
  font,
  motion,
  radius,
  shadow,
  widgetCardStyleVars,
  zIndex,
} from "./stylexTokens.stylex"

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
    aspectRatio: "16 / 10",
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
      aspectRatio: "auto",
      gridColumn: "span 1",
      gridRow: "auto",
    },
  },
  sizeS: {
    aspectRatio: "3 / 2",
  },
  sizeM: {
    aspectRatio: "16 / 10",
  },
  sizeL: {
    aspectRatio: "16 / 9",
  },
  sizeXL: {
    aspectRatio: "21 / 9",
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
    paddingBlock: 10,
    paddingInline: 11,
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
  header: {
    alignItems: "center",
    cursor: widgetCardStyleVars.headerCursor,
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 8,
    minHeight: 22,
    touchAction: "none",
  },
  title: {
    alignItems: "center",
    display: "flex",
    fontSize: 12,
    fontWeight: font.bold,
    gap: 5,
    letterSpacing: 0,
    margin: 0,
  },
  titleIcon: {
    color: color.textSubtle,
    display: "inline-flex",
    flexShrink: 0,
    height: 13,
    width: 13,
  },
  actions: {
    display: "flex",
    gap: 2,
    opacity: widgetCardStyleVars.actionsOpacity,
    transitionDuration: motion.fast,
    transitionProperty: "opacity",
    transitionTimingFunction: motion.ease,
  },
  action: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderStyle: "none",
    borderWidth: 0,
    borderRadius: radius.r2,
    color: color.textMuted,
    cursor: "pointer",
    display: "flex",
    height: 22,
    justifyContent: "center",
    transitionDuration: motion.fast,
    transitionProperty: "background-color, color",
    transitionTimingFunction: motion.ease,
    width: 22,
    ":hover": {
      backgroundColor: color.dangerSoft,
      color: color.danger,
    },
    ":focus-visible": {
      outlineColor: color.focus,
      outlineOffset: 2,
      outlineStyle: "solid",
      outlineWidth: 2,
    },
  },
  body: {
    flex: 1,
    minHeight: 0,
    overflowX: "hidden",
    overflowY: "auto",
    overscrollBehavior: "contain",
  },
})

function gridItemXstyle(size: WidgetSize, dragging: boolean) {
  return [
    styles.gridItem,
    size === "S" && styles.sizeS,
    size === "M" && styles.sizeM,
    size === "L" && styles.sizeL,
    size === "XL" && styles.sizeXL,
    dragging && styles.dragging,
  ]
}

export function WidgetCardShell(props: WidgetCardShellProps) {
  let titleRef: HTMLHeadingElement | undefined

  const bindRoot = (element: HTMLElement | undefined) => {
    props.callbacks.bindSortableRoot?.(element)
  }

  onMount(() => {
    props.callbacks.bindSortableHandle?.(titleRef)
    if (props.callbacks.bindSortableRoot || props.callbacks.bindSortableHandle) {
      onCleanup(() => {
        props.callbacks.bindSortableHandle?.(undefined)
        props.callbacks.bindSortableRoot?.(undefined)
      })
    }
  })

  const cardInner = (
    <div
      {...stylex.props(styles.card, props.callbacks.isDragging && styles.cardDragging)}
      data-widget-card
    >
      <div {...stylex.props(styles.header)} data-widget-card-header>
        <h3
          {...stylex.props(styles.title)}
          ref={(element) => (titleRef = element)}
          data-allow-expand="true"
          data-widget-card-title
        >
          <span {...stylex.props(styles.titleIcon)}>{props.icon}</span>
          <span>{props.title}</span>
        </h3>
        <div {...stylex.props(styles.actions)} data-widget-card-actions>
          <button
            {...stylex.props(styles.action)}
            type="button"
            data-widget-card-remove
            aria-label={props.copy?.removeAriaLabel(props.title) ?? `移除 ${props.title}`}
            onClick={() => props.callbacks.onRemove()}
          >
            <X size={15} />
          </button>
        </div>
      </div>
      <div {...stylex.props(styles.body)} data-widget-card-body>
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
          {...stylex.props(...gridItemXstyle(props.currentSize, props.callbacks.isDragging))}
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
        xstyle={gridItemXstyle(props.currentSize, props.callbacks.isDragging)}
        triggerProps={gridItemProps}
        aria-label={props.title}
      >
        {cardInner}
      </ContextMenu>
    </Show>
  )
}
