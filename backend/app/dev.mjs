import { spawn } from "node:child_process"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const appDirectory = dirname(fileURLToPath(import.meta.url))
const workspaceRoot = resolve(appDirectory, "../..")
const children = [
  spawn(
    "pnpm",
    [
      "--dir",
      workspaceRoot,
      "--filter",
      "@tabora/playground",
      "dev",
      "--",
      "--port",
      "5173",
      "--strictPort",
    ],
    {
      cwd: workspaceRoot,
      env: { ...process.env, VITE_TABORA_API_BASE: "http://localhost:4000" },
      stdio: "inherit",
    },
  ),
  spawn("pnpm", ["exec", "vp", "dev", "--port", "4000", "--strictPort"], {
    cwd: appDirectory,
    env: { ...process.env, TABORA_PLAYGROUND_DEV_PROXY: "true" },
    stdio: "inherit",
  }),
]

let stopping = false
function stop(code = 0) {
  if (stopping) return
  stopping = true
  for (const child of children) child.kill("SIGTERM")
  process.exitCode = code
}

process.on("SIGINT", () => stop())
process.on("SIGTERM", () => stop())
for (const child of children) {
  child.once("exit", (code) => stop(code ?? 1))
}
