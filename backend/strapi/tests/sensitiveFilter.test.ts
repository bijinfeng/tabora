import { describe, it, expect } from "vitest"
import { findSensitiveFieldPath } from "../src/utils/sensitiveFilter"

describe("findSensitiveFieldPath", () => {
  it("命中关键字 token", () => {
    expect(findSensitiveFieldPath({ apiToken: "x" })).toBe("apiToken")
  })
  it("命中文件路径", () => {
    expect(findSensitiveFieldPath({ note: "/Users/me/f" })).toBe("note")
  })
  it("嵌套安全对象返回 null", () => {
    expect(findSensitiveFieldPath({ a: { b: 1 } })).toBeNull()
  })
  it("嵌套敏感字段返回完整路径", () => {
    expect(findSensitiveFieldPath({ a: { secretKey: "x" } })).toBe("a.secretKey")
  })
  it("数组内敏感字段返回索引路径", () => {
    expect(findSensitiveFieldPath([{ password: "x" }])).toBe("[0].password")
  })
})
