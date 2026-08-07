import type { Context } from "hono"
import type { z } from "zod"

/**
 * 校验成功时返回解析后的数据；失败时返回已写好的 400 响应。
 * 调用方通过判断 `"data" in result` 区分成功与失败。
 */
export type ParseResult<T> = { data: T } | { response: Response }

/**
 * 读取请求 JSON 并用 Zod schema 校验。
 *
 * - 非法 JSON：返回 400 {error:{message:"请求体不是合法 JSON"}}
 * - 校验失败：返回 400 {error:{message:"参数错误", details}}
 * - 成功：返回 {data}
 *
 * 统一所有 admin 路由的输入校验与错误信封，替代散落的手写校验。
 */
export async function parseJsonBody<T>(c: Context, schema: z.ZodType<T>): Promise<ParseResult<T>> {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return { response: c.json({ error: { message: "请求体不是合法 JSON" } }, 400) }
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return {
      response: c.json({ error: { message: "参数错误", details: parsed.error.issues } }, 400),
    }
  }
  return { data: parsed.data }
}
