import type { AuthStorage } from "@tabora/host-adapters"
import { mapDirectusError, type AuthError } from "./errors"

const SESSION_KEY = "tabora.auth.session"
const REFRESH_LEEWAY_MS = 30_000

export type DirectusSession = {
  userId: string
  accessToken: string
  refreshToken: string
  expiresAt: number
  sessionId: string
}

export type CurrentUser = {
  id: string
  email?: string
  first_name?: string
  last_name?: string
  avatar?: string
  status?: string
}

export type DirectusAuthClientConfig = {
  apiBaseUrl: string
  storage: AuthStorage
}

export type DirectusAuthClient = {
  register(email: string, password: string): Promise<void>
  login(email: string, password: string): Promise<DirectusSession>
  logout(): Promise<void>
  getSession(): Promise<DirectusSession | null>
  refreshSession(): Promise<DirectusSession | null>
  getCurrentUser(): Promise<CurrentUser | null>
  requestPasswordReset(email: string): Promise<void>
  resetPassword(code: string, newPassword: string): Promise<void>
}

function networkError(): AuthError {
  return { code: "NETWORK_ERROR", message: "网络异常，请稍后重试" }
}

type LoginResponseData = {
  access_token: string
  refresh_token: string
  expires: number
  session_id: string
}

export function createDirectusAuthClient(config: DirectusAuthClientConfig): DirectusAuthClient {
  const base = config.apiBaseUrl.replace(/\/$/, "")

  async function request<T>(
    path: string,
    body: unknown,
    accessToken?: string,
  ): Promise<{ status: number; data: T | null }> {
    let response: Response
    try {
      response = await fetch(`${base}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
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

    if (!response.ok) {
      throw mapDirectusError(response.status, parsed)
    }

    return { status: response.status, data: (parsed as { data?: T })?.data ?? null }
  }

  async function get<T>(path: string, accessToken: string): Promise<T | null> {
    let response: Response
    try {
      response = await fetch(`${base}${path}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
    } catch {
      throw networkError()
    }
    let parsed: unknown = null
    try {
      parsed = await response.json()
    } catch {
      parsed = null
    }
    if (!response.ok) {
      throw mapDirectusError(response.status, parsed)
    }
    return (parsed as { data?: T })?.data ?? null
  }

  function toSession(data: LoginResponseData): DirectusSession {
    return {
      userId: "",
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires,
      sessionId: data.session_id,
    }
  }

  async function readStored(): Promise<DirectusSession | null> {
    const raw = await config.storage.getItem(SESSION_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as DirectusSession
    } catch {
      return null
    }
  }

  async function writeStored(session: DirectusSession): Promise<void> {
    await config.storage.setItem(SESSION_KEY, JSON.stringify(session))
  }

  async function clearStored(): Promise<void> {
    await config.storage.removeItem(SESSION_KEY)
  }

  async function refreshSession(): Promise<DirectusSession | null> {
    const current = await readStored()
    if (!current) return null
    try {
      const { data } = await request<LoginResponseData>("/auth/refresh", {
        refresh_token: current.refreshToken,
      })
      if (!data) {
        await clearStored()
        return null
      }
      const next = toSession(data)
      await writeStored(next)
      return next
    } catch {
      await clearStored()
      return null
    }
  }

  return {
    async register(email, password) {
      await request<never>("/auth/register", { email, password })
    },

    async login(email, password) {
      const { data } = await request<LoginResponseData>("/auth/login", { email, password })
      if (!data) {
        throw { code: "UNKNOWN", message: "登录失败，请稍后重试" } satisfies AuthError
      }
      const session = toSession(data)
      await writeStored(session)
      return session
    },

    async logout() {
      const current = await readStored()
      if (current) {
        try {
          await request<never>("/auth/logout", { refresh_token: current.refreshToken })
        } catch {
          // 即使后端登出失败也清本地会话
        }
      }
      await clearStored()
    },

    async getSession() {
      const current = await readStored()
      if (!current) return null
      if (current.expiresAt - REFRESH_LEEWAY_MS > Date.now()) {
        return current
      }
      return refreshSession()
    },

    refreshSession,

    async getCurrentUser() {
      const session = await this.getSession()
      if (!session) return null
      return get<CurrentUser>("/auth/session", session.accessToken)
    },

    async requestPasswordReset(email) {
      await request<never>("/auth/send-code", { email })
    },

    async resetPassword(code, newPassword) {
      try {
        await request<never>("/auth/verify-code", { code, password: newPassword })
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
