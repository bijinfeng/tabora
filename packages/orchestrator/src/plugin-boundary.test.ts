/// <reference types="node" />

import { describe, expect, it } from "vitest"
import { existsSync } from "node:fs"
import { readdir, readFile } from "node:fs/promises"
import path from "node:path"

type ForbiddenPluginImport = {
  filePath: string
  specifier: string
  reason: string
}

type ForbiddenPluginDependency = {
  filePath: string
  dependency: string
  section: string
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
    matches: (specifier: string) =>
      specifier.includes("apps/") ||
      specifier.startsWith("app/") ||
      specifier === "@tabora/playground" ||
      specifier.startsWith("@tabora/playground/") ||
      specifier === "@tabora/extension" ||
      specifier.startsWith("@tabora/extension/"),
    reason: "plugins must not import app source paths",
  },
]

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"])
const DEPENDENCY_SECTIONS = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
] as const

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
  const repositoryRoot = resolveRepositoryRoot(rootDir)
  const sourceFiles = await pluginSourceFiles(repositoryRoot)
  const findings: ForbiddenPluginImport[] = []

  for (const filePath of sourceFiles) {
    const source = await readFile(filePath, "utf8")
    findings.push(
      ...findForbiddenPluginImports({
        filePath: path.relative(repositoryRoot, filePath),
        source,
      }),
    )
  }

  return findings
}

async function scanPluginPackageBoundaries(rootDir: string): Promise<ForbiddenPluginDependency[]> {
  const repositoryRoot = resolveRepositoryRoot(rootDir)
  const packageFiles = [
    path.join(repositoryRoot, "packages", "official-plugins", "package.json"),
    ...(await pluginPackageFiles(path.join(repositoryRoot, "plugins"))),
  ]
  const findings: ForbiddenPluginDependency[] = []

  for (const filePath of packageFiles) {
    const source = await readFile(filePath, "utf8")
    const manifest = JSON.parse(source) as Record<string, Record<string, string> | undefined>

    findings.push(
      ...findForbiddenPluginDependencies({
        filePath: path.relative(repositoryRoot, filePath),
        manifest,
      }),
    )
  }

  return findings
}

function findForbiddenPluginDependencies(options: {
  filePath: string
  manifest: Record<string, Record<string, string> | undefined>
}): ForbiddenPluginDependency[] {
  return DEPENDENCY_SECTIONS.flatMap((section) =>
    Object.keys(options.manifest[section] ?? {}).flatMap((dependency) =>
      FORBIDDEN_IMPORTS.filter((rule) => rule.matches(dependency)).map((rule) => ({
        filePath: options.filePath,
        dependency,
        section,
        reason: rule.reason,
      })),
    ),
  )
}

function resolveRepositoryRoot(startDir: string): string {
  if (existsSync(path.join(startDir, "packages", "official-plugins", "package.json"))) {
    return startDir
  }

  return path.resolve(startDir, "../..")
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

async function pluginPackageFiles(rootDir: string): Promise<string[]> {
  const files: string[] = []
  await collectPackageFiles(rootDir, files)
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

async function collectPackageFiles(dir: string, files: string[]): Promise<void> {
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
      await collectPackageFiles(entryPath, files)
    } else if (entry.name === "package.json") {
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

  it("detects forbidden dependencies in plugin packages", () => {
    expect(
      findForbiddenPluginDependencies({
        filePath: "plugins/example/package.json",
        manifest: {
          dependencies: {
            "@tabora/workbench-shell": "workspace:*",
            "@tabora/storage": "workspace:*",
            "@tabora/playground": "workspace:*",
          },
        },
      }),
    ).toEqual([
      {
        filePath: "plugins/example/package.json",
        dependency: "@tabora/workbench-shell",
        section: "dependencies",
        reason: "plugins must not import host shell internals",
      },
      {
        filePath: "plugins/example/package.json",
        dependency: "@tabora/storage",
        section: "dependencies",
        reason: "plugins must use host-provided runtime data ports",
      },
      {
        filePath: "plugins/example/package.json",
        dependency: "@tabora/playground",
        section: "dependencies",
        reason: "plugins must not import app source paths",
      },
    ])
  })

  it("official, community, and example plugins do not import forbidden host internals", async () => {
    await expect(scanPluginSourceBoundaries(process.cwd())).resolves.toEqual([])
  })

  it("official, community, and example plugin packages do not depend on forbidden host internals", async () => {
    await expect(scanPluginPackageBoundaries(process.cwd())).resolves.toEqual([])
  })
})
