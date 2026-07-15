import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

function resolveDirectusRoot() {
  const cwd = process.cwd()

  if (existsSync(resolve(cwd, "schema/manifest.json"))) return cwd
  if (existsSync(resolve(cwd, "backend/directus/schema/manifest.json"))) {
    return resolve(cwd, "backend/directus")
  }

  return cwd
}

const directusRoot = resolveDirectusRoot()
const manifestPath = resolve(directusRoot, "schema/manifest.json")
const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
  collections: Array<{ name: string; fields: Array<{ name: string; type: string }> }>
}
const packageJsonPath = resolve(directusRoot, "package.json")
const packageJson = readFileSync(packageJsonPath, "utf8")

describe("directus schema snapshot", () => {
  it("declares sync collections and field skeletons", () => {
    const names = new Set(manifest.collections.map((c) => c.name))

    expect(names.has("sync_devices")).toBe(true)
    expect(names.has("synced_records")).toBe(true)
    expect(names.has("sync_snapshots")).toBe(true)
    expect(names.has("sync_conflicts")).toBe(true)
    expect(names.has("sync_operation_logs")).toBe(true)

    const syncDevices = manifest.collections.find((c) => c.name === "sync_devices")
    expect(syncDevices?.fields.some((f) => f.name === "device_key")).toBe(true)

    const syncedRecords = manifest.collections.find((c) => c.name === "synced_records")
    expect(syncedRecords?.fields.some((f) => f.name === "record_key")).toBe(true)

    const syncConflicts = manifest.collections.find((c) => c.name === "sync_conflicts")
    expect(syncConflicts?.fields.some((f) => f.name === "local_payload")).toBe(true)

    const syncLogs = manifest.collections.find((c) => c.name === "sync_operation_logs")
    expect(syncLogs?.fields.some((f) => f.name === "operation")).toBe(true)
  })

  it("declares attachment collections and governance fields", () => {
    const names = new Set(manifest.collections.map((c) => c.name))

    expect(names.has("attachment_refs")).toBe(true)
    expect(names.has("attachment_policies")).toBe(true)

    const attachmentRefs = manifest.collections.find((c) => c.name === "attachment_refs")
    expect(attachmentRefs?.fields.some((f) => f.name === "file_id")).toBe(true)
    expect(attachmentRefs?.fields.some((f) => f.name === "owner_user_id")).toBe(true)

    const attachmentPolicies = manifest.collections.find((c) => c.name === "attachment_policies")
    expect(attachmentPolicies?.fields.some((f) => f.name === "mime_whitelist")).toBe(true)
    expect(attachmentPolicies?.fields.some((f) => f.name === "max_size_bytes")).toBe(true)
  })

  it("wires the bootstrap script into the package entrypoints", () => {
    expect(packageJson).toContain(
      '"bootstrap": "node --experimental-strip-types ./scripts/bootstrap.ts"',
    )
    expect(packageJson).toContain(
      '"schema:provision": "node --experimental-strip-types ./scripts/provisionSchema.ts"',
    )
  })
})
