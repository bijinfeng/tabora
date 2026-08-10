import * as stylex from "@stylexjs/stylex"
import { Button } from "@tabora/ui/button"
import { Checkbox } from "@tabora/ui/checkbox"
import { Form } from "@tabora/ui/form"
import { InlineError } from "@tabora/ui/inline-error"
import { Input } from "@tabora/ui/input"
import { createSignal, Show } from "solid-js"

import { AuthCard } from "./AuthCard"
import { styles } from "./auth.styles"
import { authClient } from "./authClient"
import { toAuthMessage } from "./errors"

type LoginFormData = {
  email: string
  password: string
  remember: boolean
}

export function LoginPage(props: { onSuccess: () => void }) {
  const [submitting, setSubmitting] = createSignal(false)
  const [error, setError] = createSignal<string | null>(null)

  const handleSubmit = async (values: LoginFormData) => {
    setSubmitting(true)
    setError(null)
    try {
      // better-auth client 默认不抛错，失败信息在返回值的 error 上。
      const { error: authError } = await authClient.signIn.email({
        email: values.email.trim(),
        password: values.password,
        rememberMe: values.remember,
      })
      if (authError) {
        setError(toAuthMessage(authError))
        return
      }
      props.onSuccess()
    } catch (err) {
      setError(toAuthMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthCard title="登录管理后台" subtitle="使用管理员账号登录，管理用户、同步记录与附件。">
      <Form<LoginFormData>
        defaultValues={{ email: "", password: "", remember: true }}
        onSubmit={handleSubmit}
      >
        {(form) => {
          const canSubmit = form.useSelector((state) => state.canSubmit)

          return (
            <>
              <Form.Item
                name="email"
                label="邮箱"
                htmlFor="admin-email"
                required
                validators={{
                  onChange: ({ value }) => {
                    if (!value) return "邮箱不能为空"
                    if (!value.includes("@")) return "请输入有效的邮箱地址"
                    return undefined
                  },
                }}
              >
                {(field) => (
                  <Input
                    id="admin-email"
                    type="email"
                    value={field().state.value}
                    onInput={(value) => field().handleChange(value)}
                    onBlur={field().handleBlur}
                    invalid={field().state.meta.errors.length > 0}
                    placeholder="admin@example.com"
                    autocomplete="username"
                  />
                )}
              </Form.Item>

              <Form.Item
                name="password"
                label="密码"
                htmlFor="admin-password"
                required
                validators={{
                  onChange: ({ value }) => (value ? undefined : "密码不能为空"),
                }}
              >
                {(field) => (
                  <Input
                    id="admin-password"
                    type="password"
                    value={field().state.value}
                    onInput={(value) => field().handleChange(value)}
                    onBlur={field().handleBlur}
                    invalid={field().state.meta.errors.length > 0}
                    placeholder="输入密码"
                    autocomplete="current-password"
                  />
                )}
              </Form.Item>

              <Form.Item name="remember">
                {(field) => (
                  <div {...stylex.attrs(styles.metaRow)}>
                    <Checkbox
                      checked={field().state.value}
                      onChange={(checked) => field().handleChange(checked)}
                      label="记住我"
                    />
                    <button type="button" {...stylex.attrs(styles.linkButton)}>
                      忘记密码？
                    </button>
                  </div>
                )}
              </Form.Item>

              <Show when={error()}>{(message) => <InlineError>{message()}</InlineError>}</Show>

              <Form.Item>
                {() => (
                  <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    loading={submitting()}
                    disabled={!canSubmit() || submitting()}
                  >
                    登录
                  </Button>
                )}
              </Form.Item>
            </>
          )
        }}
      </Form>
    </AuthCard>
  )
}
