import type { UserConfig } from "vite"
import { mergeConfig, defineConfig } from "vitest/config"
import solid from "vite-plugin-solid"
import { createTaboraStylexVitePlugin, taboraStylexWorkspaceRoot } from "@tabora/stylex-config"
import fs from "node:fs"
import path from "node:path"

const sharedUnitInlineDeps = [
  /@kobalte\//,
  /solid-prevent-scroll/,
  /@corvu\//,
  /@dnd-kit\//,
  /solid-presence/,
  /solid-/,
  "lucide-solid",
]

export { sharedUnitInlineDeps }

type AliasEntry = { find: RegExp; replacement: string }

function resolveWorkspaceAliases(): AliasEntry[] {
  const workspaceRoot = taboraStylexWorkspaceRoot
  const packagesDir = path.join(workspaceRoot, "packages")
  const entries: Array<{ key: string; value: string }> = []

  if (fs.existsSync(packagesDir)) {
    for (const dir of fs.readdirSync(packagesDir)) {
      const pkgPath = path.join(packagesDir, dir)
      const pkgJsonPath = path.join(pkgPath, "package.json")
      if (!fs.existsSync(pkgJsonPath)) continue
      try {
        const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"))
        const name = pkgJson.name
        if (typeof name === "string" && name.startsWith("@tabora/")) {
          const pushEntry = (key: string, entryValue: unknown) => {
            const entry =
              typeof entryValue === "string"
                ? entryValue
                : typeof (entryValue as { import?: string })?.import === "string"
                  ? (entryValue as { import: string }).import
                  : typeof (entryValue as { source?: string })?.source === "string"
                    ? (entryValue as { source: string }).source
                    : null
            if (entry) {
              const resolved = path.resolve(pkgPath, entry.replace(/^\.\//, ""))
              if (fs.existsSync(resolved) || fs.existsSync(resolved.replace(/\.ts$/, ".tsx"))) {
                entries.push({ key, value: resolved })
              }
            }
          }
          if (pkgJson.exports) {
            for (const [key, value] of Object.entries(pkgJson.exports as Record<string, unknown>)) {
              if (key === ".") {
                pushEntry(name, value)
              } else if (key.startsWith("./")) {
                pushEntry(`${name}/${key.slice(2)}`, value)
              }
            }
          }
        }
      } catch {}
    }
  }
  entries.sort((a, b) => b.key.length - a.key.length)
  return entries.map(({ key, value }) => ({
    find: new RegExp(`^${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`),
    replacement: value,
  }))
}

const workspaceAliases = resolveWorkspaceAliases()

export function resolveImportDurationsConfig() {
  if (process.env.TABORA_VITEST_PROFILE_IMPORTS !== "1") return

  return {
    limit: 20,
    print: true as const,
  }
}

function stripMissingSourcemapCommentPlugin() {
  return {
    name: "tabora:strip-missing-sourcemap-comment",
    enforce: "pre",
    transform(code: string, id: string) {
      if (!id.includes("node_modules")) return
      if (!id.includes("@dnd-kit/solid")) return
      if (!code.includes("sourceMappingURL=")) return

      return {
        code: code.replace(/^\s*\/\/# sourceMappingURL=.*$/gm, ""),
        map: null,
      }
    },
  }
}

export function defineUnitTestConfig(config: UserConfig = {}) {
  return mergeConfig(
    defineConfig({
      logLevel: "error",
      resolve: {
        alias: workspaceAliases,
      },
      plugins: [
        createTaboraStylexVitePlugin({
          rootDir: taboraStylexWorkspaceRoot,
          dev: false,
          devMode: "css-only",
        }),
        stripMissingSourcemapCommentPlugin(),
        solid({ hot: false }),
      ],
      test: {
        environment: "happy-dom",
        experimental: {
          importDurations: resolveImportDurationsConfig(),
        },
        server: {
          deps: {
            inline: sharedUnitInlineDeps,
          },
        },
      },
    }),
    config,
  )
}

export function defineNodeUnitTestConfig(config: UserConfig = {}) {
  return mergeConfig(
    defineConfig({
      logLevel: "error",
      resolve: {
        alias: workspaceAliases,
      },
      test: {
        environment: "node",
        experimental: {
          importDurations: resolveImportDurationsConfig(),
        },
      },
    }),
    config,
  )
}
