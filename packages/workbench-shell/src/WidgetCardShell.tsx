import * as stylex from "@stylexjs/stylex"
import type { JSX } from "solid-js"
import { onCleanup, Show } from "solid-js"
import { widgetGridColumnSpan, widgetGridRowSpan } from "@tabora/plugin-api"
import type { PluginInstance, WidgetSize } from "@tabora/plugin-api"
import { IconButton } from "@tabora/ui/button"
import { ContextMenu, type ContextMenuItem } from "@tabora/ui/context-menu"
import Minus from "lucide-solid/icons/minus"
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
    [widgetCardStyleVars.actionsPointerEvents]: "none",
    [widgetCardStyleVars.headerCursor]: "grab",
    gridColumn: "span var(--widget-col-span, 1)",
    gridRow: "span var(--widget-row-span, 1)",
    minHeight: 0,
    minWidth: 0,
    ":hover": {
      [widgetCardStyleVars.actionsOpacity]: 1,
      [widgetCardStyleVars.actionsPointerEvents]: "auto",
    },
    ":focus-within": {
      [widgetCardStyleVars.actionsOpacity]: 1,
      [widgetCardStyleVars.actionsPointerEvents]: "auto",
    },
    "@media (hover: none)": {
      [widgetCardStyleVars.actionsOpacity]: 1,
      [widgetCardStyleVars.actionsPointerEvents]: "auto",
    },
    "@media (max-width: 768px)": {
      gridColumn: "span 1",
      gridRow: "auto",
      minHeight: 150,
    },
  },
  dragging: {
    [widgetCardStyleVars.actionsOpacity]: 1,
    [widgetCardStyleVars.actionsPointerEvents]: "auto",
    [widgetCardStyleVars.headerCursor]: "grabbing",
  },
  card: {
    backgroundColor: color.surface,
    borderColor: color.line,
    borderRadius: radius.card,
    borderStyle: "solid",
    borderWidth: 1,
    cursor: widgetCardStyleVars.headerCursor,
    display: "flex",
    flexDirection: "column",
    height: "100%",
    overflow: "visible",
    padding: 0,
    position: "relative",
    touchAction: "none",
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
    // 26px 按钮按原比例外挂在卡片右上角外沿。
    right: -6,
    top: -6,
    transitionDuration: motion.fast,
    transitionProperty: "opacity",
    transitionTimingFunction: motion.ease,
    zIndex: 1,
  },
  action: {
    // 只声明 IconButton 给不了的东西：悬浮在卡片上的圆形徽标外观。
    // 尺寸（26×26）、圆角、hover、focus-visible、transition 全部走 size="sm" 默认值，
    // 26px 也正好越过 WCAG 2.2 AA 的 24px 触控目标下限。
    backgroundColor: color.surface,
    borderRadius: radius.pill,
    boxShadow: shadow.sm,
    pointerEvents: "auto",
    ":hover": {
      boxShadow: shadow.md,
    },
  },
  body: {
    borderRadius: radius.card,
    display: "grid",
    flex: 1,
    height: "100%",
    minHeight: 0,
    minWidth: 0,
    overflow: "hidden",
    width: "100%",
  },
})

function gridItemXstyle(size: WidgetSize, dragging: boolean) {
  void size
  return [styles.gridItem, dragging && styles.dragging]
}

// 真实指针双击的判定窗口：两次 pointerdown 的时间差与位移上限。
const doubleClickWindowMs = 400
const doubleClickSlopPx = 10

export function WidgetCardShell(props: WidgetCardShellProps) {
  // dnd-kit 的 PointerSensor 激活拖拽时对 pointerdown 调了 preventDefault()
  // （@dnd-kit/dom/index.js:2088）。按 Pointer Events 规范，这会抑制后续的兼容鼠标
  // 事件——mousedown / click / dblclick 都不再派发，所以下面 onClick 里的
  // detail === 2 在真实指针下永远不会命中，双击打不开展开视图。
  // pointerdown 本身不受影响，仍然到达卡片，因此改由它自行判定双击。
  // 合成事件（e2e / 单测直接 dispatch click）不走 pointerdown，仍由 onClick 兜住，
  // 两条路径用 expandOpenedByPointer 去重。
  let lastPointerDownAt = 0
  let lastPointerDownX = 0
  let lastPointerDownY = 0
  let expandOpenedByPointer = false

  const handleGridItemPointerDown = (event: PointerEvent) => {
    // 卡片右上角操作区标了 data-prevent-expand，点它不该展开。
    if (
      event.target instanceof HTMLElement &&
      event.target.closest("[data-prevent-expand='true']")
    ) {
      lastPointerDownAt = 0
      return
    }

    const now = Date.now()
    const isSecondTap =
      lastPointerDownAt > 0 &&
      now - lastPointerDownAt <= doubleClickWindowMs &&
      Math.hypot(event.clientX - lastPointerDownX, event.clientY - lastPointerDownY) <=
        doubleClickSlopPx

    if (isSecondTap) {
      // 归零，避免三击时第三次又判成一次双击。
      lastPointerDownAt = 0
      expandOpenedByPointer = true
      props.callbacks.onExpand()
      return
    }

    lastPointerDownAt = now
    lastPointerDownX = event.clientX
    lastPointerDownY = event.clientY
  }

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
      data-widget-card-title
    >
      <div {...stylex.attrs(styles.actions)} data-widget-card-actions data-prevent-expand="true">
        <IconButton
          size="sm"
          xstyle={styles.action}
          data-widget-card-remove
          aria-label={props.copy?.removeAriaLabel(props.title) ?? `移除 ${props.title}`}
          onClick={(event) => {
            event.stopPropagation()
            props.callbacks.onRemove()
          }}
        >
          <Minus size={14} />
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
    onPointerDown: handleGridItemPointerDown,
    onClick: (event: MouseEvent) => {
      // 真实指针下 pointerdown 已判过双击，这里不再重复展开。
      if (expandOpenedByPointer) {
        expandOpenedByPointer = false
        return
      }
      if (event.detail === 2) props.callbacks.onExpand()
    },
    onDblClick: props.callbacks.onDblClick,
    // 卡片可聚焦（tabIndex 0），键盘用户需要和双击等价的展开入口。
    // 只处理落在卡片本身的按键：卡片内的操作按钮和插件内容自己消费回车/空格。
    onKeyDown: (event: KeyboardEvent) => {
      if (event.target !== event.currentTarget) return
      if (event.key !== "Enter" && event.key !== " ") return
      event.preventDefault()
      props.callbacks.onExpand()
    },
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
