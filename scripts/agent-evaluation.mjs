import { readFile } from "node:fs/promises"

import { buildAgentEvaluationReport, validateAgentEvaluationCases } from "./lib/agentEvaluation.mjs"

const casePath = process.argv[2] ?? "tooling/agent-evals/cases.json"

try {
  const document = JSON.parse(await readFile(casePath, "utf8"))
  const cases = document.cases
  if (!Array.isArray(cases)) {
    throw new Error("evaluation document must contain a cases array")
  }

  const violations = validateAgentEvaluationCases(cases)
  if (violations.length > 0) {
    process.stderr.write(
      `Agent evaluation case validation failed:\n${violations.map((item) => `- ${item}`).join("\n")}\n`,
    )
    process.exitCode = 1
  } else {
    process.stdout.write(`${buildAgentEvaluationReport(cases)}\n`)
  }
} catch (error) {
  const message = error instanceof Error ? (error.stack ?? error.message) : String(error)
  process.stderr.write(`Agent evaluation case validation crashed:\n${message}\n`)
  process.exitCode = 1
}
