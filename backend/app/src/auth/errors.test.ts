import { describe, expect, it } from "vitest"
import { toAuthMessage } from "./errors"

describe("toAuthMessage", () => {
  it("maps network errors to a recoverable connection message", () => {
    expect(toAuthMessage(new Error("network request failed"))).toBe("无法连接管理服务，请稍后重试")
  })

  it("maps authentication failures to the credential message", () => {
    expect(toAuthMessage({ status: 401, message: "invalid credentials" })).toBe("邮箱或密码错误")
  })

  it("keeps unknown thrown values safe", () => {
    expect(toAuthMessage(null)).toBe("操作失败，请稍后重试")
    expect(toAuthMessage("unexpected")).toBe("操作失败，请稍后重试")
  })
})
