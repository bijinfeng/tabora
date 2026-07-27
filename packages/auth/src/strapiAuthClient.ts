import type { AuthStorage } from "@tabora/host-adapters"
import { mapStrapiError, type AuthError } from "./errors"

const SESSION_KEY = "tabora.auth.session"

export type StrapiSession = {
  jwt: string
  userId?: number
  expiresAt?: number
}

export type CurrentUser = {
  id: number
  email?: string
  username?: string
}

export type StrapiAuthClientConfig = {
  apiBaseUrl: string
  storage: AuthStorage
}

export type StrapiAuthClient = {
  register(email: string, password: string): Promise<void>
  login(email: string, password: string): Promise<StrapiSession>
  logout(): Promise<void>
  getSession(): Promise<StrapiSession | null>
  getCurrentUser(): Promise<CurrentUser | null>
  requestPasswordReset(email: string): Promise<void>
  resetPassword(code: string, newPassword: string): Promise<void>
}

function networkError(): AuthError {
  return { code: "NETWORK_ERROR", message: "网络异常，请稍后重试" }
}

type LoginResponse = { jwt: string; user: { id: number } }

/** 从 JWT 的 exp 声明解出过期毫秒时间戳；解析失败返回 undefined。 */
function readJwtExpiry(jwt: string): number | undefined {
  const segments = jwt.split(".")
  const payloadSegment = segments[1]
  if (!payloadSegment) return undefined
  try {
    const payloadJson = atob(payloadSegment.replace(/-/g, "+").replace(/_/g, "/"))
    const payload = JSON.parse(payloadJson) as { exp?: number }
    return typeof payload.exp === "number" ? payload.exp * 1000 : undefined
  } catch {
    return undefined
  }
}

export function createStrapiAuthClient(config: StrapiAuthClientConfig): StrapiAuthClient {
  const base = config.apiBaseUrl.replace(/\/$/, "")

  async function post<T>(path: string, body: unknown, jwt?: string): Promise<T> {
    let response: Response
    try {
      response = await fetch(`${base}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
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

    if (!response.ok) throw mapStrapiError(response.status, parsed)
    return parsed as T
  }

  async function readStored(): Promise<StrapiSession | null> {
    const raw = await config.storage.getItem(SESSION_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as StrapiSession
    } catch {
      return null
    }
  }

  async function writeStored(session: StrapiSession): Promise<void> {
    await config.storage.setItem(SESSION_KEY, JSON.stringify(session))
  }

  async function clearStored(): Promise<void> {
    await config.storage.removeItem(SESSION_KEY)
  }

  return {
    async register(email, password) {
      await post<LoginResponse>("/api/auth/local/register", {
        username: email,
        email,
        password,
      })
    },

    async login(email, password) {
      const data = await post<LoginResponse>("/api/auth/local", {
        identifier: email,
        password,
      })
      const expiresAt = readJwtExpiry(data.jwt)
      const session: StrapiSession = {
        jwt: data.jwt,
        userId: data.user.id,
        ...(expiresAt !== undefined ? { expiresAt } : {}),
      }
      await writeStored(session)
      return session
    },

    async logout() {
      // 纯 JWT：仅清本地会话，不打后端
      await clearStored()
    },

    getSession() {
      return readStored()
    },

    async getCurrentUser() {
      const session = await readStored()
      if (!session) return null
      let response: Response
      try {
        response = await fetch(`${base}/api/users/me`, {
          headers: { Authorization: `Bearer ${session.jwt}` },
        })
      } catch {
        throw networkError()
      }
      if (!response.ok) {
        if (response.status === 401) await clearStored()
        return null
      }
      return (await response.json()) as CurrentUser
    },

    async requestPasswordReset(email) {
      await post("/api/auth/forgot-password", { email })
    },

    async resetPassword(code, newPassword) {
      try {
        await post("/api/auth/reset-password", {
          code,
          password: newPassword,
          passwordConfirmation: newPassword,
        })
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
