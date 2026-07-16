export type AuthErrorCode =
  | "NETWORK_ERROR"
  | "INVALID_CREDENTIALS"
  | "INVALID_PAYLOAD"
  | "EMAIL_IN_USE"
  | "RESET_INVALID"
  | "UNKNOWN"

export type AuthError = { code: AuthErrorCode; message: string }

export const AUTH_ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  NETWORK_ERROR: "网络异常，请稍后重试",
  INVALID_CREDENTIALS: "邮箱或密码错误",
  INVALID_PAYLOAD: "输入格式不正确",
  EMAIL_IN_USE: "该邮箱已注册",
  RESET_INVALID: "验证码错误或已过期",
  UNKNOWN: "操作失败，请稍后重试",
}

type DirectusErrorBody = {
  errors?: Array<{ extensions?: { code?: string } }>
}

/**
 * 将 Directus API 的错误响应归一化为统一的 AuthError。
 *
 * 优先按响应体中的 directusCode 匹配已知错误码；若都不匹配，再用
 * HTTP status 401 兜底为 INVALID_CREDENTIALS，其余情况归为 UNKNOWN。
 *
 * 注意：NETWORK_ERROR 由调用方在 fetch 失败（无 HTTP 响应）时自行构造，
 * RESET_INVALID 由密码重置业务逻辑抛出，二者都不在本函数的映射范围内。
 */
export function mapDirectusError(status: number, body: unknown): AuthError {
  const directusCode = (body as DirectusErrorBody)?.errors?.[0]?.extensions?.code
  let code: AuthErrorCode = "UNKNOWN"

  if (directusCode === "INVALID_CREDENTIALS") {
    code = "INVALID_CREDENTIALS"
  } else if (directusCode === "RECORD_NOT_UNIQUE") {
    code = "EMAIL_IN_USE"
  } else if (directusCode === "INVALID_PAYLOAD") {
    code = "INVALID_PAYLOAD"
  } else if (status === 401) {
    code = "INVALID_CREDENTIALS"
  }

  return { code, message: AUTH_ERROR_MESSAGES[code] }
}
