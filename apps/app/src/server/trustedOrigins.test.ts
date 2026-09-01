import { describe, expect, it } from "vitest"

import type { AppEnv } from "./env"
import { resolveTrustedOrigins } from "./trustedOrigins"

const env = { corsOrigins: ["http://localhost:5173"] } as AppEnv

function requestFrom(origin: string) {
  return new Request("http://localhost:5175/api/auth/sign-up/email", {
    method: "POST",
    headers: { origin },
  })
}

describe("resolveTrustedOrigins", () => {
  it("keeps the configured whitelist when there is no request", () => {
    expect(resolveTrustedOrigins(env)).toEqual(["http://localhost:5173"])
  })

  it("trusts a shifted dev-server port on localhost", () => {
    expect(resolveTrustedOrigins(env, requestFrom("http://localhost:5175"))).toEqual([
      "http://localhost:5173",
      "http://localhost:5175",
    ])
  })

  it("trusts loopback IP and IPv6 loopback hosts", () => {
    expect(resolveTrustedOrigins(env, requestFrom("http://127.0.0.1:4000"))).toContain(
      "http://127.0.0.1:4000",
    )
    expect(resolveTrustedOrigins(env, requestFrom("http://[::1]:4000"))).toContain(
      "http://[::1]:4000",
    )
  })

  it("rejects remote origins so production still needs CORS_ORIGINS", () => {
    expect(resolveTrustedOrigins(env, requestFrom("https://evil.example.com"))).toEqual([
      "http://localhost:5173",
    ])
    // 前缀伪装：localhost 只能是主机名本身，不能是子域的一部分
    expect(resolveTrustedOrigins(env, requestFrom("https://localhost.evil.com"))).toEqual([
      "http://localhost:5173",
    ])
  })

  it("ignores non-http schemes and malformed origin headers", () => {
    expect(resolveTrustedOrigins(env, requestFrom("file://localhost"))).toEqual([
      "http://localhost:5173",
    ])
    expect(resolveTrustedOrigins(env, requestFrom("null"))).toEqual(["http://localhost:5173"])
  })

  it("does not duplicate an origin already whitelisted", () => {
    expect(resolveTrustedOrigins(env, requestFrom("http://localhost:5173"))).toEqual([
      "http://localhost:5173",
    ])
  })
})
