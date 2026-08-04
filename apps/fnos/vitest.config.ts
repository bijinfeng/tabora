import { defineNodeUnitTestConfig } from "../../tooling/vitest/config"

export default defineNodeUnitTestConfig({
  test: {
    include: ["backend/src/**/*.test.ts"],
  },
})
