import { createFileRoute } from "@tanstack/solid-router"

import { getRuntime } from "../../../server/runtime"

/**
 * better-auth 全部认证端点（cookie 或 bearer token）。
 * 保留对外 HTTP 契约：playground/extension 跨域调用 /api/auth/*。
 * CORS 由全局 request middleware（src/start.ts）统一处理。
 */
async function handle({ request }: { request: Request }): Promise<Response> {
  const { auth } = await getRuntime()
  return auth.handler(request)
}

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: handle,
      POST: handle,
    },
  },
})
