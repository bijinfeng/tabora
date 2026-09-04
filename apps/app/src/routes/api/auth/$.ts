import { createFileRoute } from "@tanstack/solid-router"

import { getRuntime } from "../../../server/runtime"

/**
 * better-auth 全部认证端点（cookie 或 bearer token）。
 * 保留对外 HTTP 契约：浏览器扩展可跨域调用 /api/auth/*；根工作台同源调用。
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
