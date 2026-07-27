import { beforeEach, describe, expect, it, vi } from "vitest"
import { createStrapiAuthClient } from "./strapiAuthClient"
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

const BASE = "http://api.test"

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

describe("createStrapiAuthClient", () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)
  })

  it("login posts identifier to /api/auth/local and stores jwt session", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { jwt: "jwt-1", user: { id: 1 } }))
    const storage = memoryStorage()
    const client = createStrapiAuthClient({ apiBaseUrl: BASE, storage })

    const session = await client.login("a@test.com", "pw12345678")

    expect(session.jwt).toBe("jwt-1")
    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe(`${BASE}/api/auth/local`)
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      identifier: "a@test.com",
      password: "pw12345678",
    })
    const stored = await storage.getItem("tabora.auth.session")
    expect(stored).toContain("jwt-1")
  })

  it("login maps 400 to INVALID_CREDENTIALS thrown error", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(400, {
        error: { name: "ValidationError", message: "Invalid identifier or password" },
      }),
    )
    const client = createStrapiAuthClient({ apiBaseUrl: BASE, storage: memoryStorage() })

    await expect(client.login("a@test.com", "bad")).rejects.toMatchObject({
      code: "INVALID_PAYLOAD",
    })
  })

  it("register posts username+email+password to /api/auth/local/register", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { jwt: "j", user: { id: 2 } }))
    const client = createStrapiAuthClient({ apiBaseUrl: BASE, storage: memoryStorage() })

    await client.register("a@test.com", "pw12345678")

    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe(`${BASE}/api/auth/local/register`)
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      username: "a@test.com",
      email: "a@test.com",
      password: "pw12345678",
    })
  })

  it("logout clears local session without calling backend", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { jwt: "j", user: { id: 1 } }))
    const storage = memoryStorage()
    const client = createStrapiAuthClient({ apiBaseUrl: BASE, storage })
    await client.login("a@test.com", "pw12345678")
    fetchMock.mockClear()

    await client.logout()

    expect(fetchMock).not.toHaveBeenCalled()
    expect(await client.getSession()).toBeNull()
  })

  it("getCurrentUser fetches /api/users/me with bearer jwt", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { jwt: "j", user: { id: 1 } }))
    const storage = memoryStorage()
    const client = createStrapiAuthClient({ apiBaseUrl: BASE, storage })
    await client.login("a@test.com", "pw12345678")
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { id: 1, email: "a@test.com" }))

    const user = await client.getCurrentUser()

    expect(user?.email).toBe("a@test.com")
    expect(fetchMock).toHaveBeenLastCalledWith(
      `${BASE}/api/users/me`,
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer j" }),
      }),
    )
  })

  it("getCurrentUser returns null and clears session on 401", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { jwt: "j", user: { id: 1 } }))
    const storage = memoryStorage()
    const client = createStrapiAuthClient({ apiBaseUrl: BASE, storage })
    await client.login("a@test.com", "pw12345678")
    fetchMock.mockResolvedValueOnce(jsonResponse(401, { error: { name: "UnauthorizedError" } }))

    expect(await client.getCurrentUser()).toBeNull()
    expect(await client.getSession()).toBeNull()
  })

  it("getCurrentUser returns null without a session and skips fetch", async () => {
    const client = createStrapiAuthClient({ apiBaseUrl: BASE, storage: memoryStorage() })

    expect(await client.getCurrentUser()).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("resetPassword maps INVALID_PAYLOAD to RESET_INVALID", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(400, { error: { name: "ValidationError" } }))
    const client = createStrapiAuthClient({ apiBaseUrl: BASE, storage: memoryStorage() })

    await expect(client.resetPassword("badcode", "pw12345678")).rejects.toMatchObject({
      code: "RESET_INVALID",
    })
  })
})
