// 负责 bearer header、push/pull HTTP 调用和响应到错误码的映射：
// 未登录 / 401 / 403 -> AUTH_FAILED，400 -> INVALID_PAYLOAD，网络异常 -> NETWORK_ERROR，
// 其他非 2xx -> SERVER_ERROR。同步失败不能阻塞本地读写。
export type SyncGatewayError = {
  code: "AUTH_FAILED" | "NETWORK_ERROR" | "INVALID_PAYLOAD" | "SERVER_ERROR"
  message: string
}

export type SyncGatewayResult<T> = { ok: true; data: T } | { ok: false; error: SyncGatewayError }

export type SyncPushConflict = {
  type: string
  id: string
  server_version: number
  server_data: unknown
  server_updated_at: string
  server_device_id: string
}

export type SyncPushResponse = {
  accepted: string[]
  conflicts: SyncPushConflict[]
  rejected: Array<{ id: string; reason: string }>
  server_time: string
}

export type SyncPullRecord = {
  scope: "core" | "plugin"
  entityType: string
  recordKey: string
  payload: unknown
  serverUpdatedAt: string
  deleted: boolean
}

export type SyncPullResponse = {
  records: SyncPullRecord[]
  cursor: string
}

export type SyncGatewayPushRecord = {
  scope: "core" | "plugin"
  entityType: string
  recordKey: string
  payload: unknown
  clientUpdatedAt: string
  deleted: boolean
}

export type SyncGatewayClientConfig = {
  apiBaseUrl: string
  getAccessToken: () => Promise<string | null>
}

export type SyncGatewayClient = {
  push(
    deviceId: string,
    records: SyncGatewayPushRecord[],
  ): Promise<SyncGatewayResult<SyncPushResponse>>
  pull(cursor?: string): Promise<SyncGatewayResult<SyncPullResponse>>
}

// 后端同步网关的原始记录形状（GET /sync/records）
type RawPullRecord = {
  type: string
  id: string
  data: unknown
  version: number | null
  updated_at: string
  deleted: boolean
  device_id: string
}

const ERROR_MESSAGES: Record<SyncGatewayError["code"], string> = {
  AUTH_FAILED: "登录状态失效，请重新登录",
  NETWORK_ERROR: "网络异常，请稍后重试",
  INVALID_PAYLOAD: "同步数据格式不正确",
  SERVER_ERROR: "同步服务异常，请稍后重试",
}

/**
 * 将 HTTP status 归一化为网关错误码：
 * 401/403 → AUTH_FAILED，400 → INVALID_PAYLOAD，其余非 2xx → SERVER_ERROR。
 */
function statusToCode(status: number): SyncGatewayError["code"] {
  if (status === 401 || status === 403) return "AUTH_FAILED"
  if (status === 400) return "INVALID_PAYLOAD"
  return "SERVER_ERROR"
}

// 尽量取响应体 error.message，取不到用兜底文案
function extractMessage(body: unknown, code: SyncGatewayError["code"]): string {
  const message = (body as { error?: { message?: string } })?.error?.message
  return typeof message === "string" && message.length > 0 ? message : ERROR_MESSAGES[code]
}

function authFailed(): { ok: false; error: SyncGatewayError } {
  return { ok: false, error: { code: "AUTH_FAILED", message: ERROR_MESSAGES.AUTH_FAILED } }
}

export function createSyncGatewayClient(config: SyncGatewayClientConfig): SyncGatewayClient {
  const base = config.apiBaseUrl.replace(/\/$/, "")

  async function request<T>(
    path: string,
    init: { method: "GET" | "POST"; token: string; body?: unknown },
  ): Promise<SyncGatewayResult<T>> {
    let response: Response
    try {
      response = await fetch(`${base}${path}`, {
        method: init.method,
        headers: {
          ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
          Authorization: `Bearer ${init.token}`,
        },
        ...(init.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
      })
    } catch {
      return { ok: false, error: { code: "NETWORK_ERROR", message: ERROR_MESSAGES.NETWORK_ERROR } }
    }

    let parsed: unknown = null
    try {
      parsed = await response.json()
    } catch {
      parsed = null
    }

    if (!response.ok) {
      const code = statusToCode(response.status)
      return { ok: false, error: { code, message: extractMessage(parsed, code) } }
    }

    return { ok: true, data: (parsed as { data: T }).data }
  }

  return {
    async push(deviceId, records) {
      const token = await config.getAccessToken()
      if (!token) return authFailed()

      const body = records.map((record) => ({
        type: record.entityType,
        id: record.recordKey,
        data: record.payload,
        version: null,
        client_timestamp: record.clientUpdatedAt,
        device_id: deviceId,
        deleted: record.deleted,
      }))

      return request<SyncPushResponse>("/api/sync/records", {
        method: "POST",
        token,
        body,
      })
    },

    async pull(cursor) {
      const token = await config.getAccessToken()
      if (!token) return authFailed()

      const path = cursor
        ? `/api/sync/records?since=${encodeURIComponent(cursor)}`
        : "/api/sync/records"

      const result = await request<{ records: RawPullRecord[]; server_time: string }>(path, {
        method: "GET",
        token,
      })

      if (!result.ok) return result

      const records: SyncPullRecord[] = result.data.records.map((record) => ({
        scope: record.type === "pluginData" ? "plugin" : "core",
        entityType: record.type,
        recordKey: record.id,
        payload: record.data,
        serverUpdatedAt: record.updated_at,
        deleted: record.deleted,
      }))

      return { ok: true, data: { records, cursor: result.data.server_time } }
    },
  }
}
