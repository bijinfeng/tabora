import { describe, expect, it } from "vitest"

import { loadEnv } from "./env"

describe("model management environment", () => {
  it("uses a development-only credential encryption key when none is configured", () => {
    expect(loadEnv().modelCredentialEncryptionKey.length).toBeGreaterThanOrEqual(32)
  })
})
