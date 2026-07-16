import { describe, expect, it } from "vitest"
import { findSensitiveFieldPath } from "../../extensions/directus-extension-tabora/src/syncSensitiveFilter"

describe("findSensitiveFieldPath", () => {
  it("returns null for a safe payload", () => {
    expect(findSensitiveFieldPath({ title: "笔记", tags: ["a"] })).toBeNull()
  })

  it("detects sensitive key names case-insensitively", () => {
    expect(findSensitiveFieldPath({ apiKey: "x" })).toBe("apiKey")
    expect(findSensitiveFieldPath({ nested: { Password: "x" } })).toBe("nested.Password")
    expect(findSensitiveFieldPath({ a: [{ mySecretValue: 1 }] })).toBe("a[0].mySecretValue")
  })

  it("detects file path values", () => {
    expect(findSensitiveFieldPath({ p: "/home/user/x.png" })).toBe("p")
    expect(findSensitiveFieldPath({ p: "C:\\Users\\x" })).toBe("p")
    expect(findSensitiveFieldPath({ p: "file:///tmp/a" })).toBe("p")
  })

  it("does not flag normal urls or relative paths", () => {
    expect(findSensitiveFieldPath({ p: "https://example.com/a" })).toBeNull()
    expect(findSensitiveFieldPath({ p: "docs/readme.md" })).toBeNull()
  })

  it("handles null and non-object payloads", () => {
    expect(findSensitiveFieldPath(null)).toBeNull()
    expect(findSensitiveFieldPath("plain")).toBeNull()
  })
})
