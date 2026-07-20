import { Dialog as KDialog } from "@kobalte/core/dialog"
import type { JSX } from "solid-js"
import { Show } from "solid-js"
import { X } from "lucide-solid"

export type DrawerProps = {
  open: boolean
  onClose: () => void
  title: JSX.Element
  description?: JSX.Element
  footer?: JSX.Element
  side?: "right" | "left"
  size?: "sm" | "md" | "lg"
  class?: string | undefined
  style?: JSX.CSSProperties | undefined
  scrimClass?: string | undefined
  scrimStyle?: JSX.CSSProperties | undefined
  panelClass?: string | undefined
  panelStyle?: JSX.CSSProperties | undefined
  panelSideClass?: string | undefined
  panelSideStyle?: JSX.CSSProperties | undefined
  panelSizeClass?: string | undefined
  panelSizeStyle?: JSX.CSSProperties | undefined
  headerClass?: string | undefined
  headerStyle?: JSX.CSSProperties | undefined
  titleClass?: string | undefined
  titleStyle?: JSX.CSSProperties | undefined
  descriptionClass?: string | undefined
  descriptionStyle?: JSX.CSSProperties | undefined
  closeClass?: string | undefined
  closeStyle?: JSX.CSSProperties | undefined
  bodyClass?: string | undefined
  bodyStyle?: JSX.CSSProperties | undefined
  footerClass?: string | undefined
  footerStyle?: JSX.CSSProperties | undefined
  children: JSX.Element
}

function optionalPartProps(className: string | undefined, style: JSX.CSSProperties | undefined) {
  return {
    ...(className !== undefined ? { class: className } : {}),
    ...(style !== undefined ? { style } : {}),
  }
}

export function Drawer(props: DrawerProps) {
  return (
    <KDialog
      open={props.open}
      onOpenChange={(open) => {
        if (!open) props.onClose()
      }}
    >
      <KDialog.Portal>
        <div class={props.class} style={props.style}>
          <KDialog.Overlay
            {...optionalPartProps(props.scrimClass, props.scrimStyle)}
            aria-label="关闭"
          />
          <KDialog.Content
            class={[props.panelClass, props.panelSideClass, props.panelSizeClass]
              .filter(Boolean)
              .join(" ")}
            data-side={props.side ?? "right"}
            data-size={props.size ?? "md"}
            style={{
              ...props.panelStyle,
              ...props.panelSideStyle,
              ...props.panelSizeStyle,
            }}
          >
            <header class={props.headerClass} style={props.headerStyle}>
              <div>
                <KDialog.Title class={props.titleClass} style={props.titleStyle}>
                  {props.title}
                </KDialog.Title>
                <Show when={props.description}>
                  <KDialog.Description
                    class={props.descriptionClass}
                    style={props.descriptionStyle}
                  >
                    {props.description}
                  </KDialog.Description>
                </Show>
              </div>
              <KDialog.CloseButton
                type="button"
                class={props.closeClass}
                style={props.closeStyle}
                aria-label="关闭"
              >
                <X size={16} strokeWidth={2} />
              </KDialog.CloseButton>
            </header>
            <div class={props.bodyClass} style={props.bodyStyle}>
              {props.children}
            </div>
            <Show when={props.footer}>
              <footer class={props.footerClass} style={props.footerStyle}>
                {props.footer}
              </footer>
            </Show>
          </KDialog.Content>
        </div>
      </KDialog.Portal>
    </KDialog>
  )
}
