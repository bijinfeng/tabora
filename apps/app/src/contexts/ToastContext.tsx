import * as stylex from "@stylexjs/stylex"
import { Toast, type ToastVariant } from "@tabora/ui/toast"
import { zIndex } from "@tabora/theme/tokens.stylex"
import { createContext, createSignal, For, useContext, type JSX } from "solid-js"

const styles = stylex.create({
  region: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    inset: "auto 16px 16px auto",
    maxWidth: 360,
    pointerEvents: "none",
    position: "fixed",
    zIndex: zIndex.toast,
  },
})

type ToastItem = {
  id: number
  variant: ToastVariant
  title: JSX.Element
  description?: JSX.Element
}

type ShowToastInput = {
  variant?: ToastVariant
  title: JSX.Element
  description?: JSX.Element
  /** 自动消失延迟（毫秒），默认 3000。传 0 表示不自动消失。 */
  duration?: number
}

type ToastContextValue = {
  showToast: (input: ShowToastInput) => number
  dismiss: (id: number) => void
}

const ToastContext = createContext<ToastContextValue>()

const DEFAULT_DURATION = 3000

export function ToastProvider(props: { children: JSX.Element }) {
  const [toasts, setToasts] = createSignal<ToastItem[]>([])
  let nextId = 1

  function dismiss(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  function showToast(input: ShowToastInput): number {
    const id = nextId++
    setToasts((prev) => [
      ...prev,
      {
        id,
        variant: input.variant ?? "info",
        title: input.title,
        description: input.description,
      },
    ])

    const duration = input.duration ?? DEFAULT_DURATION
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration)
    }
    return id
  }

  return (
    <ToastContext.Provider value={{ showToast, dismiss }}>
      {props.children}
      <div {...stylex.attrs(styles.region)} aria-live="polite">
        <For each={toasts()}>
          {(t) => (
            <div style={{ "pointer-events": "auto" }}>
              <Toast
                variant={t.variant}
                title={t.title}
                description={t.description}
                action="关闭"
                onAction={() => dismiss(t.id)}
              />
            </div>
          )}
        </For>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error("useToast 必须在 ToastProvider 内使用")
  }
  return ctx
}
