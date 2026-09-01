import type { AppEnv } from "./env"

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"])

/**
 * 可信源 = 显式白名单 + 本次请求自身的源（仅限本机回环）。
 *
 * 管理后台与 auth API 同源部署，但 dev server 端口会因占用自动顺延（5173 → 5174 → …），
 * 写死单个端口会让同源的登录/注册被判成跨站并返回 403。回环地址只在开发机出现，
 * 因此按请求放行 127.0.0.1 / localhost，不放宽任何对外源；生产仍需显式配置 CORS_ORIGINS。
 */
export function resolveTrustedOrigins(env: AppEnv, request?: Request): string[] {
  const origins = [...env.corsOrigins]
  const requestOrigin = readLoopbackOrigin(request)
  if (requestOrigin && !origins.includes(requestOrigin)) origins.push(requestOrigin)
  return origins
}

/** 取请求自身的源，非回环主机返回 null。 */
function readLoopbackOrigin(request?: Request): string | null {
  const rawOrigin = request?.headers.get("origin")
  if (!rawOrigin) return null
  let url: URL
  try {
    url = new URL(rawOrigin)
  } catch {
    return null
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null
  return LOOPBACK_HOSTS.has(url.hostname) ? url.origin : null
}
