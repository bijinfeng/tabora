import { describe, expect, it } from "vitest"
import type { PluginPermission } from "./manifest"
import { permissionCovers } from "./security"

describe("permissionCovers", () => {
  it("rejects grants of a different type", () => {
    const granted: PluginPermission = { type: "network", hosts: ["*"] }
    const requested: PluginPermission = { type: "external-open", hosts: ["*"] }
    expect(permissionCovers(granted, requested)).toBe(false)
  })

  it("treats host lists as scopes so a broader grant covers a narrower request", () => {
    const granted: PluginPermission = { type: "network", hosts: ["a.com", "b.com"] }
    expect(permissionCovers(granted, { type: "network", hosts: ["a.com"] })).toBe(true)
    expect(permissionCovers(granted, { type: "network", hosts: ["a.com", "c.com"] })).toBe(false)
  })

  it("treats AI access lists as scopes", () => {
    const granted: PluginPermission = { type: "ai", access: ["generate", "context"] }
    expect(permissionCovers(granted, { type: "ai", access: ["generate"] })).toBe(true)
    expect(permissionCovers(granted, { type: "ai", access: ["tools"] })).toBe(false)
  })
})
