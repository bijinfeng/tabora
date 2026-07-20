import { spawn } from "node:child_process"
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const repositoryRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)))

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: {
        ...process.env,
        ...(options.env ?? {}),
      },
      stdio: "inherit",
    })

    child.on("error", reject)
    child.on("exit", (code) => {
      if (code === 0) {
        resolve()
        return
      }
      reject(new Error(`Command failed with exit code ${code}: ${command} ${args.join(" ")}`))
    })
  })
}

function pnpmExecArgs(args) {
  return ["exec", ...args]
}

function compiledEntryFor(entry) {
  const parsed = path.parse(entry)
  if ([".ts", ".tsx", ".mts", ".cts"].includes(parsed.ext)) {
    return `./${path.join(".stylex-build", parsed.dir, `${parsed.name}.js`)}`
  }
  return `./${path.join(".stylex-build", entry)}`
}

async function optionalRead(filePath) {
  try {
    return await readFile(filePath, "utf8")
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return ""
    }
    throw error
  }
}

async function assertNonEmptyFile(filePath, label) {
  const file = await stat(filePath)
  if (!file.isFile() || file.size === 0) {
    throw new Error(`${label} is missing or empty: ${filePath}`)
  }
}

export async function buildStylexPackage(options) {
  const packageDir = path.resolve(options.packageDir)
  const entries = options.entries
  const cssName = options.cssName ?? "styles.css"
  const stylexBuildDir = path.join(packageDir, ".stylex-build")
  const stylexOutputSrc = path.join(stylexBuildDir, "src")
  const stylexBundlePath = path.join(stylexOutputSrc, cssName)
  const distCssPath = path.join(packageDir, "dist", cssName)
  const stylexConfigPath = path.join(stylexBuildDir, "stylex.config.json")
  const packageJsonPath = path.join(packageDir, "package.json")

  if (entries.length === 0) {
    throw new Error("At least one --entry value is required")
  }

  const originalPackageJson = await readFile(packageJsonPath, "utf8")

  try {
    await rm(stylexBuildDir, { recursive: true, force: true })
    await mkdir(stylexOutputSrc, { recursive: true })
    await writeFile(
      stylexConfigPath,
      JSON.stringify(
        {
          input: path.join(packageDir, "src"),
          output: stylexOutputSrc,
          styleXBundleName: cssName,
          useCSSLayers: true,
          babelPresets: ["babel-preset-solid"],
          babelPluginsPre: [
            ["@babel/plugin-transform-typescript", { isTSX: true }],
            ["@babel/plugin-syntax-typescript", { isTSX: true }],
            "@babel/plugin-syntax-jsx",
          ],
        },
        null,
        2,
      ),
    )

    await run("pnpm", pnpmExecArgs(["stylex", "--config", stylexConfigPath]), {
      cwd: repositoryRoot,
    })

    await assertNonEmptyFile(stylexBundlePath, "StyleX CSS bundle")

    const compiledEntries = entries.map(compiledEntryFor)
    await run("pnpm", pnpmExecArgs(["vp", "pack", ...compiledEntries]), { cwd: packageDir })

    const globalCss = options.globalCss
      ? await optionalRead(path.join(packageDir, options.globalCss))
      : ""
    const stylexCss = await readFile(stylexBundlePath, "utf8")
    const combinedCss = [globalCss.trim(), stylexCss.trim()].filter(Boolean).join("\n\n")

    if (combinedCss.length === 0) {
      throw new Error(`Combined CSS is empty for package: ${packageDir}`)
    }

    await mkdir(path.dirname(distCssPath), { recursive: true })
    await writeFile(distCssPath, `${combinedCss}\n`)
    await assertNonEmptyFile(distCssPath, "Package CSS asset")
  } finally {
    await writeFile(packageJsonPath, originalPackageJson)
    await rm(stylexBuildDir, { recursive: true, force: true })
  }
}

export function parseStylexPackageBuildArgs(argv) {
  const options = {
    entries: [],
    cssName: "styles.css",
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    const value = argv[index + 1]
    switch (arg) {
      case "--package":
        if (!value) throw new Error("--package requires a value")
        options.packageDir = value
        index += 1
        break
      case "--entry":
        if (!value) throw new Error("--entry requires a value")
        options.entries.push(value)
        index += 1
        break
      case "--global-css":
        if (!value) throw new Error("--global-css requires a value")
        options.globalCss = value
        index += 1
        break
      case "--css-name":
        if (!value) throw new Error("--css-name requires a value")
        options.cssName = value
        index += 1
        break
      default:
        throw new Error(`Unknown argument: ${arg}`)
    }
  }

  if (!options.packageDir) {
    throw new Error("--package is required")
  }

  return options
}
