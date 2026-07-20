import { Dialog as KDialog } from "@kobalte/core/dialog"
import type { JSX } from "solid-js"
import { Show } from "solid-js"

export type DialogProps = {
  open: boolean
  onClose: () => void
  title: JSX.Element
  description?: JSX.Element
  children?: JSX.Element
  footer?: JSX.Element
  destructive?: boolean
  size?: "sm" | "md" | "lg"
  class?: string | undefined
  style?: JSX.CSSProperties | undefined
  overlayClass?: string | undefined
  overlayStyle?: JSX.CSSProperties | undefined
  panelClass?: string | undefined
  panelStyle?: JSX.CSSProperties | undefined
  headerClass?: string | undefined
  headerStyle?: JSX.CSSProperties | undefined
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
  const sizes = { sm: "320px", md: "420px", lg: "560px" }
  return (
    <KDialog
      open={props.open}
      onOpenChange={(open) => {
        if (!open) props.onClose()
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
          data-size={props.size ?? "md"}
          style={{ ...props.panelStyle, width: sizes[props.size ?? "md"], "max-width": "90vw" }}
        >
          <KDialog.Title class={props.headerClass} style={props.headerStyle}>
            {props.title}
          </KDialog.Title>
          <Show when={props.description}>
            <KDialog.Description class={props.bodyClass} style={props.bodyStyle}>
              {props.description}
            </KDialog.Description>
          </Show>
          {props.children}
          <Show when={props.footer}>
            <div class={props.footerClass} style={props.footerStyle}>
              {props.footer}
            </div>
          </Show>
        </KDialog.Content>
      </KDialog.Portal>
    </KDialog>
  )
}
