import { defineProject } from "vitest/config"

import { defineUnitTestConfig } from "./config"

export default defineProject(
  defineUnitTestConfig({
    test: {
      name: "tooling",
      include: ["tooling/vitest/**/*.test.ts"],
    },
  }),
)
