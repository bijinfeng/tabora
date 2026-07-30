import { readFile } from "node:fs/promises"

import { findPullRequestGovernanceViolations } from "./lib/prGovernance.mjs"

const eventPath = process.argv[2] ?? process.env.GITHUB_EVENT_PATH

if (!eventPath) {
  process.stderr.write("PR governance check requires a GitHub event JSON path.\n")
  process.exitCode = 1
} else {
  try {
    const event = JSON.parse(await readFile(eventPath, "utf8"))
    const body = event.pull_request?.body ?? ""
    const violations = findPullRequestGovernanceViolations(body)

    if (violations.length > 0) {
      process.stderr.write(`PR governance check failed:\n${violations.map((item) => `- ${item}`).join("\n")}\n`)
      process.exitCode = 1
    } else {
      process.stdout.write("PR governance check passed.\n")
    }
  } catch (error) {
    const message = error instanceof Error ? (error.stack ?? error.message) : String(error)
    process.stderr.write(`PR governance check crashed:\n${message}\n`)
    process.exitCode = 1
  }
}
