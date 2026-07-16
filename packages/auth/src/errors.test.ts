import { describe, expect, it } from "vitest"
import { mapDirectusError, AUTH_ERROR_MESSAGES } from "./errors"

describe("mapDirectusError", () => {
  it("maps INVALID_CREDENTIALS from status 401", () => {
    const result = mapDirectusError(401, {
      errors: [{ extensions: { code: "INVALID_CREDENTIALS" } }],
    })
    expect(result.code).toBe("INVALID_CREDENTIALS")
  })

  it("maps RECORD_NOT_UNIQUE to EMAIL_IN_USE", () => {
    const result = mapDirectusError(400, {
      errors: [{ extensions: { code: "RECORD_NOT_UNIQUE" } }],
    })
    expect(result.code).toBe("EMAIL_IN_USE")
  })

  it("maps INVALID_PAYLOAD from status 400", () => {
    const result = mapDirectusError(400, { errors: [{ extensions: { code: "INVALID_PAYLOAD" } }] })
    expect(result.code).toBe("INVALID_PAYLOAD")
  })

  it("falls back to UNKNOWN for unrecognized codes", () => {
    const result = mapDirectusError(500, { errors: [{ extensions: { code: "WEIRD" } }] })
    expect(result.code).toBe("UNKNOWN")
  })

  it("falls back to UNKNOWN when body has no errors array", () => {
    const result = mapDirectusError(500, {})
    expect(result.code).toBe("UNKNOWN")
  })

  it("has a Chinese message for every error code", () => {
    for (const code of [
      "NETWORK_ERROR",
      "INVALID_CREDENTIALS",
      "INVALID_PAYLOAD",
      "EMAIL_IN_USE",
      "RESET_INVALID",
      "UNKNOWN",
    ] as const) {
      expect(AUTH_ERROR_MESSAGES[code]).toBeTruthy()
    }
  })
})
