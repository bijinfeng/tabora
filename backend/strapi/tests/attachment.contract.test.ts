import { describe, it, expect } from "vitest"
import { validateFileAgainstPolicy } from "../src/api/attachment/services/attachment"

describe("validateFileAgainstPolicy", () => {
  it("无 policy 直接通过", () => {
    expect(() =>
      validateFileAgainstPolicy({ id: 1, mime: "image/png", size: 10 }, null),
    ).not.toThrow()
  })
  it("mime 不在白名单抛错", () => {
    expect(() =>
      validateFileAgainstPolicy(
        { id: 1, mime: "application/x-msdownload", size: 10 },
        { entity_type: "note", mime_whitelist: ["image/png"], max_size_bytes: null },
      ),
    ).toThrow(/not allowed/)
  })
  it("超出大小抛错", () => {
    expect(() =>
      validateFileAgainstPolicy(
        { id: 1, mime: "image/png", size: 999 },
        { entity_type: "note", mime_whitelist: null, max_size_bytes: 100 },
      ),
    ).toThrow(/exceeds maximum/)
  })
  it("mime 在白名单且大小合规通过", () => {
    expect(() =>
      validateFileAgainstPolicy(
        { id: 1, mime: "image/png", size: 50 },
        { entity_type: "note", mime_whitelist: ["image/png"], max_size_bytes: 100 },
      ),
    ).not.toThrow()
  })
})
