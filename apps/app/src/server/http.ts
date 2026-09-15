import type { Auth } from "./auth"

/** JSON 响应。CORS 由全局 request middleware（src/start.ts）统一附加。 */
export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

/** 校验 better-auth 会话，返回 userId；未登录返回 null。 */
export async function getSessionUserId(auth: Auth, request: Request): Promise<string | null> {
  const session = await auth.api.getSession({ headers: request.headers })
  return session?.user?.id ?? null
}
