import { describe, expect, it } from "vitest"
import { mapStrapiError, AUTH_ERROR_MESSAGES } from "./errors"

describe("mapStrapiError", () => {
  it("maps 401 to INVALID_CREDENTIALS", () => {
    const result = mapStrapiError(401, { error: { name: "UnauthorizedError" } })
    expect(result.code).toBe("INVALID_CREDENTIALS")
  })

  it("maps email-in-use message to EMAIL_IN_USE", () => {
    const result = mapStrapiError(400, {
      error: { name: "ApplicationError", message: "Email is already taken" },
    })
    expect(result.code).toBe("EMAIL_IN_USE")
  })

  it("maps ValidationError to INVALID_PAYLOAD", () => {
    const result = mapStrapiError(400, { error: { name: "ValidationError" } })
    expect(result.code).toBe("INVALID_PAYLOAD")
  })

  it("prefers email-in-use over generic 400", () => {
    const result = mapStrapiError(400, {
      error: { name: "ValidationError", message: "email is already exists" },
    })
    expect(result.code).toBe("EMAIL_IN_USE")
  })

  it("falls back to INVALID_CREDENTIALS for bare 400/401", () => {
    expect(mapStrapiError(400, {}).code).toBe("INVALID_CREDENTIALS")
    expect(mapStrapiError(401, {}).code).toBe("INVALID_CREDENTIALS")
  })

  it("falls back to UNKNOWN for other statuses", () => {
    expect(mapStrapiError(500, {}).code).toBe("UNKNOWN")
    expect(mapStrapiError(500, { error: { name: "Whatever" } }).code).toBe("UNKNOWN")
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
