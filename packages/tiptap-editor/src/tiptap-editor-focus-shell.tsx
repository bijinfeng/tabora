import type { StyleXStyles } from "@stylexjs/stylex"
import * as stylex from "@stylexjs/stylex"
import type { JSX } from "solid-js"
import { Show, splitProps } from "solid-js"

import { Expand, Shrink } from "lucide-solid/icons"
import { IconButton } from "@tabora/ui/button"

import type { SolidAttrs } from "./tiptap-editor-root"
import { sx } from "./stylex"

const _ = stylex.create({ empty: {} })

export type TiptapEditorFocusShellProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  dismissOnMaskClick?: boolean
  escapeToClose?: boolean
  xstyleOverlay?: StyleXStyles | ReturnType<typeof stylex.attrs>
  xstyleCard?: StyleXStyles | ReturnType<typeof stylex.attrs>
  overlayAttrs?: SolidAttrs<HTMLElement>
  cardAttrs?: SolidAttrs<HTMLElement>
  showExitButton?: boolean
  exitButtonSlot?: "top-right" | "none"
  children?: JSX.Element
}

export function TiptapEditorFocusShell(props: TiptapEditorFocusShellProps) {
  const [local] = splitProps(props, [
    "open",
    "onOpenChange",
    "dismissOnMaskClick",
    "escapeToClose",
    "xstyleOverlay",
    "xstyleCard",
    "overlayAttrs",
    "cardAttrs",
    "showExitButton",
    "exitButtonSlot",
    "children",
  ])

  const open = (): boolean => (local.open === undefined ? false : !!local.open)

  const toggle = (next: boolean) => {
    local.onOpenChange?.(next)
  }

  const overlayAttrs = (): SolidAttrs<HTMLElement> => {
    const c = sx(local.xstyleOverlay ?? _.empty)
    return local.overlayAttrs ?? { class: c.class ?? undefined, style: c.style as any }
  }
  const cardAttrs = (): SolidAttrs<HTMLElement> => {
    const c = sx(local.xstyleCard ?? _.empty)
    return local.cardAttrs ?? { class: c.class ?? undefined, style: c.style as any }
  }

  const a = overlayAttrs()
  const ca = cardAttrs()

  return (
    <Show when={open()}>
      <div
        data-tiptap-focus-overlay
        role="dialog"
        aria-modal="true"
        class={a.class}
        style={a.style as JSX.CSSProperties | undefined}
        ref={a.ref as any}
        onClick={(ev) => {
          if (ev.target !== ev.currentTarget) return
          if (local.dismissOnMaskClick === false) return
          toggle(false)
        }}
      >
        <div
          data-tiptap-focus-card
          class={ca.class}
          style={ca.style as JSX.CSSProperties | undefined}
          ref={ca.ref as any}
        >
          <Show when={local.showExitButton !== false && local.exitButtonSlot !== "none"}>
            <div data-tiptap-focus-exit>
              <IconButton
                variant="ghost"
                size="sm"
                aria-label="退出聚焦模式"
                title="退出聚焦模式"
                onClick={() => toggle(false)}
              >
                <Shrink height={16} width={16} />
              </IconButton>
            </div>
          </Show>
          {local.children}
        </div>
      </div>
    </Show>
  )
}

export function TiptapEditorFocusEntry(props: {
  onClick?: (open: boolean) => void
  open?: boolean
  xstyle?: StyleXStyles | ReturnType<typeof stylex.attrs>
  attrs?: SolidAttrs<HTMLElement>
  label?: string
}) {
  const open = (): boolean => (props.open === undefined ? false : !!props.open)
  const attrs = (): SolidAttrs<HTMLElement> => {
    const c = sx(props.xstyle ?? _.empty)
    return props.attrs ?? { class: c.class ?? undefined, style: c.style as any }
  }
  const a = attrs()
  return (
    <IconButton
      variant="ghost"
      size="sm"
      aria-label={props.label ?? "聚焦模式"}
      title={props.label ?? "聚焦模式"}
      style={a.style as JSX.CSSProperties | undefined}
      onClick={() => props.onClick?.(!open())}
    >
      <Expand height={16} width={16} />
    </IconButton>
  )
}

export default TiptapEditorFocusShell
