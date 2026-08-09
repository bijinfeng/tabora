import { createCsrfMiddleware, createMiddleware, createStart } from "@tanstack/solid-start"

import { getEnv } from "./server/env"

const ALLOW_METHODS = "GET, POST, PUT, DELETE, OPTIONS"
const ALLOW_HEADERS = "Content-Type, Authorization"

/** 仅反射白名单内的源；配合 credentials:true 不能回退到 "*"（浏览器会拒绝，且不安全）。 */
function applyCors(request: Request, headers: Headers): void {
  const origin = request.headers.get("origin")
  if (origin && getEnv().corsOrigins.includes(origin)) {
    headers.set("Access-Control-Allow-Origin", origin)
    headers.set("Access-Control-Allow-Credentials", "true")
    const vary = headers.get("Vary")
    headers.set("Vary", vary ? `${vary}, Origin` : "Origin")
  }
  headers.set("Access-Control-Allow-Methods", ALLOW_METHODS)
  headers.set("Access-Control-Allow-Headers", ALLOW_HEADERS)
}

/**
 * 对外 HTTP 契约的 CORS：在路由匹配（含 h3 自动 OPTIONS）之前统一处理 /api/* 跨域。
 * playground/extension 以 cookie 或 bearer token 跨域调用，预检必须带 credentials。
 */
const corsMiddleware = createMiddleware({ type: "request" }).server(async ({ request, next }) => {
  const isApi = new URL(request.url).pathname.startsWith("/api/")
  if (!isApi) return next()

  if (request.method === "OPTIONS") {
    const headers = new Headers()
    applyCors(request, headers)
    return new Response(null, { status: 204, headers })
  }

  const result = await next()
  applyCors(request, result.response.headers)
  return result
})

/** 服务端函数为同源 RPC 端点，按 Start 约定加 CSRF 保护。 */
const csrfMiddleware = createCsrfMiddleware({ filter: (ctx) => ctx.handlerType === "serverFn" })

export const startInstance = createStart(() => ({
  requestMiddleware: [corsMiddleware, csrfMiddleware],
}))
