import type { UserConfig } from "vite"
import { mergeConfig, defineConfig, defineProject } from "vitest/config"
import solid from "vite-plugin-solid"

const sharedUnitInlineDeps = [
  /@kobalte\//,
  /solid-prevent-scroll/,
  /@corvu\//,
  /solid-presence/,
  /solid-/,
]

const sharedUnitExclude = ["**/*.e2e.test.ts", "**/*.e2e.test.tsx"]

export { sharedUnitExclude, sharedUnitInlineDeps }

export function defineUnitTestConfig(config: UserConfig = {}) {
  return mergeConfig(
    defineConfig({
      plugins: [solid({ hot: false })],
      test: {
        environment: "happy-dom",
        exclude: sharedUnitExclude,
        server: {
          deps: {
            inline: sharedUnitInlineDeps,
          },
        },
      },
    }),
    config,
  )
}

export function definePackageUnitTestConfig(config: UserConfig = {}) {
  return defineUnitTestConfig({
    test: {
      include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    },
    ...config,
  })
}

export function definePackageUnitTestProject(config: UserConfig = {}) {
  return defineProject(definePackageUnitTestConfig(config))
}
