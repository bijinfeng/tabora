import { Button } from "@tabora/ui/button"
import { Form } from "@tabora/ui/form"
import { InlineError } from "@tabora/ui/inline-error"
import { Input } from "@tabora/ui/input"
import { createSignal, Show } from "solid-js"

import { AuthCard } from "./AuthCard"
import { authClient } from "./authClient"
import { toAuthMessage } from "./errors"

const MIN_PASSWORD = 8

type RegisterFormData = {
  email: string
  password: string
  confirm: string
}

export function RegisterPage(props: { onSuccess: () => void }) {
  const [submitting, setSubmitting] = createSignal(false)
  const [error, setError] = createSignal<string | null>(null)

  const handleSubmit = async (values: RegisterFormData) => {
    setSubmitting(true)
    setError(null)
    try {
      const email = values.email.trim()
      // better-auth client 默认不抛错，失败信息在返回值的 error 上。
      const { error: signUpError } = await authClient.signUp.email({
        email,
        password: values.password,
        name: email.split("@")[0] || "Admin",
      })
      if (signUpError) {
        setError(toAuthMessage(signUpError))
        return
      }
      // requireEmailVerification 开启时 sign-up 不建会话（token 为 null、不下发 cookie），
      // 直接跳首页会被 _authed 守卫弹回登录页。这里显式登录换取会话。
      const { error: signInError } = await authClient.signIn.email({
        email,
        password: values.password,
      })
      if (signInError) {
        setError(toAuthMessage(signInError))
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
    <AuthCard title="初始化管理员" subtitle="首次部署尚无管理员，创建第一个管理员账号以进入后台。">
      <Form<RegisterFormData>
        defaultValues={{ email: "", password: "", confirm: "" }}
        onSubmit={handleSubmit}
      >
        {(form) => {
          const canSubmit = form.useSelector((state) => state.canSubmit)

          return (
            <>
              <Form.Item
                name="email"
                label="邮箱"
                htmlFor="setup-email"
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
                    id="setup-email"
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
                htmlFor="setup-password"
                required
                validators={{
                  onChange: ({ value }) => {
                    if (!value) return "密码不能为空"
                    if (value.length < MIN_PASSWORD) return `密码至少需要 ${MIN_PASSWORD} 位字符`
                    return undefined
                  },
                }}
              >
                {(field) => (
                  <Input
                    id="setup-password"
                    type="password"
                    value={field().state.value}
                    onInput={(value) => field().handleChange(value)}
                    onBlur={field().handleBlur}
                    invalid={field().state.meta.errors.length > 0}
                    placeholder="设置密码"
                    autocomplete="new-password"
                  />
                )}
              </Form.Item>

              <Form.Item
                name="confirm"
                label="确认密码"
                htmlFor="setup-confirm"
                required
                validators={{
                  onChange: ({ value, fieldApi }) => {
                    if (!value) return "请再次输入密码"
                    if (value !== fieldApi.form.state.values.password) return "两次输入的密码不一致"
                    return undefined
                  },
                }}
              >
                {(field) => (
                  <Input
                    id="setup-confirm"
                    type="password"
                    value={field().state.value}
                    onInput={(value) => field().handleChange(value)}
                    onBlur={field().handleBlur}
                    invalid={field().state.meta.errors.length > 0}
                    placeholder="再次输入密码"
                    autocomplete="new-password"
                  />
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
                    创建管理员
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
