import { readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

type ManifestField = {
  name: string
  type: string
  schema?: {
    is_unique?: boolean
    is_nullable?: boolean
    max_length?: number
  }
}

type Manifest = {
  collections: Array<{
    name: string
    fields: ManifestField[]
  }>
}

type LoginResponse = {
  data: {
    access_token: string
  }
}

type SnapshotResponse = {
  data: unknown
}

const directusUrl = process.env.DIRECTUS_URL ?? "http://localhost:8055"
const adminEmail = process.env.ADMIN_EMAIL ?? "admin@example.com"
const adminPassword = process.env.ADMIN_PASSWORD ?? "replace-me"

const directusRoot = resolve(process.cwd())
const manifestPath = resolve(directusRoot, "schema/manifest.json")
const snapshotPath = resolve(directusRoot, "schema/snapshot.json")

const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Manifest

async function requestJson<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${directusUrl}${path}`, init)
  const text = await response.text()

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${text}`)
  }

  return JSON.parse(text) as T
}

async function login(): Promise<string> {
  const result = await requestJson<LoginResponse>("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: adminEmail, password: adminPassword }),
  })

  return result.data.access_token
}

async function ensureCollection(token: string, name: string) {
  const body = JSON.stringify({
    collection: name,
    meta: {
      hidden: false,
      singleton: false,
      accountability: "all",
    },
    schema: {
      name,
    },
  })

  const response = await fetch(`${directusUrl}/collections`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body,
  })

  if (response.ok) return

  const text = await response.text()

  if (response.status === 400 && text.includes("already exists")) return
  if (response.status === 409) return

  throw new Error(`${response.status} ${response.statusText}: ${text}`)
}

async function ensureField(token: string, collection: string, manifestField: ManifestField) {
  const { name: field, type, schema: fieldSchema } = manifestField
  const response = await fetch(`${directusUrl}/fields/${collection}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      field,
      type,
      ...(fieldSchema ? { schema: fieldSchema } : {}),
    }),
  })

  if (response.ok) return

  const text = await response.text()

  if (response.status === 400 && text.includes("already exists")) return
  if (response.status === 409) return

  throw new Error(`${response.status} ${response.statusText}: ${text}`)
}

async function exportSnapshot(token: string) {
  const snapshot = await requestJson<SnapshotResponse>("/schema/snapshot", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  writeFileSync(snapshotPath, JSON.stringify(snapshot.data, null, 2) + "\n", "utf8")
}

async function main() {
  const token = await login()

  for (const collection of manifest.collections) {
    await ensureCollection(token, collection.name)
    for (const field of collection.fields) {
      await ensureField(token, collection.name, field)
    }
  }

  await exportSnapshot(token)

  process.stdout.write(`${snapshotPath}\n`)
}

await main()
