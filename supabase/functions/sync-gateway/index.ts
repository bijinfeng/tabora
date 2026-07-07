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
          error: { code: "AUTH_FAILED", message: "Missing or invalid authorization header" },
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
    const body = await req.json()
    const { action } = body

    // Action 派发（后续 tasks 填充各 handler）
    switch (action) {
      case "register-device":
        return jsonResponse(
          { ok: false, error: { code: "UNKNOWN_ACTION", message: "Not implemented yet" } },
          501,
        )
      case "push":
        return jsonResponse(
          { ok: false, error: { code: "UNKNOWN_ACTION", message: "Not implemented yet" } },
          501,
        )
      case "pull":
        return jsonResponse(
          { ok: false, error: { code: "UNKNOWN_ACTION", message: "Not implemented yet" } },
          501,
        )
      case "snapshot":
        return jsonResponse(
          { ok: false, error: { code: "UNKNOWN_ACTION", message: "Not implemented yet" } },
          501,
        )
      case "list-devices":
        return jsonResponse(
          { ok: false, error: { code: "UNKNOWN_ACTION", message: "Not implemented yet" } },
          501,
        )
      case "remove-device":
        return jsonResponse(
          { ok: false, error: { code: "UNKNOWN_ACTION", message: "Not implemented yet" } },
          501,
        )
      case "list-conflicts":
        return jsonResponse(
          { ok: false, error: { code: "UNKNOWN_ACTION", message: "Not implemented yet" } },
          501,
        )
      case "resolve-conflict":
        return jsonResponse(
          { ok: false, error: { code: "UNKNOWN_ACTION", message: "Not implemented yet" } },
          501,
        )
      default:
        return jsonResponse<ErrorResponse>(
          {
            ok: false,
            error: { code: "UNKNOWN_ACTION", message: `Unknown action: ${action}` },
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
