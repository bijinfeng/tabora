/** better-auth client 错误的最小形状。 */
type AuthErrorLike = {
  message?: string | undefined
  status?: number | undefined
  code?: string | undefined
}

function isAuthErrorLike(error: unknown): error is AuthErrorLike {
  return typeof error === "object" && error !== null
}

/** 把 better-auth 返回的错误归一化为中文提示。 */
export function toAuthMessage(error: unknown): string {
  if (!isAuthErrorLike(error)) return "操作失败，请稍后重试"
  const status = error.status
  const raw = error.message ?? ""

  if (status === 0 || /fetch|network/i.test(raw)) return "无法连接管理服务，请稍后重试"
  if (error.code === "EMAIL_NOT_VERIFIED") return "邮箱尚未验证，请先完成邮箱验证后再登录"
  if (status === 401 || status === 400) return "邮箱或密码错误"
  if (status === 403) return raw || "注册已关闭，请联系管理员"
  if (/already|exist|taken/i.test(raw)) return "该邮箱已被占用"
  return raw || "操作失败，请稍后重试"
}
