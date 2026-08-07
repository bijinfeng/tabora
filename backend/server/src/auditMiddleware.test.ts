import { describe, expect, it } from "vitest"

import { redactSensitive, resolveResource } from "./auditMiddleware"

describe("resolveResource", () => {
  it("匹配用户集合路径（无 ID）", () => {
    expect(resolveResource("/admin-api/users")).toEqual({
      resourceType: "user",
      resourceId: null,
    })
  })

  it("匹配用户资源路径并提取 ID", () => {
    expect(resolveResource("/admin-api/users/abc123")).toEqual({
      resourceType: "user",
      resourceId: "abc123",
    })
  })

  it("最长前缀优先：attachments/files 不被 attachments 抢占", () => {
    expect(resolveResource("/admin-api/attachments/files/42")).toEqual({
      resourceType: "attachment_file",
      resourceId: "42",
    })
  })

  it("匹配附件策略路径并提取 entityType", () => {
    expect(resolveResource("/admin-api/attachment-policies/note")).toEqual({
      resourceType: "attachment_policy",
      resourceId: "note",
    })
  })

  it("匹配同步记录路径", () => {
    expect(resolveResource("/admin-api/synced-records/rec-1")).toEqual({
      resourceType: "synced_record",
      resourceId: "rec-1",
    })
  })

  it("匹配 settings / audit-log / email-queue / system", () => {
    expect(resolveResource("/admin-api/settings").resourceType).toBe("settings")
    expect(resolveResource("/admin-api/audit-log").resourceType).toBe("audit_log")
    expect(resolveResource("/admin-api/email-queue").resourceType).toBe("email_queue")
    expect(resolveResource("/admin-api/system").resourceType).toBe("system")
  })

  it("未知路径返回空资源", () => {
    expect(resolveResource("/admin-api/unknown/thing")).toEqual({
      resourceType: null,
      resourceId: null,
    })
  })

  it("前缀相似但非子路径不误匹配", () => {
    // /admin-api/users-extra 不应被 /admin-api/users 命中
    expect(resolveResource("/admin-api/users-extra")).toEqual({
      resourceType: null,
      resourceId: null,
    })
  })
})

describe("redactSensitive", () => {
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
})
