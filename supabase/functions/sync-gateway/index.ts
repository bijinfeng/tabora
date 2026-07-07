import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

type SuccessResponse<T = any> = { ok: true; data: T }
type ErrorResponse = {
  ok: false
  error: {
    code:
      | "AUTH_FAILED"
      | "DEVICE_REMOVED"
      | "INVALID_PAYLOAD"
      | "SENSITIVE_FIELD_REJECTED"
      | "ENTITY_NOT_SYNCABLE"
      | "DB_ERROR"
      | "UNKNOWN_ACTION"
    message: string
  }
}
type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, content-type",
      },
    })
  }

  try {
    // 解析 JWT 拿 accountId
    const authHeader = req.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse<ErrorResponse>(
        {
          ok: false,
          error: {
            code: "AUTH_FAILED",
            message: "Missing or invalid authorization header",
          },
        },
        401,
      )
    }

    const token = authHeader.substring(7)
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    })

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return jsonResponse<ErrorResponse>(
        {
          ok: false,
          error: { code: "AUTH_FAILED", message: "Invalid access token" },
        },
        401,
      )
    }

    const accountId = user.id

    // 解析请求体
    let body: any
    try {
      body = await req.json()
    } catch {
      return jsonResponse<ErrorResponse>(
        {
          ok: false,
          error: { code: "INVALID_PAYLOAD", message: "Invalid JSON body" },
        },
        400,
      )
    }
    const { action } = body

    // Action 派发（后续 tasks 填充各 handler）
    switch (action) {
      case "register-device": {
        const { deviceId, name, type } = body
        if (!deviceId || !name || !type) {
          return jsonResponse<ErrorResponse>(
            {
              ok: false,
              error: {
                code: "INVALID_PAYLOAD",
                message: "Missing deviceId, name, or type",
              },
            },
            400,
          )
        }

        const { data: device, error: dbError } = await supabaseAdmin
          .from("sync_devices")
          .upsert(
            {
              device_id: deviceId,
              account_id: accountId,
              name,
              type,
              last_sync_at: new Date().toISOString(),
            },
            { onConflict: "account_id,device_id" },
          )
          .select()
          .single()

        if (dbError) {
          return jsonResponse<ErrorResponse>(
            {
              ok: false,
              error: { code: "DB_ERROR", message: dbError.message },
            },
            500,
          )
        }

        return jsonResponse<SuccessResponse>({ ok: true, data: { device } })
      }
      case "push": {
        const { changes } = body
        if (!Array.isArray(changes) || changes.length === 0) {
          return jsonResponse<ErrorResponse>(
            {
              ok: false,
              error: {
                code: "INVALID_PAYLOAD",
                message: "changes must be a non-empty array",
              },
            },
            400,
          )
        }

        let pushedCount = 0
        let skippedCount = 0

        for (const change of changes) {
          const { scope, entityType, recordKey, payload, clientUpdatedAt, deleted } = change
          if (!scope || !entityType || !recordKey || !payload || !clientUpdatedAt) {
            return jsonResponse<ErrorResponse>(
              {
                ok: false,
                error: {
                  code: "INVALID_PAYLOAD",
                  message: "Missing required fields in change",
                },
              },
              400,
            )
          }

          // 1. 敏感字段过滤
          try {
            filterSensitiveFields(payload)
          } catch (err) {
            return jsonResponse<ErrorResponse>(
              {
                ok: false,
                error: {
                  code: "SENSITIVE_FIELD_REJECTED",
                  message: (err as Error).message,
                },
              },
              400,
            )
          }

          // 2. 危险声明拦截（简化：V1 不查 manifest，假设客户端已过滤；服务端只过滤敏感 key）
          //    若需要严格检查，需要在此处 SELECT plugins 表的 manifest 并解析 sync.collections

          // 3. 查云端当前记录
          const { data: existingRecord } = await supabaseAdmin
            .from("synced_records")
            .select("updated_at")
            .eq("account_id", accountId)
            .eq("scope", scope)
            .eq("entity_type", entityType)
            .eq("record_key", recordKey)
            .maybeSingle()

          // 4. LWW 合并
          const clientTime = new Date(clientUpdatedAt)
          if (existingRecord) {
            const serverTime = new Date(existingRecord.updated_at)
            if (clientTime <= serverTime) {
              skippedCount++
              continue // 客户端版本旧，跳过
            }
          }

          // 5. 写入/更新
          const now = new Date().toISOString()
          const { error: upsertError } = await supabaseAdmin.from("synced_records").upsert(
            {
              account_id: accountId,
              scope,
              entity_type: entityType,
              record_key: recordKey,
              payload,
              updated_at: now, // 权威时间戳
              deleted_at: deleted ? now : null,
              schema_version: 1,
              last_writer_device_id: body.deviceId || "unknown", // 客户端应传 deviceId
              server_updated_at: now,
            },
            { onConflict: "account_id,scope,entity_type,record_key" },
          )

          if (upsertError) {
            return jsonResponse<ErrorResponse>(
              {
                ok: false,
                error: { code: "DB_ERROR", message: upsertError.message },
              },
              500,
            )
          }

          pushedCount++
        }

        return jsonResponse<SuccessResponse>({
          ok: true,
          data: { pushedCount, skippedCount },
        })
      }
      case "pull": {
        const { cursor } = body
        const cursorTime = cursor || "1970-01-01T00:00:00Z"

        const { data: records, error: queryError } = await supabaseAdmin
          .from("synced_records")
          .select(
            "scope, entity_type, record_key, payload, updated_at, deleted_at, last_writer_device_id, server_updated_at",
          )
          .eq("account_id", accountId)
          .gt("server_updated_at", cursorTime)
          .order("server_updated_at", { ascending: true })
          .limit(500)

        if (queryError) {
          return jsonResponse<ErrorResponse>(
            {
              ok: false,
              error: { code: "DB_ERROR", message: queryError.message },
            },
            500,
          )
        }

        const newCursor =
          records && records.length > 0 ? records[records.length - 1].server_updated_at : cursorTime

        return jsonResponse<SuccessResponse>({
          ok: true,
          data: {
            records: (records || []).map((r) => ({
              scope: r.scope,
              entityType: r.entity_type,
              recordKey: r.record_key,
              payload: r.payload,
              updatedAt: r.updated_at,
              deletedAt: r.deleted_at,
              lastWriterDeviceId: r.last_writer_device_id,
            })),
            newCursor,
          },
        })
      }
      case "snapshot":
        return jsonResponse(
          {
            ok: false,
            error: { code: "UNKNOWN_ACTION", message: "Not implemented yet" },
          },
          501,
        )
      case "list-devices":
        return jsonResponse(
          {
            ok: false,
            error: { code: "UNKNOWN_ACTION", message: "Not implemented yet" },
          },
          501,
        )
      case "remove-device":
        return jsonResponse(
          {
            ok: false,
            error: { code: "UNKNOWN_ACTION", message: "Not implemented yet" },
          },
          501,
        )
      case "list-conflicts":
        return jsonResponse(
          {
            ok: false,
            error: { code: "UNKNOWN_ACTION", message: "Not implemented yet" },
          },
          501,
        )
      case "resolve-conflict":
        return jsonResponse(
          {
            ok: false,
            error: { code: "UNKNOWN_ACTION", message: "Not implemented yet" },
          },
          501,
        )
      default:
        return jsonResponse<ErrorResponse>(
          {
            ok: false,
            error: {
              code: "UNKNOWN_ACTION",
              message: `Unknown action: ${action}`,
            },
          },
          400,
        )
    }
  } catch (err) {
    console.error("Unhandled error:", err)
    return jsonResponse<ErrorResponse>(
      {
        ok: false,
        error: { code: "DB_ERROR", message: "Internal server error" },
      },
      500,
    )
  }
})

function jsonResponse<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  })
}

function filterSensitiveFields(payload: Record<string, any>): Record<string, any> {
  const sensitiveKeywords = ["apikey", "token", "password", "secret", "filepath"]
  const filtered: Record<string, any> = {}

  for (const [key, value] of Object.entries(payload)) {
    const lowerKey = key.toLowerCase()
    if (sensitiveKeywords.some((kw) => lowerKey.includes(kw))) {
      // 拒绝敏感字段，调用方会检查返回的对象大小
      throw new Error(`Sensitive field detected: ${key}`)
    }
    filtered[key] = value
  }

  return filtered
}
