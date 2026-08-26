import { Dialog as KDialog } from "@kobalte/core/dialog"
import X from "lucide-solid/icons/x"
import type { JSX } from "solid-js"
import { Show } from "solid-js"

export type DialogProps = {
  open: boolean
  onCancel: () => void
  title: JSX.Element
  description?: JSX.Element
  children?: JSX.Element
  footer?: JSX.Element | null
  closable?: boolean
  keyboard?: boolean
  maskClosable?: boolean
  width?: number | string
  destructive?: boolean
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
  const width = () =>
    typeof props.width === "number" ? `${props.width}px` : (props.width ?? "420px")
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
          data-destructive={props.destructive ? "" : undefined}
          style={{ ...props.panelStyle, width: width(), "max-width": "90vw" }}
          onEscapeKeyDown={(event) => {
            if (props.keyboard === false) event.preventDefault()
          }}
          onPointerDownOutside={(event) => {
            if (props.maskClosable === false) event.preventDefault()
          }}
        >
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
        </KDialog.Content>
      </KDialog.Portal>
    </KDialog>
  )
}
