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

export function mapDirectusError(status: number, body: unknown): AuthError {
  const directusCode = (body as DirectusErrorBody)?.errors?.[0]?.extensions?.code
  let code: AuthErrorCode = "UNKNOWN"

  if (directusCode === "INVALID_CREDENTIALS" || status === 401) {
    code = "INVALID_CREDENTIALS"
  } else if (directusCode === "RECORD_NOT_UNIQUE") {
    code = "EMAIL_IN_USE"
  } else if (directusCode === "INVALID_PAYLOAD") {
    code = "INVALID_PAYLOAD"
  }

  return { code, message: AUTH_ERROR_MESSAGES[code] }
}
