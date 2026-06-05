import type { UserConfig } from "vite"
import { defineConfig, mergeConfig } from "vitest/config"

export function defineBrowserE2eConfig(config: UserConfig = {}) {
  return mergeConfig(
    defineConfig({
      test: {
        environment: "happy-dom",
        include: ["src/**/*.e2e.test.tsx"],
        testTimeout: 45_000,
      },
    }),
    config,
  )
}
