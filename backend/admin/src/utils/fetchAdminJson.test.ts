import { afterEach, describe, expect, it, vi } from "vitest"

import { fetchAdminJson } from "./fetchAdminJson"

describe("fetchAdminJson", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it("requests the admin endpoint with credentials and returns JSON", async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ data: "ok" }),
    })
    vi.stubGlobal("fetch", fetch)

    await expect(fetchAdminJson<{ data: string }>("/admin-api/example")).resolves.toEqual({
      data: "ok",
    })
    expect(fetch).toHaveBeenCalledWith("http://localhost:4000/admin-api/example", {
      credentials: "include",
    })
  })

  it("preserves administrator and generic load errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({ ok: false, status: 403 })
        .mockResolvedValueOnce({ ok: false, status: 500 }),
    )

    await expect(fetchAdminJson("/admin-api/forbidden")).rejects.toThrow("需要管理员权限")
    await expect(fetchAdminJson("/admin-api/failure")).rejects.toThrow("加载失败")
  })
})
