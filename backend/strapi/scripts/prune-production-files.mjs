import { readdir, rm } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import path from "node:path"

const removableDirectories = new Set([
  "__tests__",
  "doc",
  "docs",
  "example",
  "examples",
  "test",
  "tests",
])
const removableExtensions = [".d.ts.map", ".d.ts", ".map", ".ts", ".tsx"]
const removableNames = /^(authors|changelog|contributing|history|readme)(\..+)?$/i

export async function pruneProductionFiles(root) {
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const target = path.join(root, entry.name)

    if (entry.isDirectory()) {
      if (removableDirectories.has(entry.name.toLowerCase())) {
        await rm(target, { force: true, recursive: true })
      } else {
        await pruneProductionFiles(target)
      }
    } else if (
      removableExtensions.some((extension) => entry.name.endsWith(extension)) ||
      removableNames.test(entry.name)
    ) {
      await rm(target, { force: true })
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await pruneProductionFiles(process.argv[2])
}
