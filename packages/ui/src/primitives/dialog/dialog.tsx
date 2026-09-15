import { Dialog as KDialog } from "@kobalte/core/dialog"
import X from "lucide-solid/icons/x"
import type { JSX } from "solid-js"
import { Show } from "solid-js"

export type DialogProps = {
  open: boolean
  onCancel: () => void
  title?: JSX.Element
  description?: JSX.Element
  children?: JSX.Element
  footer?: JSX.Element | null
  closable?: boolean
  keyboard?: boolean
  maskClosable?: boolean
  /** Number/string sets an inline panel width; `null` leaves width to panelClass/panelStyle. */
  width?: number | string | null
  destructive?: boolean
  /** Renders children as the entire panel, replacing the built-in header/body/footer chrome. */
  chromeless?: boolean
  /** Accessible label for the dialog when no visible title is rendered (e.g. chromeless). */
  ariaLabel?: string
  class?: string | undefined
  style?: JSX.CSSProperties | undefined
  overlayClass?: string | undefined
  overlayStyle?: JSX.CSSProperties | undefined
  panelClass?: string | undefined
  panelStyle?: JSX.CSSProperties | undefined
  headerClass?: string | undefined
  headerStyle?: JSX.CSSProperties | undefined
  closeClass?: string | undefined
  closeStyle?: JSX.CSSProperties | undefined
  bodyClass?: string | undefined
  bodyStyle?: JSX.CSSProperties | undefined
  footerClass?: string | undefined
  footerStyle?: JSX.CSSProperties | undefined
}

function optionalPartProps(className: string | undefined, style: JSX.CSSProperties | undefined) {
  return {
    ...(className !== undefined ? { class: className } : {}),
    ...(style !== undefined ? { style } : {}),
  }
}

export function Dialog(props: DialogProps) {
  const width = (): string | undefined => {
    if (props.width === null) return undefined
    if (typeof props.width === "number") return `${props.width}px`
    return props.width ?? "420px"
  }
  return (
    <KDialog
      open={props.open}
      onOpenChange={(open) => {
        if (!open) props.onCancel()
      }}
    >
      <KDialog.Portal>
        <KDialog.Overlay
          {...optionalPartProps(
            [props.overlayClass, props.class].filter(Boolean).join(" "),
            props.overlayStyle ?? props.style,
          )}
        />
        <KDialog.Content
          class={props.panelClass}
          aria-label={props.ariaLabel}
          data-destructive={props.destructive ? "" : undefined}
          style={{
            ...props.panelStyle,
            ...(width() !== undefined ? { width: width(), "max-width": "90vw" } : {}),
          }}
          onEscapeKeyDown={(event) => {
            if (props.keyboard === false) event.preventDefault()
          }}
          onPointerDownOutside={(event) => {
            if (props.maskClosable === false) event.preventDefault()
          }}
          onFocusOutside={(event) => {
            // Losing focus is not a dismissal gesture. Keep the dialog open until the
            // user explicitly closes it, presses Escape, or clicks the mask when enabled.
            event.preventDefault()
          }}
        >
          <Show when={!props.chromeless} fallback={props.children}>
            <header class={props.headerClass} style={props.headerStyle}>
              <KDialog.Title
                style={{
                  margin: 0,
                  "font-family": "inherit",
                  "font-size": "inherit",
                  "font-weight": "inherit",
                  "line-height": "inherit",
                }}
              >
                {props.title}
              </KDialog.Title>
              <Show when={props.closable !== false}>
                <KDialog.CloseButton
                  class={props.closeClass}
                  style={props.closeStyle}
                  type="button"
                  aria-label="关闭"
                >
                  <X size={16} strokeWidth={2} />
                </KDialog.CloseButton>
              </Show>
            </header>
            <div class={props.bodyClass} style={props.bodyStyle}>
              <Show when={props.description}>
                <KDialog.Description style={{ margin: 0 }}>{props.description}</KDialog.Description>
              </Show>
              {props.children}
            </div>
            <Show when={props.footer}>
              <footer class={props.footerClass} style={props.footerStyle}>
                {props.footer}
              </footer>
            </Show>
          </Show>
        </KDialog.Content>
      </KDialog.Portal>
    </KDialog>
  )
}
