import { readdir, readFile } from "node:fs/promises"
import path from "node:path"

const MODULE_MOCK_PATTERN = /\b(?:vi|jest)\.mock\s*\(/g
const COLLABORATOR_ASSERTION_PATTERN = /\.toHaveBeenCalled(?:Times|With|Once)?\s*\(/g
const OBSERVABLE_ASSERTION_PATTERN =
  /\.(?:toBe|toBeTruthy|toBeFalsy|toBeNull|toBeDefined|toEqual|toStrictEqual|toContain|toMatchObject|toHaveTextContent|toBeInTheDocument|toHaveAttribute|toHaveProperty|toThrow)\s*\(/g
const SNAPSHOT_ASSERTION_PATTERN = /\.toMatch(?:Inline)?Snapshot\s*\(/g
const TEST_FILE_PATTERN = /\.(?:test|spec)\.[cm]?[jt]sx?$/
const IGNORED_DIRECTORY_NAMES = new Set([
  ".git",
  ".pnpm-store",
  "coverage",
  "dist",
  "node_modules",
])

export function analyzeTestSource(options) {
  const executableSource = stripNonExecutableText(options.source)
  const mockCount = countMatches(executableSource, MODULE_MOCK_PATTERN)
  const collaboratorAssertionCount = countMatches(executableSource, COLLABORATOR_ASSERTION_PATTERN)
  const observableAssertionCount = countMatches(executableSource, OBSERVABLE_ASSERTION_PATTERN)
  const snapshotCount = countMatches(executableSource, SNAPSHOT_ASSERTION_PATTERN)
  const reviewReasons = []

  if (mockCount >= 3) {
    reviewReasons.push(`${mockCount} module mocks`)
  }

  if (collaboratorAssertionCount > 0 && observableAssertionCount === 0) {
    reviewReasons.push("only asserts collaborator calls")
  }

  if (snapshotCount >= 3) {
    reviewReasons.push(`${snapshotCount} snapshot assertions`)
  }

  return {
    filePath: options.filePath,
    mockCount,
    snapshotCount,
    collaboratorAssertionCount,
    observableAssertionCount,
    reviewReasons,
  }
}

export async function collectTestInventory(rootDir) {
  const absoluteRootDir = path.resolve(rootDir)
  const testPaths = await collectTestPaths(absoluteRootDir, absoluteRootDir)

  return Promise.all(
    testPaths.map(async (absolutePath) =>
      analyzeTestSource({
        filePath: toRepositoryPath(absoluteRootDir, absolutePath),
        source: await readFile(absolutePath, "utf8"),
      }),
    ),
  )
}

export function buildTestInventoryReport(entries) {
  const candidates = entries.filter((entry) => entry.reviewReasons.length > 0)
  const totalMocks = entries.reduce((total, entry) => total + entry.mockCount, 0)
  const totalSnapshots = entries.reduce((total, entry) => total + entry.snapshotCount, 0)
  const totalCollaboratorAssertions = entries.reduce(
    (total, entry) => total + entry.collaboratorAssertionCount,
    0,
  )

  return [
    "Test Inventory",
    `- test files: ${entries.length}`,
    `- review candidates: ${candidates.length}`,
    `- module mocks: ${totalMocks}`,
    `- snapshot assertions: ${totalSnapshots}`,
    `- collaborator assertions: ${totalCollaboratorAssertions}`,
    "- candidates:",
    ...(candidates.length > 0
      ? candidates.map((entry) => `  - ${entry.filePath}: ${entry.reviewReasons.join(", ")}`)
      : ["  - none"]),
  ].join("\n")
}

function countMatches(source, pattern) {
  return [...source.matchAll(pattern)].length
}

async function collectTestPaths(rootDir, directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const testPaths = []

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      if (!IGNORED_DIRECTORY_NAMES.has(entry.name)) {
        testPaths.push(...(await collectTestPaths(rootDir, entryPath)))
      }
      continue
    }

    if (entry.isFile() && TEST_FILE_PATTERN.test(entry.name)) {
      testPaths.push(entryPath)
    }
  }

  return testPaths.sort()
}

function toRepositoryPath(rootDir, absolutePath) {
  return path.relative(rootDir, absolutePath).split(path.sep).join("/")
}

function stripNonExecutableText(source) {
  let output = ""
  let index = 0

  while (index < source.length) {
    const character = source[index]
    const nextCharacter = source[index + 1]

    if (character === "/" && nextCharacter === "/") {
      const lineBreakIndex = source.indexOf("\n", index)
      const commentEnd = lineBreakIndex === -1 ? source.length : lineBreakIndex
      output = appendMaskedText(output, source.slice(index, commentEnd))
      index = commentEnd
      continue
    }

    if (character === "/" && nextCharacter === "*") {
      const endIndex = source.indexOf("*/", index + 2)
      const commentEnd = endIndex === -1 ? source.length : endIndex + 2
      output = appendMaskedText(output, source.slice(index, commentEnd))
      index = commentEnd
      continue
    }

    if (character === '"' || character === "'" || character === "`") {
      const stringEnd = findStringEnd(source, index, character)
      output = appendMaskedText(output, source.slice(index, stringEnd))
      index = stringEnd
      continue
    }

    output += character
    index += 1
  }

  return output
}

function findStringEnd(source, startIndex, quote) {
  let index = startIndex + 1

  while (index < source.length) {
    if (source[index] === "\\") {
      index += 2
      continue
    }

    if (source[index] === quote) {
      return index + 1
    }

    index += 1
  }

  return source.length
}

function appendMaskedText(output, text) {
  return output + text.replace(/[^\n]/g, " ")
}
