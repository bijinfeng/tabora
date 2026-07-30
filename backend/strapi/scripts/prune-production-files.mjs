import { readFile, readdir, rm } from "node:fs/promises"
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
const removableNames =
  /^(authors|changelog|contributing|history|readme)(\.(md|markdown|rst|txt))?$/i

export async function pruneProductionFiles(root, runtime = detectRuntime()) {
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const target = path.join(root, entry.name)

    if (entry.isDirectory()) {
      if (
        removableDirectories.has(entry.name.toLowerCase()) ||
        (isPackageDirectory(target) && (await isIncompatiblePackage(target, runtime)))
      ) {
        await rm(target, { force: true, recursive: true })
      } else {
        await pruneProductionFiles(target, runtime)
      }
    } else if (
      removableExtensions.some((extension) => entry.name.endsWith(extension)) ||
      removableNames.test(entry.name)
    ) {
      await rm(target, { force: true })
    }
  }
}

function detectRuntime() {
  const glibcVersion = process.report?.getReport().header.glibcVersionRuntime

  return {
    os: process.platform,
    cpu: process.arch,
    libc: process.platform === "linux" ? (glibcVersion ? "glibc" : "musl") : undefined,
  }
}

function isPackageDirectory(directory) {
  const parent = path.dirname(directory)

  return (
    path.basename(parent) === "node_modules" ||
    (path.basename(parent).startsWith("@") &&
      path.basename(path.dirname(parent)) === "node_modules")
  )
}

async function isIncompatiblePackage(directory, runtime) {
  try {
    const manifest = JSON.parse(await readFile(path.join(directory, "package.json"), "utf8"))

    return (
      !matchesConstraint(manifest.os, runtime.os) ||
      !matchesConstraint(manifest.cpu, runtime.cpu) ||
      !matchesConstraint(manifest.libc, runtime.libc)
    )
  } catch (error) {
    if (error?.code === "ENOENT") return false
    throw error
  }
}

function matchesConstraint(value, current) {
  if (!value || !current) return true

  const constraints = Array.isArray(value) ? value : [value]
  if (constraints.includes(`!${current}`)) return false

  const allowed = constraints.filter((constraint) => !constraint.startsWith("!"))
  return allowed.length === 0 || allowed.includes(current)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await pruneProductionFiles(process.argv[2])
}
