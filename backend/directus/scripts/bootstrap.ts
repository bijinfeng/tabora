import { execSync } from "node:child_process"
import { dirname, resolve } from "node:path"

const projectRoot = resolve(dirname(process.argv[1] ?? "."), "..")
const repoRoot = resolve(projectRoot, "../..")
const composeFile = resolve(repoRoot, "infra/docker/compose.directus.yml")

function run(command: string) {
  execSync(command, {
    cwd: repoRoot,
    stdio: "inherit",
  })
}

run(`docker compose -f "${composeFile}" up -d postgres redis minio directus nginx`)
run(`pnpm --dir "${projectRoot}" schema:provision`)
