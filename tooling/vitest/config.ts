import type { UserConfig } from "vite"
import { mergeConfig, defineConfig, defineProject } from "vitest/config"
import solid from "vite-plugin-solid"

const sharedUnitInlineDeps = [
  /@kobalte\//,
  /solid-prevent-scroll/,
  /@corvu\//,
  /@dnd-kit\//,
  /solid-presence/,
  /solid-/,
]

const sharedUnitExclude = ["**/*.e2e.test.ts", "**/*.e2e.test.tsx"]

export { sharedUnitExclude, sharedUnitInlineDeps }

function stripMissingSourcemapCommentPlugin() {
  return {
    name: "tabora:strip-missing-sourcemap-comment",
    enforce: "pre",
    transform(code: string, id: string) {
      if (!id.includes("node_modules")) return
      if (!id.includes("@dnd-kit/solid")) return
      if (!code.includes("sourceMappingURL=")) return

      return {
        code: code.replace(/^\s*\/\/# sourceMappingURL=.*$/gm, ""),
        map: null,
      }
    },
  }
}

export function defineUnitTestConfig(config: UserConfig = {}) {
  return mergeConfig(
    defineConfig({
      logLevel: "error",
      plugins: [stripMissingSourcemapCommentPlugin(), solid({ hot: false })],
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
