import { buildQualityReport, scanQuality } from "./lib/governance.mjs"

try {
  const report = buildQualityReport(await scanQuality(process.cwd()))
  process.stdout.write(`${report}\n`)
} catch (error) {
  const message = error instanceof Error ? (error.stack ?? error.message) : String(error)
  process.stderr.write(`Quality report crashed:\n${message}\n`)
  process.exitCode = 1
}
