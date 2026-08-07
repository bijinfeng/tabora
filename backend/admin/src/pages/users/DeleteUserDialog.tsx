import * as stylex from "@stylexjs/stylex"
import { Dialog } from "@tabora/ui"
import { Button } from "@tabora/ui/button"
import { InlineError } from "@tabora/ui/inline-error"
import { useMutation } from "@tanstack/solid-query"
import { Show } from "solid-js"

import { removeUser, type AdminUser } from "./usersApi"
import { styles } from "./users.styles"

type DeleteUserDialogProps = {
  user: AdminUser | null
  onClose: () => void
  onDeleted: () => void
}

export function DeleteUserDialog(props: DeleteUserDialogProps) {
  const mutation = useMutation(() => ({
    mutationFn: (id: string) => removeUser(id),
    onSuccess: () => {
      props.onDeleted()
      props.onClose()
    },
  }))

  function handleDelete() {
    const user = props.user
    if (!user || mutation.isPending) return
    mutation.mutate(user.id)
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
          <Button variant="danger" loading={mutation.isPending} onClick={handleDelete}>
            删除
          </Button>
        </div>
      }
    >
      <Show when={mutation.error}>
        <InlineError>{(mutation.error as Error)?.message}</InlineError>
      </Show>
    </Dialog>
  )
}
