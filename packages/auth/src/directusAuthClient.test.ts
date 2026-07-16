import { beforeEach, describe, expect, it, vi } from "vitest"
import { createDirectusAuthClient } from "./directusAuthClient"
import type { AuthStorage } from "@tabora/host-adapters"

function memoryStorage(): AuthStorage {
  const map = new Map<string, string>()
  return {
    async getItem(k) {
      return map.get(k) ?? null
    },
    async setItem(k, v) {
      map.set(k, v)
    },
    async removeItem(k) {
      map.delete(k)
    },
  }
}

const BASE = "http://api.test/tabora"

function loginBody() {
  return {
    data: {
      access_token: "acc",
      refresh_token: "ref",
      expires: 900_000,
      session_id: "sess-1",
    },
  }
}

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

describe("createDirectusAuthClient", () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)
  })

  it("login stores session and returns it", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, loginBody()))
    const storage = memoryStorage()
    const client = createDirectusAuthClient({ apiBaseUrl: BASE, storage })

    const session = await client.login("a@test.com", "pw12345678")

    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE}/auth/login`,
      expect.objectContaining({ method: "POST" }),
    )
    expect(session.sessionId).toBe("sess-1")
    expect(session.accessToken).toBe("acc")
    const stored = await storage.getItem("tabora.auth.session")
    expect(stored).toContain("sess-1")
  })

  it("login maps 401 to INVALID_CREDENTIALS thrown error", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(401, { errors: [{ extensions: { code: "INVALID_CREDENTIALS" } }] }),
    )
    const client = createDirectusAuthClient({ apiBaseUrl: BASE, storage: memoryStorage() })

    await expect(client.login("a@test.com", "bad")).rejects.toMatchObject({
      code: "INVALID_CREDENTIALS",
    })
  })

  it("register posts credentials and resolves on 204", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }))
    const client = createDirectusAuthClient({ apiBaseUrl: BASE, storage: memoryStorage() })

    await expect(client.register("a@test.com", "pw12345678")).resolves.toBeUndefined()
    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE}/auth/register`,
      expect.objectContaining({ method: "POST" }),
    )
  })

  it("getSession returns cached session when not expired", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, loginBody()))
    const storage = memoryStorage()
    const client = createDirectusAuthClient({ apiBaseUrl: BASE, storage })
    await client.login("a@test.com", "pw12345678")
    fetchMock.mockClear()

    const session = await client.getSession()

    expect(session?.sessionId).toBe("sess-1")
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("getSession auto-refreshes an expired session", async () => {
    const storage = memoryStorage()
    await storage.setItem(
      "tabora.auth.session",
      JSON.stringify({
        userId: "",
        accessToken: "old",
        refreshToken: "ref",
        expiresAt: 1,
        sessionId: "sess-old",
      }),
    )
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, {
        data: {
          access_token: "new",
          refresh_token: "ref2",
          expires: 900_000,
          session_id: "sess-2",
        },
      }),
    )
    const client = createDirectusAuthClient({ apiBaseUrl: BASE, storage })

    const session = await client.getSession()

    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE}/auth/refresh`,
      expect.objectContaining({ method: "POST" }),
    )
    expect(session?.accessToken).toBe("new")
    expect(session?.sessionId).toBe("sess-2")
  })

  it("getSession clears session and returns null when refresh fails", async () => {
    const storage = memoryStorage()
    await storage.setItem(
      "tabora.auth.session",
      JSON.stringify({
        userId: "",
        accessToken: "old",
        refreshToken: "ref",
        expiresAt: 1,
        sessionId: "s",
      }),
    )
    fetchMock.mockResolvedValueOnce(
      jsonResponse(401, { errors: [{ extensions: { code: "INVALID_CREDENTIALS" } }] }),
    )
    const client = createDirectusAuthClient({ apiBaseUrl: BASE, storage })

    const session = await client.getSession()

    expect(session).toBeNull()
    expect(await storage.getItem("tabora.auth.session")).toBeNull()
  })

  it("logout posts refresh_token and clears storage", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, loginBody()))
    const storage = memoryStorage()
    const client = createDirectusAuthClient({ apiBaseUrl: BASE, storage })
    await client.login("a@test.com", "pw12345678")
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }))

    await client.logout()

    expect(fetchMock).toHaveBeenLastCalledWith(
      `${BASE}/auth/logout`,
      expect.objectContaining({ method: "POST" }),
    )
    expect(await storage.getItem("tabora.auth.session")).toBeNull()
  })

  it("requestPasswordReset posts email to send-code", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }))
    const client = createDirectusAuthClient({ apiBaseUrl: BASE, storage: memoryStorage() })

    await client.requestPasswordReset("a@test.com")

    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE}/auth/send-code`,
      expect.objectContaining({ method: "POST" }),
    )
  })

  it("resetPassword posts code and password to verify-code", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }))
    const client = createDirectusAuthClient({ apiBaseUrl: BASE, storage: memoryStorage() })

    await client.resetPassword("123456", "pw87654321")

    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE}/auth/verify-code`,
      expect.objectContaining({ method: "POST" }),
    )
  })

  it("returns NETWORK_ERROR when fetch throws", async () => {
    fetchMock.mockRejectedValueOnce(new Error("boom"))
    const client = createDirectusAuthClient({ apiBaseUrl: BASE, storage: memoryStorage() })

    await expect(client.login("a@test.com", "pw12345678")).rejects.toMatchObject({
      code: "NETWORK_ERROR",
    })
  })
})
