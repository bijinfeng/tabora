import * as stylex from "@stylexjs/stylex"

import { sx } from "./stylex"

const styles = stylex.create({
  root: {
    backgroundColor: "rgb(var(--tbr-color-surface))",
    border: "1px solid rgb(var(--tbr-color-line-strong))",
    borderRadius: "var(--tbr-radius-control)",
    bottom: 20,
    boxShadow: "var(--tbr-shadow-floating)",
    color: "rgb(var(--tbr-color-text))",
    display: "none",
    fontSize: 13,
    maxWidth: "min(360px, calc(100vw - 40px))",
    paddingBlock: 13,
    paddingInline: 15,
    position: "fixed",
    right: 20,
    zIndex: "var(--tbr-z-toast)",
  },
  visible: {
    display: "block",
  },
})

export function SiteToast(props: { visible: boolean; message: string }) {
  return (
    <div
      {...sx(styles.root, props.visible && styles.visible)}
      role="status"
      aria-live="polite"
      data-toast
      data-site-toast
      data-component="SiteToast"
    >
      {props.message}
    </div>
  )
}
