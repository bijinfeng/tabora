import solid from "vite-plugin-solid"
import { defineConfig } from "vite-plus"
import type { PackUserConfig } from "vite-plus/pack"

type PackageExports = Record<string, unknown>

function withStylesExport(exports: PackageExports, stylesExport: string): PackageExports {
  const orderedExports: PackageExports = {}

  if ("." in exports) {
    orderedExports["."] = exports["."]
  }
  orderedExports["./styles.css"] = stylesExport

  for (const [key, value] of Object.entries(exports)) {
    if (key !== "." && key !== "./styles.css") {
      orderedExports[key] = value
    }
  }

  return orderedExports
}

const pack = {
  dts: true,
  copy: (options) => {
    if (options.pkg?.name === "@tabora/ui") {
      return [{ from: "src/tokens/theme.css", to: "dist/theme.css", flatten: true }]
    }
    if (options.pkg?.name === "@tabora/official-plugins") {
      return [{ from: "src/styles.css", to: "dist", flatten: true }]
    }
    return []
  },
  exports: {
    devExports: true,
    customExports(exports, context) {
      if (context.pkg.name === "@tabora/ui") {
        return withStylesExport(
          exports,
          context.isPublish ? "./dist/theme.css" : "./src/tokens/theme.css",
        )
      }
      if (context.pkg.name === "@tabora/official-plugins") {
        return withStylesExport(
          exports,
          context.isPublish ? "./dist/styles.css" : "./src/styles.css",
        )
      }
      return exports
    },
  },
  platform: "browser",
  plugins: [solid()],
} as PackUserConfig

export default defineConfig({
  plugins: [solid({ hot: false })],
  staged: {
    "*.{css,html,json,md,ts,tsx,yaml,yml}": "vp check --fix",
  },
  lint: {
    plugins: ["typescript"],
    options: {
      typeAware: true,
      typeCheck: true,
    },
    ignorePatterns: ["examples/**"],
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
  pack,
})
