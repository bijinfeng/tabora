import { Dialog as KDialog } from "@kobalte/core/dialog"
import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"
import { X } from "lucide-solid"
import { Show } from "solid-js"
import type { JSX } from "solid-js"

const styles = stylex.create({
  root: {
    inset: 0,
    pointerEvents: "none",
    position: "fixed",
    zIndex: 70,
  },
  scrim: {
    backgroundColor: "rgb(var(--tbr-color-scrim) / 0.28)",
    borderStyle: "none",
    borderWidth: 0,
    inset: 0,
    pointerEvents: "auto",
    position: "absolute",
  },
  panel: {
    backgroundColor: "rgb(var(--tbr-color-surface))",
    borderColor: "rgb(var(--tbr-color-line))",
    borderStyle: "solid",
    borderWidth: 1,
    bottom: 0,
    boxShadow:
      "0 20px 48px rgb(var(--tbr-color-shadow-strong) / 0.18), 0 0 1px rgb(var(--tbr-color-shadow) / 0.08)",
    display: "flex",
    flexDirection: "column",
    pointerEvents: "auto",
    position: "absolute",
    top: 0,
    width: "min(90vw, 420px)",
  },
  right: {
    borderRadius: "var(--tbr-radius-panel) 0 0 var(--tbr-radius-panel)",
    right: 0,
  },
  left: {
    borderRadius: "0 var(--tbr-radius-panel) var(--tbr-radius-panel) 0",
    left: 0,
  },
  sm: {
    width: "min(90vw, 340px)",
  },
  lg: {
    width: "min(90vw, 560px)",
  },
  header: {
    alignItems: "center",
    borderBottomColor: "rgb(var(--tbr-color-line))",
    borderBottomStyle: "solid",
    borderBottomWidth: 1,
    display: "flex",
    gap: 12,
    justifyContent: "space-between",
    paddingBlock: 10,
    paddingInline: 12,
  },
  footer: {
    alignItems: "center",
    borderBottom: "none",
    borderTopColor: "rgb(var(--tbr-color-line))",
    borderTopStyle: "solid",
    borderTopWidth: 1,
    display: "flex",
    gap: 12,
    justifyContent: "flex-end",
    paddingBlock: 9,
    paddingInline: 12,
  },
  title: {
    color: "rgb(var(--tbr-color-text))",
    fontSize: 14,
    fontWeight: 650,
    lineHeight: 1.35,
    margin: 0,
  },
  description: {
    color: "rgb(var(--tbr-color-text-muted))",
    fontSize: 12,
    lineHeight: 1.45,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
    marginTop: 3,
  },
  close: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderColor: "transparent",
    borderRadius: "var(--tbr-radius-2)",
    borderStyle: "solid",
    borderWidth: 1,
    color: "rgb(var(--tbr-color-text-muted))",
    cursor: "pointer",
    display: "inline-flex",
    fontFamily: "inherit",
    height: 28,
    justifyContent: "center",
    width: 28,
    ":hover": {
      backgroundColor: "rgb(var(--tbr-color-surface-hover))",
      color: "rgb(var(--tbr-color-text))",
    },
  },
  body: {
    flex: 1,
    minHeight: 0,
    overflow: "auto",
    padding: 12,
  },
})

export type DrawerProps = {
  open: boolean
  onClose: () => void
  title: JSX.Element
  description?: JSX.Element
  footer?: JSX.Element
  side?: "right" | "left"
  size?: "sm" | "md" | "lg"
  xstyle?: StyleXStyles
  children: JSX.Element
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
        <div {...stylex.attrs(styles.root, props.xstyle)} data-drawer-root>
          <KDialog.Overlay {...stylex.attrs(styles.scrim)} aria-label="关闭" />
          <KDialog.Content
            {...stylex.attrs(
              styles.panel,
              props.side === "left" ? styles.left : styles.right,
              props.size === "sm" && styles.sm,
              props.size === "lg" && styles.lg,
            )}
            data-side={props.side ?? "right"}
            data-size={props.size ?? "md"}
          >
            <header {...stylex.attrs(styles.header)}>
              <div>
                <KDialog.Title {...stylex.attrs(styles.title)}>{props.title}</KDialog.Title>
                <Show when={props.description}>
                  <KDialog.Description {...stylex.attrs(styles.description)}>
                    {props.description}
                  </KDialog.Description>
                </Show>
              </div>
              <KDialog.CloseButton {...stylex.attrs(styles.close)} type="button" aria-label="关闭">
                <X size={16} strokeWidth={2} />
              </KDialog.CloseButton>
            </header>
            <div {...stylex.attrs(styles.body)}>{props.children}</div>
            <Show when={props.footer}>
              <footer {...stylex.attrs(styles.footer)}>{props.footer}</footer>
            </Show>
          </KDialog.Content>
        </div>
      </KDialog.Portal>
    </KDialog>
  )
}
