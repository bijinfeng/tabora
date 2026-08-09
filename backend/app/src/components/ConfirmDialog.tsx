import * as stylex from "@stylexjs/stylex"
import { Dialog } from "@tabora/ui"
import { Button } from "@tabora/ui/button"
import { InlineError } from "@tabora/ui/inline-error"
import { Show, type JSX } from "solid-js"

import { space } from "@tabora/theme/tokens.stylex"

const styles = stylex.create({
  footerRow: {
    alignItems: "center",
    display: "flex",
    gap: space.s3,
    justifyContent: "flex-end",
  },
})

type ConfirmDialogProps = {
  open: boolean
  title: string
  description?: string
  /** 确认按钮文案，默认"确认"。 */
  confirmLabel?: string
  /** 取消按钮文案，默认"取消"。 */
  cancelLabel?: string
  /** 是否为破坏性操作，控制样式与危险色确认按钮。默认 true。 */
  destructive?: boolean
  loading?: boolean
  error?: string | null
  children?: JSX.Element
  onConfirm: () => void
  onClose: () => void
}

/**
 * 通用确认弹窗：用于删除、清理等不可逆操作前的二次确认。
 */
export function ConfirmDialog(props: ConfirmDialogProps) {
  const destructive = () => props.destructive ?? true

  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      destructive={destructive()}
      title={props.title}
      description={props.description}
      footer={
        <div {...stylex.attrs(styles.footerRow)}>
          <Button variant="secondary" onClick={props.onClose}>
            {props.cancelLabel ?? "取消"}
          </Button>
          <Button
            variant={destructive() ? "danger" : "primary"}
            loading={props.loading ?? false}
            onClick={props.onConfirm}
          >
            {props.confirmLabel ?? "确认"}
          </Button>
        </div>
      }
    >
      <Show when={props.error}>
        <InlineError>{props.error}</InlineError>
      </Show>
      {props.children}
    </Dialog>
  )
}
