import { defineConfig, defineProject } from "vitest/config"

import {
  defineNodeUnitTestConfig,
  defineUnitTestConfig,
  resolveImportDurationsConfig,
} from "./tooling/vitest/config"

// 按测试环境而非按 package 划分 project：每个 project 共享一个 Vite server，
// worker 上限保持一半逻辑核可用，避免全量测试打满 CPU。
const nodeUnitProject = defineProject(
  defineNodeUnitTestConfig({
    test: {
      name: "node",
      include: [
        "packages/{ai-runtime,auth,host-adapters,orchestrator,platform-kernel,plugin-api,storage,sync}/src/**/*.test.{ts,tsx}",
        "apps/fnos/backend/src/**/*.test.{ts,tsx}",
        "tooling/stylex/src/**/*.test.{ts,tsx}",
        "tooling/vitest/**/*.test.ts",
      ],
    },
  }),
)

const domUnitProject = defineProject(
  defineUnitTestConfig({
    test: {
      name: "dom",
      include: [
        "packages/{brand,builtin-plugin-registry,official-plugins,theme,tiptap-editor,ui,workbench-app,workbench-shell}/src/**/*.test.{ts,tsx}",
        "apps/app/src/workbench/**/*.test.{ts,tsx}",
        "apps/site/src/**/*.test.{ts,tsx}",
        "plugins/official/*/src/**/*.test.{ts,tsx}",
        "plugins/community/*/src/**/*.test.{ts,tsx}",
      ],
    },
  }),
)

const backendProject = defineProject({
  test: {
    name: "backend",
    environment: "node",
    include: ["apps/app/src/**/*.test.{ts,tsx}"],
    exclude: ["apps/app/src/workbench/**/*.test.{ts,tsx}"],
    testTimeout: 20_000,
  },
})

export default defineConfig({
  test: {
    pool: "threads",
    maxWorkers: "50%",
    experimental: {
      importDurations: resolveImportDurationsConfig(),
    },
    projects: [nodeUnitProject, domUnitProject, backendProject],
  },
})
