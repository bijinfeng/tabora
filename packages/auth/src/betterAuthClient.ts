import { mapAuthError, type AuthError } from "./errors"

const TOKEN_KEY = "tabora.auth.token"

export type AuthStorage = {
  getItem(key: string): Promise<string | null>
  setItem(key: string, value: string): Promise<void>
  removeItem(key: string): Promise<void>
}

/** 中性会话形状：jwt 承载 bearer token，供同步网关作 Authorization 头。 */
export type AuthSession = {
  jwt: string
  userId?: string
  expiresAt?: number
}

export type AuthUser = {
  id: string
  email?: string
  name?: string
}

/** 认证客户端接口，同步/账号插件只依赖此接口，不感知具体后端。 */
export type AuthClient = {
  register(email: string, password: string): Promise<void>
  login(email: string, password: string): Promise<AuthSession>
  logout(): Promise<void>
  getSession(): Promise<AuthSession | null>
  getCurrentUser(): Promise<AuthUser | null>
  requestPasswordReset(email: string): Promise<void>
  resetPassword(code: string, newPassword: string): Promise<void>
}

export type BetterAuthClientConfig = {
  apiBaseUrl: string
  storage: AuthStorage
}

function networkError(): AuthError {
  return { code: "NETWORK_ERROR", message: "网络异常，请稍后重试" }
}

/**
 * better-auth 版认证客户端。
 * 登录/注册后从响应头 set-auth-token 取 bearer token 存本地；
 * getSession 返回 { jwt } 供同步网关作 Authorization: Bearer。
 */
export function createBetterAuthClient(config: BetterAuthClientConfig): AuthClient {
  const base = config.apiBaseUrl.replace(/\/$/, "")

  async function readToken(): Promise<string | null> {
    return config.storage.getItem(TOKEN_KEY)
  }

  async function post(
    path: string,
    body: unknown,
    token?: string,
  ): Promise<{ body: unknown; token: string | null }> {
    let response: Response
    try {
      response = await fetch(`${base}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      })
    } catch {
      throw networkError()
    }
    let parsed: unknown = null
    if (response.status !== 204) {
      try {
        parsed = await response.json()
      } catch {
        parsed = null
      }
    }
    if (!response.ok) throw mapAuthError(response.status, parsed)
    return { body: parsed, token: response.headers.get("set-auth-token") }
  }

  return {
    async register(email, password) {
      const result = await post("/api/auth/sign-up/email", {
        email,
        password,
        name: email.split("@")[0] || "用户",
      })
      if (result.token) await config.storage.setItem(TOKEN_KEY, result.token)
    },

    async login(email, password) {
      const result = await post("/api/auth/sign-in/email", { email, password })
      if (!result.token) throw mapAuthError(401, null)
      await config.storage.setItem(TOKEN_KEY, result.token)
      const user = (result.body as { user?: { id?: string } })?.user
      return { jwt: result.token, ...(user?.id ? { userId: user.id } : {}) }
    },

    async logout() {
      await config.storage.removeItem(TOKEN_KEY)
    },

    async getSession() {
      const token = await readToken()
      return token ? { jwt: token } : null
    },

    async getCurrentUser() {
      const token = await readToken()
      if (!token) return null
      let response: Response
      try {
        response = await fetch(`${base}/api/auth/get-session`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      } catch {
        throw networkError()
      }
      if (!response.ok) {
        if (response.status === 401) await config.storage.removeItem(TOKEN_KEY)
        return null
      }
      const data = (await response.json().catch(() => null)) as {
        user?: { id: string; email?: string; name?: string }
      } | null
      if (!data?.user) {
        await config.storage.removeItem(TOKEN_KEY)
        return null
      }
      return {
        id: data.user.id,
        ...(data.user.email ? { email: data.user.email } : {}),
        ...(data.user.name ? { name: data.user.name } : {}),
      }
    },

    async requestPasswordReset(email) {
      await post("/api/auth/request-password-reset", {
        email,
        redirectTo: `${base}/reset-password`,
      })
    },

    async resetPassword(code, newPassword) {
      try {
        await post("/api/auth/reset-password", { token: code, newPassword })
      } catch (error) {
        const authError = error as AuthError
        if (authError.code === "INVALID_PAYLOAD" || authError.code === "UNKNOWN") {
          throw { code: "RESET_INVALID", message: "验证码错误或已过期" } satisfies AuthError
        }
        throw error
      }
    },
  }
}
