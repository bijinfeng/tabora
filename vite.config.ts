import { defineConfig } from "vite-plus"

export default defineConfig({
  test: {
    environment: "happy-dom",
    include: ["packages/**/*.test.ts", "packages/**/*.test.tsx", "apps/**/*.test.tsx"],
  },
  lint: {
    plugins: ["typescript"],
    options: {
      typeAware: true,
      typeCheck: true,
    },
    rules: {
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
    overrides: [
      {
        files: ["**/*.test.ts", "**/*.test.tsx"],
        plugins: ["typescript", "vitest"],
        rules: {
          "vitest/no-disabled-tests": "error",
        },
      },
    ],
  },
  fmt: {
    singleQuote: false,
    semi: false,
  },
  pack: {
    dts: true,
    exports: true,
  },
})
