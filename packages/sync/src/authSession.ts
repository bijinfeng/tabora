import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import type { AuthStorage } from "@tabora/host-adapters"

export type AuthSession = {
  accountId: string
  accessToken: string
  refreshToken: string
  expiresAt: number
}

export type AuthSessionManager = {
  signInWithOtp(email: string, shouldCreateUser?: boolean): Promise<void>
  verifyOtp(email: string, token: string): Promise<AuthSession>
  getSession(): Promise<AuthSession | null>
  signOut(): Promise<void>
  refreshSession(): Promise<AuthSession | null>
}

export type AuthSessionConfig = {
  supabaseUrl: string
  supabaseAnonKey: string
  storage: AuthStorage
}

/**
 * Create an auth session manager with Email OTP and custom storage.
 * Storage adapter is injected by host-adapters to handle platform differences
 * (localStorage for web, chrome.storage.local for MV3 extensions).
 */
export function createAuthSessionManager(config: AuthSessionConfig): AuthSessionManager {
  const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      storage: config.storage,
      persistSession: true,
      autoRefreshToken: true,
    },
  })

  return {
    async signInWithOtp(email, shouldCreateUser = true) {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser },
      })

      if (error) {
        throw new Error(`Failed to send OTP: ${error.message}`)
      }
    },

    async verifyOtp(email, token) {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "email",
      })

      if (error || !data.session) {
        throw new Error(`Failed to verify OTP: ${error?.message ?? "No session"}`)
      }

      return {
        accountId: data.user!.id,
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at!,
      }
    },

    async getSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        return null
      }

      return {
        accountId: session.user.id,
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        expiresAt: session.expires_at!,
      }
    },

    async signOut() {
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw new Error(`Failed to sign out: ${error.message}`)
      }
    },

    async refreshSession() {
      const {
        data: { session },
        error,
      } = await supabase.auth.refreshSession()

      if (error || !session) {
        return null
      }

      return {
        accountId: session.user.id,
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        expiresAt: session.expires_at!,
      }
    },
  }
}

/**
 * Get the Supabase client for direct access (testing/debugging only).
 * Normal code should use AuthSessionManager methods.
 */
export function getSupabaseClient(config: AuthSessionConfig): SupabaseClient {
  return createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      storage: config.storage,
      persistSession: true,
      autoRefreshToken: true,
    },
  })
}
