/// <reference types="node" />

import { describe, expect, it } from "vitest"
import { readdir, readFile } from "node:fs/promises"
import path from "node:path"

type ForbiddenPluginImport = {
  filePath: string
  specifier: string
  reason: string
}

const FORBIDDEN_IMPORTS = [
  {
    matches: (specifier: string) =>
      specifier === "@tabora/workbench-shell" || specifier.startsWith("@tabora/workbench-shell/"),
    reason: "plugins must not import host shell internals",
  },
  {
    matches: (specifier: string) =>
      specifier === "@tabora/storage" || specifier.startsWith("@tabora/storage/"),
    reason: "plugins must use host-provided runtime data ports",
  },
  {
    matches: (specifier: string) => specifier.includes("apps/") || specifier.startsWith("app/"),
    reason: "plugins must not import app source paths",
  },
]

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"])

function findForbiddenPluginImports(options: {
  filePath: string
  source: string
}): ForbiddenPluginImport[] {
  const imports = extractImportSpecifiers(options.source)
  return imports.flatMap((specifier) =>
    FORBIDDEN_IMPORTS.filter((rule) => rule.matches(specifier)).map((rule) => ({
      filePath: options.filePath,
      specifier,
      reason: rule.reason,
    })),
  )
}

async function scanPluginSourceBoundaries(rootDir: string): Promise<ForbiddenPluginImport[]> {
  const sourceFiles = await pluginSourceFiles(rootDir)
  const findings: ForbiddenPluginImport[] = []

  for (const filePath of sourceFiles) {
    const source = await readFile(filePath, "utf8")
    findings.push(
      ...findForbiddenPluginImports({
        filePath: path.relative(rootDir, filePath),
        source,
      }),
    )
  }

  return findings
}

function extractImportSpecifiers(source: string): string[] {
  const specifiers: string[] = []
  const importPattern =
    /(?:import\s+(?:type\s+)?(?:[^"'()]+?\s+from\s+)?|export\s+(?:type\s+)?[^"'()]+?\s+from\s+|import\s*\()\s*["']([^"']+)["']/g

  for (const match of source.matchAll(importPattern)) {
    if (match[1]) specifiers.push(match[1])
  }

  return specifiers
}

async function pluginSourceFiles(rootDir: string): Promise<string[]> {
  const roots = [
    path.join(rootDir, "packages", "official-plugins", "src"),
    path.join(rootDir, "plugins"),
  ]
  const files: string[] = []

  for (const dir of roots) {
    await collectSourceFiles(dir, files)
  }

  return files
}

async function collectSourceFiles(dir: string, files: string[]): Promise<void> {
  let entries: Array<{ name: string; isDirectory(): boolean }>
  try {
    entries = (await readdir(dir, { withFileTypes: true })) as Array<{
      name: string
      isDirectory(): boolean
    }>
  } catch {
    return
  }

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      await collectSourceFiles(entryPath, files)
    } else if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(entryPath)
    }
  }
}

describe("plugin dependency boundaries", () => {
  it("detects forbidden imports in plugin source", () => {
    expect(
      findForbiddenPluginImports({
        filePath: "plugins/example/src/index.ts",
        source: `
          import { SettingsHost } from "@tabora/workbench-shell"
          import type { WorkspaceRepository } from "@tabora/storage"
          import { helper } from "../../apps/playground/src/helper"
        `,
      }),
    ).toEqual([
      {
        filePath: "plugins/example/src/index.ts",
        specifier: "@tabora/workbench-shell",
        reason: "plugins must not import host shell internals",
      },
      {
        filePath: "plugins/example/src/index.ts",
        specifier: "@tabora/storage",
        reason: "plugins must use host-provided runtime data ports",
      },
      {
        filePath: "plugins/example/src/index.ts",
        specifier: "../../apps/playground/src/helper",
        reason: "plugins must not import app source paths",
      },
    ])
  })

  it("official, community, and example plugins do not import forbidden host internals", async () => {
    await expect(scanPluginSourceBoundaries(process.cwd())).resolves.toEqual([])
  })
})
