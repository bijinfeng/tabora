import { spawnSync } from "node:child_process"
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const repositoryRoot = path.resolve(packageDir, "..", "..")
const vpBinaryPath =
  process.platform === "win32"
    ? path.join(repositoryRoot, "node_modules", ".bin", "vp.cmd")
    : path.join(repositoryRoot, "node_modules", ".bin", "vp")

describe("assetPaths build", () => {
  it("keeps the asset path subpath export available for workspace consumers", () => {
    const packageJson = JSON.parse(readFileSync(path.join(packageDir, "package.json"), "utf8")) as {
      exports?: Record<string, string>
    }

    expect(packageJson.exports).toMatchObject({
      ".": "./src/index.ts",
      "./assetPaths": "./src/assetPaths.ts",
      "./vite": "./src/vite.ts",
      "./package.json": "./package.json",
    })
  })

  it("bundles node-side asset path helpers without unresolved import warnings", () => {
    const sandboxDir = mkdtempSync(path.join(tmpdir(), "tabora-brand-build-"))
    mkdirSync(path.join(sandboxDir, "src"), { recursive: true })

    writeFileSync(
      path.join(sandboxDir, "package.json"),
      readFileSync(path.join(packageDir, "package.json"), "utf8"),
    )
    writeFileSync(
      path.join(sandboxDir, "tsconfig.json"),
      readFileSync(path.join(packageDir, "tsconfig.json"), "utf8"),
    )
    writeFileSync(
      path.join(sandboxDir, "src", "assetPaths.ts"),
      readFileSync(path.join(packageDir, "src", "assetPaths.ts"), "utf8"),
    )

    const result = spawnSync(
      vpBinaryPath,
      ["pack", "src/assetPaths.ts", "--no-write", "--logLevel", "info"],
      {
        cwd: sandboxDir,
        encoding: "utf8",
      },
    )
    const output = `${result.stdout}\n${result.stderr}`

    try {
      expect(result.status).toBe(0)
      expect(output).not.toContain("[UNRESOLVED_IMPORT]")
      expect(output).not.toContain("Could not resolve 'node:path'")
      expect(output).not.toContain("Could not resolve 'node:url'")
    } finally {
      rmSync(sandboxDir, { force: true, recursive: true })
    }
  }, 20_000)
})
