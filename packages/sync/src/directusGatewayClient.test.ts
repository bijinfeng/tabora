import { beforeEach, describe, expect, it, vi } from "vitest"
import { createDirectusGatewayClient } from "./directusGatewayClient"

const BASE = "http://api.test/tabora"

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

function pushBody() {
  return {
    data: {
      accepted: ["r1"],
      conflicts: [
        {
          type: "workspace",
          id: "r2",
          server_version: 3,
          server_data: { name: "server" },
          server_updated_at: "2026-07-15T10:00:00.000Z",
          server_device_id: "dev-server",
        },
      ],
      rejected: [{ id: "r3", reason: "sensitive field: token" }],
      server_time: "2026-07-15T12:00:00.000Z",
    },
  }
}

function pullBody() {
  return {
    data: {
      records: [
        {
          type: "workspace",
          id: "w1",
          data: { name: "ws" },
          version: 2,
          updated_at: "2026-07-15T09:00:00.000Z",
          deleted: false,
          device_id: "dev-1",
        },
        {
          type: "pluginData",
          id: "p1",
          data: { note: "hi" },
          version: 5,
          updated_at: "2026-07-15T09:30:00.000Z",
          deleted: true,
          device_id: "dev-2",
        },
      ],
      server_time: "2026-07-15T12:34:56.000Z",
    },
  }
}

const SAMPLE_RECORDS = [
  {
    scope: "core" as const,
    entityType: "workspace",
    recordKey: "w1",
    payload: { name: "ws" },
    clientUpdatedAt: "2026-07-15T08:00:00.000Z",
    deleted: false,
  },
]

describe("createDirectusGatewayClient", () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)
  })

  function callArgs(
    index = 0,
  ): [string, { method: string; headers: Record<string, string>; body?: string }] {
    const call = fetchMock.mock.calls[index]
    if (!call) throw new Error(`no fetch call at index ${index}`)
    return call as [string, { method: string; headers: Record<string, string>; body?: string }]
  }

  function client(token: string | null = "tok") {
    return createDirectusGatewayClient({
      apiBaseUrl: BASE,
      getAccessToken: async () => token,
    })
  }

  it("push sends correct URL, method, bearer header and mapped body", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, pushBody()))

    await client().push("dev-abc", SAMPLE_RECORDS)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = callArgs()
    expect(url).toBe(`${BASE}/sync/records`)
    expect(init.method).toBe("POST")
    expect(init.headers).toMatchObject({
      "Content-Type": "application/json",
      Authorization: "Bearer tok",
    })
    const body = JSON.parse(init.body ?? "null")
    expect(body).toEqual([
      {
        type: "workspace",
        id: "w1",
        data: { name: "ws" },
        version: null,
        client_timestamp: "2026-07-15T08:00:00.000Z",
        device_id: "dev-abc",
        deleted: false,
      },
    ])
  })

  it("push keeps payload even when deleted and maps version to null", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, pushBody()))

    await client().push("dev-abc", [
      {
        scope: "plugin",
        entityType: "pluginData",
        recordKey: "p9",
        payload: { keep: true },
        clientUpdatedAt: "2026-07-15T08:10:00.000Z",
        deleted: true,
      },
    ])

    const body = JSON.parse(callArgs()[1].body ?? "null")
    expect(body[0]).toEqual({
      type: "pluginData",
      id: "p9",
      data: { keep: true },
      version: null,
      client_timestamp: "2026-07-15T08:10:00.000Z",
      device_id: "dev-abc",
      deleted: true,
    })
  })

  it("push passes through accepted/conflicts/rejected/server_time", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, pushBody()))

    const result = await client().push("dev-abc", SAMPLE_RECORDS)

    expect(result).toEqual({
      ok: true,
      data: {
        accepted: ["r1"],
        conflicts: [
          {
            type: "workspace",
            id: "r2",
            server_version: 3,
            server_data: { name: "server" },
            server_updated_at: "2026-07-15T10:00:00.000Z",
            server_device_id: "dev-server",
          },
        ],
        rejected: [{ id: "r3", reason: "sensitive field: token" }],
        server_time: "2026-07-15T12:00:00.000Z",
      },
    })
  })

  it("pull with cursor sends ?since= query", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, pullBody()))

    await client().pull("2026-07-15T00:00:00.000Z")

    const url = callArgs()[0]
    expect(url).toBe(`${BASE}/sync/records?since=${encodeURIComponent("2026-07-15T00:00:00.000Z")}`)
  })

  it("pull without cursor sends no query", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, pullBody()))

    await client().pull()

    expect(callArgs()[0]).toBe(`${BASE}/sync/records`)
  })

  it("pull sends bearer header and GET method", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, pullBody()))

    await client().pull()

    const init = callArgs()[1]
    expect(init.method).toBe("GET")
    expect(init.headers).toMatchObject({ Authorization: "Bearer tok" })
  })

  it("pull maps response fields and sets cursor from server_time", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, pullBody()))

    const result = await client().pull()

    expect(result).toEqual({
      ok: true,
      data: {
        records: [
          {
            scope: "core",
            entityType: "workspace",
            recordKey: "w1",
            payload: { name: "ws" },
            serverUpdatedAt: "2026-07-15T09:00:00.000Z",
            deleted: false,
          },
          {
            scope: "plugin",
            entityType: "pluginData",
            recordKey: "p1",
            payload: { note: "hi" },
            serverUpdatedAt: "2026-07-15T09:30:00.000Z",
            deleted: true,
          },
        ],
        cursor: "2026-07-15T12:34:56.000Z",
      },
    })
  })

  it("pull derives scope: pluginData -> plugin, others -> core", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, {
        data: {
          records: [
            {
              type: "pluginData",
              id: "a",
              data: {},
              version: 1,
              updated_at: "t",
              deleted: false,
              device_id: "d",
            },
            {
              type: "workspace",
              id: "b",
              data: {},
              version: 1,
              updated_at: "t",
              deleted: false,
              device_id: "d",
            },
            {
              type: "plugin",
              id: "c",
              data: {},
              version: 1,
              updated_at: "t",
              deleted: false,
              device_id: "d",
            },
            {
              type: "pluginInstance",
              id: "e",
              data: {},
              version: 1,
              updated_at: "t",
              deleted: false,
              device_id: "d",
            },
          ],
          server_time: "t2",
        },
      }),
    )

    const result = await client().pull()
    if (!result.ok) throw new Error("expected ok")
    expect(result.data.records.map((r) => r.scope)).toEqual(["plugin", "core", "core", "core"])
  })

  it("push returns AUTH_FAILED and never fetches when token is null", async () => {
    const result = await client(null).push("dev-abc", SAMPLE_RECORDS)

    expect(result).toEqual({
      ok: false,
      error: { code: "AUTH_FAILED", message: expect.any(String) },
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("pull returns AUTH_FAILED and never fetches when token is null", async () => {
    const result = await client(null).pull()

    expect(result).toEqual({
      ok: false,
      error: { code: "AUTH_FAILED", message: expect.any(String) },
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("returns NETWORK_ERROR when fetch throws", async () => {
    fetchMock.mockRejectedValueOnce(new Error("boom"))

    const result = await client().push("dev-abc", SAMPLE_RECORDS)

    expect(result.ok).toBe(false)
    if (result.ok) throw new Error("expected error")
    expect(result.error.code).toBe("NETWORK_ERROR")
  })

  it("maps HTTP 401 to AUTH_FAILED", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(401, { errors: [{ message: "Invalid token" }] }))

    const result = await client().pull()

    expect(result.ok).toBe(false)
    if (result.ok) throw new Error("expected error")
    expect(result.error.code).toBe("AUTH_FAILED")
    expect(result.error.message).toBe("Invalid token")
  })

  it("maps HTTP 400 to INVALID_PAYLOAD", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(400, { errors: [{ message: "Bad batch" }] }))

    const result = await client().push("dev-abc", SAMPLE_RECORDS)

    expect(result.ok).toBe(false)
    if (result.ok) throw new Error("expected error")
    expect(result.error.code).toBe("INVALID_PAYLOAD")
    expect(result.error.message).toBe("Bad batch")
  })

  it("maps other non-2xx (500) to SERVER_ERROR with fallback message", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(500, {}))

    const result = await client().pull()

    expect(result.ok).toBe(false)
    if (result.ok) throw new Error("expected error")
    expect(result.error.code).toBe("SERVER_ERROR")
    expect(result.error.message.length).toBeGreaterThan(0)
  })

  it("strips trailing slash from apiBaseUrl", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, pullBody()))
    const c = createDirectusGatewayClient({
      apiBaseUrl: `${BASE}/`,
      getAccessToken: async () => "tok",
    })

    await c.pull()

    expect(callArgs()[0]).toBe(`${BASE}/sync/records`)
  })
})
