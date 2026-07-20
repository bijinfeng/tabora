import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { basename, dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import stylex from "@stylexjs/unplugin"

export const taboraStylexWorkspaceRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../..",
)

export const stylexSharedOptions = {
  importSources: ["@stylexjs/stylex"],
  useCSSLayers: {
    prefix: "tabora",
  },
} as const

export type TaboraStylexPluginOptions = {
  rootDir: string
  dev: boolean
  devMode: "full" | "css-only" | "off"
}

export function createTaboraStylexVitePlugin(options: TaboraStylexPluginOptions) {
  return stylex.vite({
    ...stylexSharedOptions,
    dev: options.dev,
    devMode: options.devMode,
    unstable_moduleResolution: {
      type: "commonJS",
      rootDir: options.rootDir,
    },
  })
}

type PackageManifest = {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  exports?: Record<string, unknown>
  publishConfig?: {
    exports?: Record<string, unknown>
  }
}

export type StylexCssAsset = {
  sourceFilePath: string
  publishFileName: string
}

export type TaboraStylexPackOptions = {
  packageDir: string
  rootDir: string
}

type AssetEmitter = {
  emitFile(file: { type: "asset"; fileName: string; source: string }): string
}

type OutputCssAsset = {
  type: "asset"
  fileName: string
  source: string | Uint8Array
}

function isOutputCssAsset(item: unknown): item is OutputCssAsset {
  if (typeof item !== "object" || item === null) return false
  const record = item as Record<string, unknown>
  return (
    record.type === "asset" &&
    typeof record.fileName === "string" &&
    (typeof record.source === "string" || record.source instanceof Uint8Array)
  )
}

function packageUsesStylex(manifest: PackageManifest) {
  return [manifest.dependencies, manifest.devDependencies, manifest.peerDependencies].some(
    (dependencies) => dependencies?.["@stylexjs/stylex"] !== undefined,
  )
}

function readPackageManifest(packageDir: string): PackageManifest {
  const manifestPath = join(packageDir, "package.json")

  try {
    return JSON.parse(readFileSync(manifestPath, "utf8")) as PackageManifest
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Unable to read StyleX package manifest at ${manifestPath}: ${message}`)
  }
}

export function resolveStylexCssAsset(packageDir: string): StylexCssAsset | undefined {
  const manifest = readPackageManifest(packageDir)
  if (!packageUsesStylex(manifest)) return undefined

  const sourceExport = manifest.exports?.["./styles.css"]
  const publishExport = manifest.publishConfig?.exports?.["./styles.css"]

  if (sourceExport === undefined && publishExport === undefined) return undefined
  if (typeof sourceExport !== "string" || !sourceExport.startsWith("./src/")) {
    throw new Error(
      `StyleX package ${packageDir} must export ./styles.css from an explicit ./src/ path`,
    )
  }
  if (typeof publishExport !== "string" || !publishExport.startsWith("./dist/")) {
    throw new Error(
      `StyleX package ${packageDir} must publish ./styles.css to an explicit ./dist/ path`,
    )
  }

  return {
    sourceFilePath: join(packageDir, sourceExport.slice(2)),
    publishFileName: basename(publishExport),
  }
}

function createCssSeedPlugin(asset: StylexCssAsset) {
  return {
    name: "tabora:stylex-css-seed",
    buildStart(this: AssetEmitter) {
      let source: string

      try {
        source = readFileSync(asset.sourceFilePath, "utf8")
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        throw new Error(`Unable to read StyleX source CSS at ${asset.sourceFilePath}: ${message}`)
      }

      this.emitFile({
        type: "asset",
        fileName: asset.publishFileName,
        source,
      })
    },
  }
}

function createCssVerificationPlugin(asset: StylexCssAsset) {
  let generatedCss: string | undefined
  let generatedFileName: string | undefined

  return {
    name: "tabora:verify-stylex-css",
    generateBundle(_outputOptions: unknown, bundle: Record<string, unknown>) {
      const output = Object.values(bundle).find(
        (item): item is OutputCssAsset =>
          isOutputCssAsset(item) &&
          (item.fileName === asset.publishFileName ||
            (basename(item.fileName).startsWith(
              `${asset.publishFileName.replace(/\.css$/, "")}-`,
            ) &&
              item.fileName.endsWith(".css"))),
      )

      if (!output) {
        const emitted = Object.values(bundle)
          .map((item) =>
            typeof item === "object" && item !== null && "fileName" in item
              ? String(item.fileName)
              : "<unknown>",
          )
          .join(", ")
        throw new Error(
          `StyleX CSS asset was not emitted: ${asset.publishFileName}; bundle contains: ${emitted}`,
        )
      }

      const css =
        typeof output.source === "string" ? output.source : new TextDecoder().decode(output.source)

      if (!/\.x[a-zA-Z0-9_-]+\s*\{/.test(css)) {
        throw new Error(`StyleX CSS asset has no generated rules: ${asset.publishFileName}`)
      }

      generatedCss = css
      generatedFileName = output.fileName
    },
    writeBundle(outputOptions: { dir?: string; file?: string }) {
      if (!generatedCss || !generatedFileName) {
        throw new Error(`StyleX CSS finalizer has no generated asset: ${asset.publishFileName}`)
      }

      const outputDir = outputOptions.dir
        ? resolve(outputOptions.dir)
        : outputOptions.file
          ? dirname(resolve(outputOptions.file))
          : undefined
      if (!outputDir) {
        throw new Error(
          `StyleX CSS finalizer cannot resolve output directory: ${asset.publishFileName}`,
        )
      }

      const canonicalPath = join(outputDir, asset.publishFileName)
      mkdirSync(dirname(canonicalPath), { recursive: true })
      writeFileSync(canonicalPath, generatedCss)

      if (generatedFileName !== asset.publishFileName) {
        rmSync(join(outputDir, generatedFileName), { force: true })
      }
    },
  }
}

export function createTaboraStylexPackPlugins(options: TaboraStylexPackOptions) {
  const cssAsset = resolveStylexCssAsset(options.packageDir)
  if (!cssAsset) return []

  return [
    createCssSeedPlugin(cssAsset),
    stylex.rolldown({
      ...stylexSharedOptions,
      dev: false,
      cssInjectionTarget: (fileName) =>
        basename(fileName).startsWith(cssAsset.publishFileName.replace(/\.css$/, "")) &&
        fileName.endsWith(".css"),
      unstable_moduleResolution: {
        type: "commonJS",
        rootDir: options.rootDir,
      },
    }),
    createCssVerificationPlugin(cssAsset),
  ]
}
