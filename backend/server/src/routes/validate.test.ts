import { Hono } from "hono"
import { describe, expect, it } from "vitest"
import { z } from "zod"

import { parseJsonBody } from "./validate"

const schema = z.object({ name: z.string().min(1) })

function makeApp() {
  const app = new Hono()
  app.post("/", async (c) => {
    const result = await parseJsonBody(c, schema)
    if ("response" in result) return result.response
    return c.json({ ok: result.data.name })
  })
  return app
}

describe("parseJsonBody", () => {
  it("合法请求体返回解析数据", async () => {
    const res = await makeApp().request("/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "tabora" }),
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: "tabora" })
  })

  it("非法 JSON 返回 400 与提示", async () => {
    const res = await makeApp().request("/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{ not json",
    })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: { message: "请求体不是合法 JSON" } })
  })

  it("校验失败返回 400 与 details", async () => {
    const res = await makeApp().request("/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "" }),
    })
    expect(res.status).toBe(400)
    const json = (await res.json()) as { error: { message: string; details: unknown[] } }
    expect(json.error.message).toBe("参数错误")
    expect(Array.isArray(json.error.details)).toBe(true)
  })
})
