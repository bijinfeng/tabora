import { execFile } from "node:child_process"
import { mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { promisify } from "node:util"
import { describe, expect, it } from "vitest"

const repositoryRoot = process.cwd()
const execFileAsync = promisify(execFile)

describe("StyleX package build helper", () => {
  it("precompiles Solid TSX packages into JavaScript and a non-empty CSS asset", async () => {
    const fixtureDir = await mkdtemp(join(repositoryRoot, ".tabora-stylex-package-"))

    try {
      const fixtureManifest = JSON.stringify(
        {
          name: "@tabora/stylex-solid-fixture",
          private: true,
          type: "module",
          scripts: {
            build: "vp pack src/index.tsx",
          },
          exports: {
            ".": "./src/index.tsx",
            "./styles.css": "./src/styles.css",
          },
          publishConfig: {
            exports: {
              ".": "./dist/index.js",
              "./styles.css": "./dist/styles.css",
            },
          },
          dependencies: {
            "@stylexjs/stylex": "catalog:style",
            "solid-js": "catalog:ui",
          },
        },
        null,
        2,
      )
      await writeFile(join(fixtureDir, "package.json"), fixtureManifest)
      await mkdir(join(fixtureDir, "src"))
      await writeFile(
        join(fixtureDir, "src/index.tsx"),
        [
          'import * as stylex from "@stylexjs/stylex"',
          "",
          "type ProbeProps = { label: string }",
          "",
          "const styles = stylex.create({",
          "  root: {",
          '    color: "rgb(255, 0, 0)",',
          '    display: "flex",',
          "  },",
          "})",
          "",
          "export function Probe(props: ProbeProps) {",
          "  return <div {...stylex.props(styles.root)}>{props.label}</div>",
          "}",
          "",
        ].join("\n"),
      )
      await writeFile(
        join(fixtureDir, "src/styles.css"),
        ["@layer reset {", "  :root {", "    --fixture-global: 1;", "  }", "}", ""].join("\n"),
      )

      await execFileAsync("/usr/bin/env", ["pnpm", "exec", "vp", "pack", "src/index.tsx"], {
        cwd: fixtureDir,
      })

      const distFiles = await readdir(join(fixtureDir, "dist"), { recursive: true })
      expect(distFiles).toContain("styles.css")

      const css = await readFile(join(fixtureDir, "dist/styles.css"), "utf8")
      const js = await readFile(join(fixtureDir, "dist/index.js"), "utf8")
      const manifestAfterBuild = await readFile(join(fixtureDir, "package.json"), "utf8")

      expect(css).toMatch(/\.x[a-zA-Z0-9_-]+\s*\{/)
      expect(css).toMatch(/color:\s*red/)
      expect(css).toContain("--fixture-global: 1")
      expect(css.length).toBeGreaterThan(20)
      expect(js).not.toContain("stylex.create(")
      expect(js).not.toContain("ProbeProps")
      expect(manifestAfterBuild).toBe(fixtureManifest)

      await expect(stat(join(fixtureDir, ".stylex-build"))).rejects.toMatchObject({
        code: "ENOENT",
      })
    } finally {
      await rm(fixtureDir, { recursive: true, force: true })
    }
  }, 60_000)
})
