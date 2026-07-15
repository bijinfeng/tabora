import { existsSync } from "node:fs"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

function resolveRepoRoot() {
  const cwd = process.cwd()

  if (existsSync(resolve(cwd, "pnpm-workspace.yaml"))) return cwd
  if (existsSync(resolve(cwd, "../../pnpm-workspace.yaml"))) return resolve(cwd, "../..")

  return cwd
}

const repoRoot = resolveRepoRoot()
const rootPackageJson = readFileSync(resolve(repoRoot, "package.json"), "utf8")
const directusPackageJson = readFileSync(resolve(repoRoot, "backend/directus/package.json"), "utf8")

describe("directus workspace bootstrap", () => {
  it("includes backend/directus in pnpm workspace", () => {
    expect(existsSync(resolve(repoRoot, "backend/directus/package.json"))).toBe(true)
  })

  it("provides docker compose for directus stack", () => {
    expect(existsSync(resolve(repoRoot, "infra/docker/compose.directus.yml"))).toBe(true)
  })

  it("exposes bootstrap scripts for schema initialization", () => {
    expect(rootPackageJson).toContain(
      '"directus:bootstrap": "pnpm --dir backend/directus bootstrap"',
    )
    expect(directusPackageJson).toContain(
      '"bootstrap": "node --experimental-strip-types ./scripts/bootstrap.ts"',
    )
  })

  it("pins backend/directus to Directus 12", () => {
    expect(directusPackageJson).toContain('"directus": "^12.1.1"')
  })
})
