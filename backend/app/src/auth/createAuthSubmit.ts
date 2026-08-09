import { createSignal, type Accessor } from "solid-js"

import { toAuthMessage } from "./errors"

/**
 * 认证表单提交生命周期：登录与初始化管理员共用。
 * 处理重复提交拦截、可选的本地校验、错误归一化与提交态。
 */
export function createAuthSubmit(options: {
  validate?: () => string | null
  action: () => Promise<unknown>
  onSuccess: () => void
}): {
  error: Accessor<string | null>
  submitting: Accessor<boolean>
  handleSubmit: (event: SubmitEvent) => Promise<void>
} {
  const [error, setError] = createSignal<string | null>(null)
  const [submitting, setSubmitting] = createSignal(false)

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault()
    if (submitting()) return
    const localError = options.validate?.() ?? null
    if (localError) {
      setError(localError)
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await options.action()
      options.onSuccess()
    } catch (err) {
      setError(toAuthMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return { error, submitting, handleSubmit }
}
