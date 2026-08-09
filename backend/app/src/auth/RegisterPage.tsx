import * as stylex from "@stylexjs/stylex"
import { Button } from "@tabora/ui/button"
import { Field } from "@tabora/ui/field"
import { InlineError } from "@tabora/ui/inline-error"
import { Input } from "@tabora/ui/input"
import { createSignal } from "solid-js"

import { AuthCard } from "./AuthCard"
import { styles } from "./auth.styles"
import { authClient } from "./authClient"
import { createAuthSubmit } from "./createAuthSubmit"

const MIN_PASSWORD = 8

export function RegisterPage(props: { onSuccess: () => void }) {
  const [email, setEmail] = createSignal("")
  const [password, setPassword] = createSignal("")
  const [confirm, setConfirm] = createSignal("")
  const { error, submitting, handleSubmit } = createAuthSubmit({
    validate: () => {
      if (password().length < MIN_PASSWORD) return `密码至少 ${MIN_PASSWORD} 位`
      if (password() !== confirm()) return "两次输入的密码不一致"
      return null
    },
    action: () =>
      authClient.signUp.email({
        email: email().trim(),
        password: password(),
        name: email().split("@")[0] || "Admin",
      }),
    onSuccess: () => props.onSuccess(),
  })

  return (
    <AuthCard title="初始化管理员" subtitle="首次部署尚无管理员，创建第一个管理员账号以进入后台。">
      <form {...stylex.attrs(styles.form)} onSubmit={handleSubmit} novalidate>
        <Field label="邮箱" htmlFor="setup-email">
          <Input
            id="setup-email"
            type="email"
            value={email()}
            onInput={setEmail}
            placeholder="admin@example.com"
            autocomplete="username"
            required
          />
        </Field>
        <Field label="密码" htmlFor="setup-password" helper={`至少 ${MIN_PASSWORD} 位`}>
          <Input
            id="setup-password"
            type="password"
            value={password()}
            onInput={setPassword}
            placeholder="设置密码"
            invalid={error() !== null}
            autocomplete="new-password"
            required
          />
        </Field>
        <Field label="确认密码" htmlFor="setup-confirm">
          <Input
            id="setup-confirm"
            type="password"
            value={confirm()}
            onInput={setConfirm}
            placeholder="再次输入密码"
            invalid={error() !== null}
            autocomplete="new-password"
            required
          />
        </Field>
        {error() && <InlineError>{error()}</InlineError>}
        <Button type="submit" variant="primary" fullWidth loading={submitting()}>
          创建管理员
        </Button>
      </form>
    </AuthCard>
  )
}
