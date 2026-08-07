import * as stylex from "@stylexjs/stylex"
import { Dialog } from "@tabora/ui"
import { Button } from "@tabora/ui/button"
import { Field } from "@tabora/ui/field"
import { InlineError } from "@tabora/ui/inline-error"
import { Input } from "@tabora/ui/input"
import { Select } from "@tabora/ui/select"
import { useMutation } from "@tanstack/solid-query"
import { createSignal, Show } from "solid-js"

import { createUser } from "./usersApi"
import { styles } from "./users.styles"

type CreateUserDialogProps = {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

const MIN_PASSWORD = 8

export function CreateUserDialog(props: CreateUserDialogProps) {
  const [email, setEmail] = createSignal("")
  const [name, setName] = createSignal("")
  const [password, setPassword] = createSignal("")
  const [role, setRole] = createSignal<"user" | "admin">("user")
  const [validationError, setValidationError] = createSignal<string | null>(null)

  function reset() {
    setEmail("")
    setName("")
    setPassword("")
    setRole("user")
    setValidationError(null)
  }

  const mutation = useMutation(() => ({
    mutationFn: createUser,
    onSuccess: () => {
      reset()
      props.onCreated()
      props.onClose()
    },
  }))

  function handleSubmit() {
    if (mutation.isPending) return
    if (password().length < MIN_PASSWORD) {
      setValidationError(`密码至少 ${MIN_PASSWORD} 位`)
      return
    }
    setValidationError(null)
    mutation.mutate({
      email: email().trim(),
      password: password(),
      name: name().trim() || email().split("@")[0] || "User",
      role: role(),
    })
  }

  const errorMessage = () => validationError() ?? (mutation.error as Error | null)?.message ?? null

  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      title="创建用户"
      description="新用户可用邮箱密码登录；设为管理员将获得后台管理权限。"
      footer={
        <div {...stylex.attrs(styles.footerRow)}>
          <Button variant="secondary" onClick={props.onClose}>
            取消
          </Button>
          <Button variant="primary" loading={mutation.isPending} onClick={handleSubmit}>
            创建
          </Button>
        </div>
      }
    >
      <div {...stylex.attrs(styles.formGrid)}>
        <Field label="邮箱" htmlFor="new-user-email">
          <Input
            id="new-user-email"
            type="email"
            value={email()}
            onInput={setEmail}
            placeholder="user@example.com"
            autocomplete="off"
          />
        </Field>
        <Field label="名称" htmlFor="new-user-name" helper="留空则取邮箱前缀">
          <Input id="new-user-name" value={name()} onInput={setName} placeholder="显示名称" />
        </Field>
        <Field label="密码" htmlFor="new-user-password" helper={`至少 ${MIN_PASSWORD} 位`}>
          <Input
            id="new-user-password"
            type="password"
            value={password()}
            onInput={setPassword}
            placeholder="设置初始密码"
            autocomplete="new-password"
          />
        </Field>
        <Field label="角色" htmlFor="new-user-role">
          <Select
            value={role()}
            onChange={setRole}
            options={[
              { value: "user", label: "普通用户" },
              { value: "admin", label: "管理员" },
            ]}
            aria-label="用户角色"
          />
        </Field>
        <Show when={errorMessage()}>
          <InlineError>{errorMessage()}</InlineError>
        </Show>
      </div>
    </Dialog>
  )
}
