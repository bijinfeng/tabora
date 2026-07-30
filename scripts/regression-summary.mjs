import { execFileSync } from "node:child_process"

import {
  buildRegressionSummary,
  collectChangedFiles,
  collectReportableGitStatusLines,
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
  const reportableGitStatusLines = collectReportableGitStatusLines(gitStatusLines)

  process.stdout.write(
    `${buildRegressionSummary({
      gitStatusLines: reportableGitStatusLines,
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
