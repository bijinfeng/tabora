import * as stylex from "@stylexjs/stylex"
import { For, Show } from "solid-js"
import type { ToastRecord } from "@tabora/orchestrator"
import { color, font, motion, radius, shadow, zIndex } from "@tabora/theme/tokens.stylex"

export type ToastMessage = ToastRecord

const toastIn = stylex.keyframes({
  from: {
    opacity: 0,
    transform: "translateY(8px)",
  },
  to: {
    opacity: 1,
    transform: "translateY(0)",
  },
})

const styles = stylex.create({
  stack: {
    alignItems: "flex-end",
    bottom: 20,
    display: "flex",
    flexDirection: "column-reverse",
    gap: 8,
    pointerEvents: "none",
    position: "fixed",
    right: 20,
    zIndex: zIndex.toast,
    "@media (max-width: 480px)": {
      bottom: 12,
      left: 12,
      right: 12,
    },
  },
  item: {
    alignItems: "center",
    animationDuration: motion.normal,
    animationName: toastIn,
    animationTimingFunction: motion.ease,
    backgroundColor: color.surface,
    borderColor: color.line,
    borderRadius: radius.card,
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: shadow.md,
    color: color.text,
    display: "flex",
    fontSize: 12,
    gap: 8,
    lineHeight: 1.4,
    maxWidth: 360,
    minHeight: 40,
    paddingBlock: 10,
    paddingInline: 14,
    pointerEvents: "auto",
    "@media (max-width: 480px)": {
      maxWidth: "100%",
      width: "100%",
    },
    "@media (prefers-reduced-motion: reduce)": {
      animationDuration: "1ms",
    },
  },
  icon: {
    color: color.accent,
    fontSize: 13,
    fontWeight: font.bold,
    lineHeight: 1,
  },
  message: {
    minWidth: 0,
  },
  action: {
    backgroundColor: "transparent",
    borderStyle: "none",
    borderWidth: 0,
    color: color.accent,
    cursor: "pointer",
    fontFamily: "inherit",
    fontWeight: font.semibold,
    marginLeft: 4,
    ":hover": {
      color: color.accentHover,
    },
    ":focus-visible": {
      outlineColor: color.focus,
      outlineOffset: 2,
      outlineStyle: "solid",
      outlineWidth: 2,
    },
  },
})

export function ToastHost(props: {
  toasts: ToastMessage[]
  onAction?: (commandId: string) => void
}) {
  return (
    <Show when={props.toasts.length > 0}>
      <div {...stylex.props(styles.stack)} aria-live="polite" aria-atomic="true" data-toast-stack>
        <For each={props.toasts}>
          {(toast) => (
            <div {...stylex.props(styles.item)} data-toast-type={toast.type} data-toast-item>
              <span {...stylex.props(styles.icon)} aria-hidden="true" data-toast-icon>
                ✓
              </span>
              <span {...stylex.props(styles.message)} data-toast-message>
                {toast.message}
              </span>
              <Show when={toast.action}>
                {(action) => (
                  <button
                    {...stylex.props(styles.action)}
                    data-toast-action
                    type="button"
                    onClick={() => props.onAction?.(action().commandId)}
                  >
                    {action().label}
                  </button>
                )}
              </Show>
            </div>
          )}
        </For>
      </div>
    </Show>
  )
}
