import { describe, expect, it } from "vitest"

import {
  defineNodePackageUnitTestProject,
  definePackageUnitTestProject,
  defineUnitTestConfig,
} from "./config"

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
    const pluginNames = (config.plugins ?? [])
      .flat()
      .map((plugin) =>
        plugin && typeof plugin === "object" && "name" in plugin ? plugin.name : "",
      )

    expect(config.test?.environment).toBe("happy-dom")
    expect(config.test?.include).toEqual(["src/**/*.test.ts", "src/**/*.test.tsx"])
    expect(config.test?.exclude).toContain("**/*.e2e.test.ts")
    expect(pluginNames.some((name) => String(name).includes("stylex"))).toBe(true)
    expect(pluginNames.some((name) => String(name).includes("solid"))).toBe(true)
    expect(pluginNames.findIndex((name) => String(name).includes("stylex"))).toBeLessThan(
      pluginNames.findIndex((name) => String(name).includes("solid")),
    )
    const stylexPlugin = (config.plugins ?? [])
      .flat()
      .find((plugin) => plugin && typeof plugin === "object" && "name" in plugin)
    expect(stylexPlugin).toMatchObject({ __stylexDevMode: "css-only" })
  })

  it("prints the slowest imports only when profiling is requested", () => {
    const previousValue = process.env.TABORA_VITEST_PROFILE_IMPORTS
    process.env.TABORA_VITEST_PROFILE_IMPORTS = "1"

    try {
      const config = defineUnitTestConfig()

      expect(config.test?.experimental?.importDurations).toEqual({
        limit: 20,
        print: true,
      })
      expect(defineNodePackageUnitTestProject().test?.experimental?.importDurations).toEqual({
        limit: 20,
        print: true,
      })
    } finally {
      if (previousValue === undefined) delete process.env.TABORA_VITEST_PROFILE_IMPORTS
      else process.env.TABORA_VITEST_PROFILE_IMPORTS = previousValue
    }
  })

  it("creates lightweight Node projects without Solid or StyleX plugins", () => {
    const config = defineNodePackageUnitTestProject()

    expect(config.test?.environment).toBe("node")
    expect(config.test?.include).toEqual(["src/**/*.test.ts", "src/**/*.test.tsx"])
    expect(config.test?.exclude).toContain("**/*.e2e.test.ts")
    expect(config.plugins ?? []).toEqual([])
  })
})
