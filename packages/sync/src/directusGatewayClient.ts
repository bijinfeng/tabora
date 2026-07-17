export type DirectusGatewayError = {
  code: "AUTH_FAILED" | "NETWORK_ERROR" | "INVALID_PAYLOAD" | "SERVER_ERROR"
  message: string
}

export type DirectusGatewayResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: DirectusGatewayError }

export type DirectusPushConflict = {
  type: string
  id: string
  server_version: number
  server_data: unknown
  server_updated_at: string
  server_device_id: string
}

export type DirectusPushResponse = {
  accepted: string[]
  conflicts: DirectusPushConflict[]
  rejected: Array<{ id: string; reason: string }>
  server_time: string
}

export type DirectusPullRecord = {
  scope: "core" | "plugin"
  entityType: string
  recordKey: string
  payload: unknown
  serverUpdatedAt: string
  deleted: boolean
}

export type DirectusPullResponse = {
  records: DirectusPullRecord[]
  cursor: string
}

export type DirectusGatewayPushRecord = {
  scope: "core" | "plugin"
  entityType: string
  recordKey: string
  payload: unknown
  clientUpdatedAt: string
  deleted: boolean
}

export type DirectusGatewayClientConfig = {
  apiBaseUrl: string
  getAccessToken: () => Promise<string | null>
}

export type DirectusGatewayClient = {
  push(
    deviceId: string,
    records: DirectusGatewayPushRecord[],
  ): Promise<DirectusGatewayResult<DirectusPushResponse>>
  pull(cursor?: string): Promise<DirectusGatewayResult<DirectusPullResponse>>
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

const ERROR_MESSAGES: Record<DirectusGatewayError["code"], string> = {
  AUTH_FAILED: "登录状态失效，请重新登录",
  NETWORK_ERROR: "网络异常，请稍后重试",
  INVALID_PAYLOAD: "同步数据格式不正确",
  SERVER_ERROR: "同步服务异常，请稍后重试",
}

/**
 * 将 HTTP status 归一化为网关错误码：
 * 401 → AUTH_FAILED，400 → INVALID_PAYLOAD，其余非 2xx → SERVER_ERROR。
 */
function statusToCode(status: number): DirectusGatewayError["code"] {
  if (status === 401) return "AUTH_FAILED"
  if (status === 400) return "INVALID_PAYLOAD"
  return "SERVER_ERROR"
}

// 尽量取响应体 errors[0].message，取不到用兜底文案
function extractMessage(body: unknown, code: DirectusGatewayError["code"]): string {
  const message = (body as { errors?: Array<{ message?: string }> })?.errors?.[0]?.message
  return typeof message === "string" && message.length > 0 ? message : ERROR_MESSAGES[code]
}

function authFailed(): { ok: false; error: DirectusGatewayError } {
  return { ok: false, error: { code: "AUTH_FAILED", message: ERROR_MESSAGES.AUTH_FAILED } }
}

export function createDirectusGatewayClient(
  config: DirectusGatewayClientConfig,
): DirectusGatewayClient {
  const base = config.apiBaseUrl.replace(/\/$/, "")

  async function request<T>(
    path: string,
    init: { method: "GET" | "POST"; token: string; body?: unknown },
  ): Promise<DirectusGatewayResult<T>> {
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

      return request<DirectusPushResponse>("/sync/records", {
        method: "POST",
        token,
        body,
      })
    },

    async pull(cursor) {
      const token = await config.getAccessToken()
      if (!token) return authFailed()

      const path = cursor ? `/sync/records?since=${encodeURIComponent(cursor)}` : "/sync/records"

      const result = await request<{ records: RawPullRecord[]; server_time: string }>(path, {
        method: "GET",
        token,
      })

      if (!result.ok) return result

      const records: DirectusPullRecord[] = result.data.records.map((record) => ({
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
