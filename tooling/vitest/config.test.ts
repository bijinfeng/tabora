import { describe, expect, it } from "vitest"

import { definePackageUnitTestProject, defineUnitTestConfig } from "./config"

describe("defineUnitTestConfig", () => {
  it("applies shared unit-test defaults and preserves custom include patterns", () => {
    const config = defineUnitTestConfig({
      test: {
        include: ["src/**/*.test.ts"],
      },
    })

    expect(config.test?.environment).toBe("happy-dom")
    expect(config.test?.include).toEqual(["src/**/*.test.ts"])
    expect(config.test?.exclude).toContain("**/*.e2e.test.ts")
    expect(config.test?.exclude).toContain("**/*.e2e.test.tsx")
    expect(config.test?.server?.deps?.inline).toEqual(
      expect.arrayContaining([/@kobalte\//, /solid-prevent-scroll/, /@corvu\//]),
    )
  })

  it("creates package project configs with shared defaults and local src globs", () => {
    const config = definePackageUnitTestProject()

    expect(config.test?.environment).toBe("happy-dom")
    expect(config.test?.include).toEqual(["src/**/*.test.ts", "src/**/*.test.tsx"])
    expect(config.test?.exclude).toContain("**/*.e2e.test.ts")
    expect(config.plugins).toHaveLength(1)
  })
})
