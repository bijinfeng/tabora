import { describe, expect, it } from "vitest"

import { defineNodeUnitTestConfig, defineUnitTestConfig } from "./config"

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
      expect.arrayContaining([/@kobalte\//, /solid-prevent-scroll/, /@corvu\//, "lucide-solid"]),
    )
  })

  it("orders StyleX before Solid plugins and keeps StyleX in css-only dev mode", () => {
    const config = defineUnitTestConfig()
    const plugins = (config.plugins ?? []).flat() as Array<{ name?: string } | string>
    const pluginNames = plugins.map((plugin) =>
      plugin && typeof plugin === "object" && "name" in plugin ? plugin.name : "",
    )

    expect(pluginNames.some((name) => String(name).includes("stylex"))).toBe(true)
    expect(pluginNames.some((name) => String(name).includes("solid"))).toBe(true)
    expect(pluginNames.findIndex((name) => String(name).includes("stylex"))).toBeLessThan(
      pluginNames.findIndex((name) => String(name).includes("solid")),
    )
    const stylexPlugin = plugins.find(
      (plugin) => plugin && typeof plugin === "object" && "name" in plugin,
    )
    expect(stylexPlugin).toMatchObject({ __stylexDevMode: "css-only" })
  })

  it("prints the slowest imports only when profiling is requested", () => {
    const previousValue = process.env.TABORA_VITEST_PROFILE_IMPORTS
    process.env.TABORA_VITEST_PROFILE_IMPORTS = "1"

    try {
      expect(defineUnitTestConfig().test?.experimental?.importDurations).toEqual({
        limit: 20,
        print: true,
      })
      expect(defineNodeUnitTestConfig().test?.experimental?.importDurations).toEqual({
        limit: 20,
        print: true,
      })
    } finally {
      if (previousValue === undefined) delete process.env.TABORA_VITEST_PROFILE_IMPORTS
      else process.env.TABORA_VITEST_PROFILE_IMPORTS = previousValue
    }
  })

  it("creates lightweight Node projects without Solid or StyleX plugins", () => {
    const config = defineNodeUnitTestConfig()

    expect(config.test?.environment).toBe("node")
    expect(config.test?.exclude).toContain("**/*.e2e.test.ts")
    expect(config.plugins ?? []).toEqual([])
  })
})
