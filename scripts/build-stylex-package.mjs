#!/usr/bin/env node
import { buildStylexPackage, parseStylexPackageBuildArgs } from "./lib/stylexPackageBuild.mjs"

try {
  const options = parseStylexPackageBuildArgs(process.argv.slice(2))
  await buildStylexPackage(options)
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
}
