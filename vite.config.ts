import path from "node:path"
import solid from "vite-plugin-solid"
import { defineConfig } from "vite-plus"
import type { PackUserConfig } from "vite-plus/pack"

type PackageExports = Record<string, unknown>

type PackageManifestLike = {
  exports?: unknown
  publishConfig?: {
    exports?: unknown
  }
}

function cssExportsFrom(exportsField: unknown): Record<string, string> {
  if (!exportsField || typeof exportsField !== "object" || Array.isArray(exportsField)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(exportsField as PackageExports).flatMap(([key, value]) =>
      key.endsWith(".css") && typeof value === "string" ? [[key, value]] : [],
    ),
  )
}

function packageCssAssets(pkg?: PackageManifestLike) {
  const sourceCss = cssExportsFrom(pkg?.exports)
  const publishCss = cssExportsFrom(pkg?.publishConfig?.exports)

  return Object.entries(sourceCss).flatMap(([key, source]) => {
    const publish = publishCss[key]
    return publish ? [{ source, publish }] : []
  })
}

function packageCssCopyEntries(pkg?: PackageManifestLike) {
  return packageCssAssets(pkg)
    .filter(({ source, publish }) => source.startsWith("./src/") && publish.startsWith("./dist/"))
    .map(({ source, publish }) => {
      const from = source.slice(2)
      const publishPath = publish.slice(2)
      const sourceName = path.posix.basename(from)
      const publishName = path.posix.basename(publishPath)

      return {
        from,
        to: path.posix.dirname(publishPath),
        flatten: true,
        ...(sourceName === publishName ? {} : { rename: publishName }),
      }
    })
}

const pack = {
  dts: true,
  copy: (options) => packageCssCopyEntries(options.pkg),
  exports: {
    devExports: true,
    customExports(exports, context) {
      return {
        ...exports,
        ...cssExportsFrom(
          context.isPublish ? context.pkg?.publishConfig?.exports : context.pkg?.exports,
        ),
      }
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
    ignorePatterns: ["examples/**", "supabase/functions/**"],
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
