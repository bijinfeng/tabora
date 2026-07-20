import path from "node:path"
import solid from "vite-plugin-solid"
import { defineConfig } from "vite-plus"
import type { PackUserConfig } from "vite-plus/pack"
import { createTaboraStylexPackPlugins, taboraStylexWorkspaceRoot } from "@tabora/stylex-config"

type PackageExports = Record<string, unknown>

type PackageManifestLike = {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  exports?: unknown
  publishConfig?: {
    exports?: unknown
  }
}

function packageUsesStylexStyles(pkg?: PackageManifestLike) {
  return (
    [pkg?.dependencies, pkg?.devDependencies, pkg?.peerDependencies].some(
      (dependencies) => dependencies?.["@stylexjs/stylex"] !== undefined,
    ) && typeof cssExportsFrom(pkg?.exports)["./styles.css"] === "string"
  )
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
  const stylexSource = packageUsesStylexStyles(pkg)
    ? cssExportsFrom(pkg?.exports)["./styles.css"]
    : undefined

  return packageCssAssets(pkg)
    .filter(({ source }) => source !== stylexSource)
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
  exports: false,
  platform: "browser",
  plugins: [
    ...createTaboraStylexPackPlugins({
      packageDir: process.cwd(),
      rootDir: taboraStylexWorkspaceRoot,
    }),
    solid(),
  ],
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
