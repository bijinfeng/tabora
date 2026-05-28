import solid from "vite-plugin-solid"
import { defineConfig } from "vite-plus"

export default defineConfig({
  plugins: [solid({ hot: false })],
  test: {
    environment: "happy-dom",
    include: ["packages/**/*.test.ts", "packages/**/*.test.tsx", "apps/**/*.test.tsx"],
    exclude: ["apps/**/*.e2e.test.tsx"],
    server: {
      deps: {
        inline: [/@kobalte\//, /solid-prevent-scroll/, /@corvu\//, /solid-presence/, /solid-/],
      },
    },
  },
  staged: {
    "*.{css,html,json,md,ts,tsx,yaml,yml}": "vp check --fix",
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
    exports: {
      devExports: true,
    },
    platform: "browser",
    plugins: [solid()],
  },
})
