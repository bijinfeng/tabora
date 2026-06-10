import { spawn } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

const playgroundDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const repositoryRoot = path.resolve(playgroundDir, "..", "..")
const viteBinaryPath =
  process.platform === "win32"
    ? path.join(repositoryRoot, "node_modules", ".bin", "vite.cmd")
    : path.join(repositoryRoot, "node_modules", ".bin", "vite")

function readDevServerStartup(): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      viteBinaryPath,
      ["--host", "127.0.0.1", "--port", "5179", "--clearScreen", "false"],
      {
        cwd: playgroundDir,
        env: { ...process.env, FORCE_COLOR: "0", NO_COLOR: "1" },
        stdio: ["ignore", "pipe", "pipe"],
      },
    )
    let output = ""
    let stopping = false

    const stop = () => {
      if (stopping) {
        return
      }

      stopping = true
      clearTimeout(timer)
      child.kill("SIGTERM")
    }
    const collect = (chunk: Buffer) => {
      output += chunk.toString()

      if (output.includes("Local:") || output.includes("context method emitFile()")) {
        stop()
      }
    }
    const timer = setTimeout(stop, 15_000)

    child.stdout.on("data", collect)
    child.stderr.on("data", collect)
    child.on("error", (error) => {
      clearTimeout(timer)
      reject(error)
    })
    child.on("exit", (code) => {
      clearTimeout(timer)

      if (!stopping && code !== 0) {
        reject(new Error(output))
        return
      }

      resolve(output)
    })
  })
}

describe("playground Vite config", () => {
  it("starts dev server without Rollup-only favicon asset warnings", async () => {
    const output = await readDevServerStartup()

    expect(output).not.toContain("context method emitFile() is not supported in serve mode")
  }, 20_000)
})
