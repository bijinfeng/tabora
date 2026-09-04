import { describe, expect, it } from "vitest"

import { buildDetails, idFrom, redactSensitive } from "./auditPayload"

/**
 * 这些用例从旧 backend/server 的 auditMiddleware.test.ts 迁移而来
 * （旧包已随后端合并删除，只剩这里的继承版本）。
 *
 * 旧文件里的 resolveResource 用例没有迁移：server function 没有请求路径，
 * 新实现由每个 admin server function 显式声明 resourceType，
 * 不再从路径反推，因此该函数与其用例一并删除。
 */

describe("redactSensitive", () => {
  // 保护的行为：写入 audit_log.details 的内容不得泄露口令/密钥
  it("脱敏顶层敏感字段", () => {
    expect(redactSensitive({ email: "a@b.com", password: "secret123" })).toEqual({
      email: "a@b.com",
      password: "[REDACTED]",
    })
  })

  it("脱敏嵌套对象中的敏感字段", () => {
    const input = { user: { name: "x", apiKey: "k-1" }, count: 3 }
    expect(redactSensitive(input)).toEqual({
      user: { name: "x", apiKey: "[REDACTED]" },
      count: 3,
    })
  })

  it("脱敏数组中的敏感字段", () => {
    const input = [{ token: "t1" }, { token: "t2" }]
    expect(redactSensitive(input)).toEqual([{ token: "[REDACTED]" }, { token: "[REDACTED]" }])
  })

  it("大小写与部分匹配：secret_key / API_KEY", () => {
    expect(redactSensitive({ secret_key: "s", API_KEY: "a" })).toEqual({
      secret_key: "[REDACTED]",
      API_KEY: "[REDACTED]",
    })
  })

  it("非敏感原始值原样返回", () => {
    expect(redactSensitive("hello")).toBe("hello")
    expect(redactSensitive(42)).toBe(42)
    expect(redactSensitive(null)).toBe(null)
  })

  it("脱敏 saveSettings 的 smtpPassword", () => {
    // settings 的密钥字段名含 "password"，必须命中脱敏
    expect(redactSensitive({ smtpHost: "smtp.example.com", smtpPassword: "p@ss" })).toEqual({
      smtpHost: "smtp.example.com",
      smtpPassword: "[REDACTED]",
    })
  })
})

describe("idFrom", () => {
  // 保护的行为：audit_log.resourceId 是文本列，数字入参（附件 id、清理天数）必须转成字符串
  it("读取字符串字段", () => {
    expect(idFrom("userId")({ userId: "u-1" })).toBe("u-1")
  })

  it("数字字段转为字符串", () => {
    expect(idFrom("id")({ id: 42 })).toBe("42")
    expect(idFrom("days")({ days: 30 })).toBe("30")
  })

  it('字段缺失或为空时返回 null，而不是 "undefined"', () => {
    expect(idFrom("userId")({})).toBe(null)
    expect(idFrom("userId")({ userId: null })).toBe(null)
  })
})

describe("buildDetails", () => {
  // 保护的行为：details 是 TEXT 列，必须是 JSON 字符串或 null，且已脱敏
  it("成功时序列化入参并脱敏", () => {
    expect(buildDetails({ email: "a@b.com", password: "p" })).toBe(
      JSON.stringify({ email: "a@b.com", password: "[REDACTED]" }),
    )
  })

  it("无入参且无错误时记为 null", () => {
    expect(buildDetails(undefined)).toBe(null)
  })

  it("失败时记录错误信息，入参只转义一次", () => {
    // 回归：早期实现把已 stringify 的入参再 stringify 一次，
    // 审计页看到的是 "input":"{\"email\":...}" 这种双重转义字符串
    const details = buildDetails({ email: "a@b.com" }, "用户不存在")
    expect(details).toBe(JSON.stringify({ error: "用户不存在", input: { email: "a@b.com" } }))
    const parsed = JSON.parse(details!) as { input: unknown }
    expect(parsed.input).toEqual({ email: "a@b.com" })
  })

  it("失败时入参仍然脱敏", () => {
    const details = buildDetails({ password: "p" }, "boom")
    expect(details).toContain("[REDACTED]")
    expect(details).not.toContain('"p"')
  })

  it("无入参的失败只记录错误", () => {
    expect(buildDetails(undefined, "boom")).toBe(JSON.stringify({ error: "boom" }))
  })

  it("不可序列化的入参不丢失失败信息", () => {
    const circular: Record<string, unknown> = {}
    circular.self = circular
    expect(buildDetails(circular)).toBe(null)
    expect(buildDetails(circular, "boom")).toBe(JSON.stringify({ error: "boom" }))
  })
})
