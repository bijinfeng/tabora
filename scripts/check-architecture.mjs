import { buildArchitectureFailureReport, scanArchitecture } from "./lib/governance.mjs"

try {
  const findings = await scanArchitecture(process.cwd())

  if (findings.length > 0) {
    process.stderr.write(`${buildArchitectureFailureReport(findings)}\n`)
    process.exitCode = 1
  } else {
    process.stdout.write("Architecture check passed.\n")
  }
} catch (error) {
  const message = error instanceof Error ? (error.stack ?? error.message) : String(error)
  process.stderr.write(`Architecture check crashed:\n${message}\n`)
  process.exitCode = 1
}
