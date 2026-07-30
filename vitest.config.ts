import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    pool: "threads",
    projects: [
      "packages/*/vitest.config.ts",
      "apps/playground/vitest.config.ts",
      "apps/site/vitest.config.ts",
      "plugins/official/*/vitest.config.ts",
      "plugins/community/*/vitest.config.ts",
      "backend/strapi/vitest.config.ts",
      "tooling/stylex/vitest.config.ts",
      "tooling/vitest/vitest.config.ts",
    ],
  },
})
