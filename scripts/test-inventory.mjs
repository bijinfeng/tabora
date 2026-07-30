import { buildTestInventoryReport, collectTestInventory } from "./lib/testInventory.mjs"

try {
  const entries = await collectTestInventory(process.cwd())
  process.stdout.write(`${buildTestInventoryReport(entries)}\n`)
} catch (error) {
  const message = error instanceof Error ? (error.stack ?? error.message) : String(error)
  process.stderr.write(`Test inventory crashed:\n${message}\n`)
  process.exitCode = 1
}
