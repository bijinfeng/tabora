import * as stylex from "@stylexjs/stylex"
import { Dialog } from "@tabora/ui"
import { Button } from "@tabora/ui/button"
import { Field } from "@tabora/ui/field"
import { InlineError } from "@tabora/ui/inline-error"
import { Input } from "@tabora/ui/input"
import { Select } from "@tabora/ui/select"
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
  const [error, setError] = createSignal<string | null>(null)
  const [submitting, setSubmitting] = createSignal(false)

  function reset() {
    setEmail("")
    setName("")
    setPassword("")
    setRole("user")
    setError(null)
  }

  async function handleSubmit() {
    if (submitting()) return
    if (password().length < MIN_PASSWORD) {
      setError(`密码至少 ${MIN_PASSWORD} 位`)
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await createUser({
        email: email().trim(),
        password: password(),
        name: name().trim() || email().split("@")[0] || "User",
        role: role(),
      })
      reset()
      props.onCreated()
      props.onClose()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

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
          <Button variant="primary" loading={submitting()} onClick={handleSubmit}>
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
        <Show when={error()}>
          <InlineError>{error()}</InlineError>
        </Show>
      </div>
    </Dialog>
  )
}
