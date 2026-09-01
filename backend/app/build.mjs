import { execFile } from "node:child_process"
import { cp, rm } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { promisify } from "node:util"

const exec = promisify(execFile)
const appDirectory = dirname(fileURLToPath(import.meta.url))
const workspaceRoot = resolve(appDirectory, "../..")
const playgroundOutput = resolve(appDirectory, ".playground-build")
const bundledPlaygroundOutput = resolve(appDirectory, "dist/playground")

async function run(command, args, options = {}) {
  await exec(command, args, { cwd: appDirectory, stdio: "inherit", ...options })
}

await rm(playgroundOutput, { recursive: true, force: true })
await run(
  "pnpm",
  [
    "--dir",
    workspaceRoot,
    "--filter",
    "@tabora/playground",
    "exec",
    "vp",
    "build",
    "--outDir",
    playgroundOutput,
  ],
  {
    env: { ...process.env, VITE_BASE: "/playground/", VITE_TABORA_API_BASE: "/" },
  },
)
await run("pnpm", ["exec", "vp", "build"])
await rm(bundledPlaygroundOutput, { recursive: true, force: true })
await cp(playgroundOutput, bundledPlaygroundOutput, { recursive: true })
await rm(playgroundOutput, { recursive: true, force: true })
