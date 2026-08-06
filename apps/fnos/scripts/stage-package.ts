import { cp, mkdir, readdir, rm } from "node:fs/promises"
import { createRequire } from "node:module"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const require = createRequire(import.meta.url)
const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const frontendDist = join(packageRoot, "frontend", "dist")
const backendBundle = join(packageRoot, "dist", "server", "server.mjs")
const packageServer = join(packageRoot, "tabora", "app", "dist")
const packagePublic = join(packageServer, "public")
const sqliteSource = dirname(require.resolve("better-sqlite3/package.json"))
const sqliteTarget = join(packageServer, "node_modules", "better-sqlite3")

await rm(packageServer, { recursive: true, force: true })
await mkdir(packageServer, { recursive: true })
await cp(backendBundle, join(packageServer, "server.mjs"))
await cp(frontendDist, packagePublic, { recursive: true })

await mkdir(sqliteTarget, { recursive: true })
for (const entry of ["package.json", "LICENSE", "lib"] as const) {
  await cp(join(sqliteSource, entry), join(sqliteTarget, entry), { recursive: true })
}

const sqlitePrebuilds = (await readdir(join(sqliteSource, "prebuilds"))).filter((file) =>
  /^linux(?:musl)?-(?:arm64|x64)\.node$/.test(file),
)
const sqlitePrebuildTarget = join(sqliteTarget, "prebuilds")
await mkdir(sqlitePrebuildTarget, { recursive: true })
for (const prebuild of sqlitePrebuilds) {
  await cp(join(sqliteSource, "prebuilds", prebuild), join(sqlitePrebuildTarget, prebuild))
}

await mkdir(join(packageRoot, "tabora", "wizard"), { recursive: true })
