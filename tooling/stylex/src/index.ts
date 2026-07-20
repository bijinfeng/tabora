import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import stylex from "@stylexjs/unplugin"

export const taboraStylexWorkspaceRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../..",
)

export const stylexSharedOptions = {
  importSources: ["@stylexjs/stylex"],
  useCSSLayers: true,
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
