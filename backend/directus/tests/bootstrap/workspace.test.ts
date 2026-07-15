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
const directusPackageJson = readFileSync(resolve(repoRoot, "backend/directus/package.json"), "utf8")

describe("directus workspace bootstrap", () => {
  it("includes backend/directus in pnpm workspace", () => {
    expect(existsSync(resolve(repoRoot, "backend/directus/package.json"))).toBe(true)
  })

  it("provides docker compose for directus stack", () => {
    expect(existsSync(resolve(repoRoot, "backend/directus/docker/compose.dev.yml"))).toBe(true)
    expect(existsSync(resolve(repoRoot, "backend/directus/docker/compose.prod.yml"))).toBe(true)
  })

  it("exposes schema provisioning scripts", () => {
    expect(directusPackageJson).toContain(
      '"schema:provision": "node --experimental-strip-types ./scripts/provisionSchema.ts"',
    )
  })

  it("pins backend/directus to Directus 12", () => {
    expect(directusPackageJson).toContain('"directus": "^12.1.1"')
  })
})
