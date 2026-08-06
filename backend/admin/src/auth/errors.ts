/** better-auth client 错误的最小形状。 */
export type AuthErrorLike = {
  message?: string | undefined
  status?: number | undefined
  code?: string | undefined
}

/** 把 better-auth 返回的错误归一化为中文提示。 */
export function toAuthMessage(error: AuthErrorLike | null | undefined): string {
  if (!error) return "操作失败，请稍后重试"
  const status = error.status
  const raw = error.message ?? ""

  if (status === 0 || /fetch|network/i.test(raw)) return "无法连接管理服务，请稍后重试"
  if (status === 401 || status === 400) return "邮箱或密码错误"
  if (status === 403) return raw || "注册已关闭，请联系管理员"
  if (/already|exist|taken/i.test(raw)) return "该邮箱已被占用"
  return raw || "操作失败，请稍后重试"
}
