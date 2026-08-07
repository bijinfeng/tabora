import * as stylex from "@stylexjs/stylex"
import { Button } from "@tabora/ui/button"
import { Checkbox } from "@tabora/ui/checkbox"
import { Field } from "@tabora/ui/field"
import { InlineError } from "@tabora/ui/inline-error"
import { Input } from "@tabora/ui/input"
import { createSignal } from "solid-js"

import { AuthCard } from "./AuthCard"
import { styles } from "./auth.styles"
import { authClient } from "./authClient"
import { toAuthMessage } from "./errors"

export function LoginPage(props: { onSuccess: () => void }) {
  const [email, setEmail] = createSignal("")
  const [password, setPassword] = createSignal("")
  const [remember, setRemember] = createSignal(true)
  const [error, setError] = createSignal<string | null>(null)
  const [submitting, setSubmitting] = createSignal(false)

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault()
    if (submitting()) return
    setError(null)
    setSubmitting(true)
    try {
      await authClient.signIn.email({
        email: email().trim(),
        password: password(),
        rememberMe: remember(),
      })
      props.onSuccess()
    } catch (err) {
      setError(toAuthMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthCard title="登录管理后台" subtitle="使用管理员账号登录，管理用户、同步记录与附件。">
      <form {...stylex.attrs(styles.form)} onSubmit={handleSubmit} novalidate>
        <Field label="邮箱" htmlFor="admin-email">
          <Input
            id="admin-email"
            type="email"
            value={email()}
            onInput={setEmail}
            placeholder="admin@example.com"
            invalid={error() !== null}
            autocomplete="username"
            required
          />
        </Field>
        <Field label="密码" htmlFor="admin-password">
          <Input
            id="admin-password"
            type="password"
            value={password()}
            onInput={setPassword}
            placeholder="输入密码"
            invalid={error() !== null}
            autocomplete="current-password"
            required
          />
        </Field>
        <div {...stylex.attrs(styles.metaRow)}>
          <Checkbox checked={remember()} onChange={setRemember} label="记住我" />
          <button type="button" {...stylex.attrs(styles.linkButton)}>
            忘记密码？
          </button>
        </div>
        {error() && <InlineError>{error()}</InlineError>}
        <Button type="submit" variant="primary" fullWidth loading={submitting()}>
          登录
        </Button>
      </form>
    </AuthCard>
  )
}
