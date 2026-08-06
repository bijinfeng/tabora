import * as stylex from "@stylexjs/stylex"
import { Dialog } from "@tabora/ui"
import { Button } from "@tabora/ui/button"
import { InlineError } from "@tabora/ui/inline-error"
import { createSignal, Show } from "solid-js"

import { removeUser, type AdminUser } from "./usersApi"
import { styles } from "./users.styles"

type DeleteUserDialogProps = {
  user: AdminUser | null
  onClose: () => void
  onDeleted: () => void
}

export function DeleteUserDialog(props: DeleteUserDialogProps) {
  const [error, setError] = createSignal<string | null>(null)
  const [submitting, setSubmitting] = createSignal(false)

  async function handleDelete() {
    const user = props.user
    if (!user || submitting()) return
    setError(null)
    setSubmitting(true)
    try {
      await removeUser(user.id)
      props.onDeleted()
      props.onClose()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={props.user !== null}
      onClose={props.onClose}
      destructive
      title="删除用户"
      description={`确认删除 ${props.user?.email ?? ""}？该操作不可撤销，用户数据与会话将一并移除。`}
      footer={
        <div {...stylex.attrs(styles.footerRow)}>
          <Button variant="secondary" onClick={props.onClose}>
            取消
          </Button>
          <Button variant="danger" loading={submitting()} onClick={handleDelete}>
            删除
          </Button>
        </div>
      }
    >
      <Show when={error()}>
        <InlineError>{error()}</InlineError>
      </Show>
    </Dialog>
  )
}
