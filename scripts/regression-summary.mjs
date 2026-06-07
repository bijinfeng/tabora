import { execFileSync } from "node:child_process"

import {
  buildRegressionSummary,
  parseGitStatusLines,
  resolveRepositoryRoot,
} from "./lib/regressionSummaryRuntime.mjs"

const repositoryRoot = resolveRepositoryRoot(process.cwd())

try {
  const gitStatusOutput = execGit(["status", "--short", "--untracked-files=all"], repositoryRoot)
  const trackedDiffOutput = execGit(["diff", "--name-only", "HEAD"], repositoryRoot)

  const gitStatusLines = parseGitStatusLines(gitStatusOutput)
  const changedFiles = collectChangedFiles({
    gitStatusLines,
    trackedDiffOutput,
  })

  process.stdout.write(
    `${buildRegressionSummary({
      gitStatusLines,
      changedFiles,
    })}\n`,
  )
} catch (error) {
  const message = error instanceof Error ? (error.stack ?? error.message) : String(error)
  process.stderr.write(`Regression summary crashed:\n${message}\n`)
  process.exitCode = 1
}

function execGit(args, cwd) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
  })
}

function collectChangedFiles(options) {
  const fromStatus = options.gitStatusLines.map((line) => line.slice(3))
  const fromDiff = options.trackedDiffOutput
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
  return [...new Set([...fromDiff, ...fromStatus])]
}
