import { pluginManifestSchema, type PluginManifest } from "@tabora/plugin-api"
import type { BuiltinPlugin } from "./pluginKernel"

export const TABORA_PLUGIN_API_VERSION = "1.0.0"

export type PluginSource = "builtin" | "local-trusted" | "remote-untrusted"

export type PluginLoadRecord = {
  plugin: BuiltinPlugin
  manifest: PluginManifest
  source: PluginSource
}

export type PluginLoadRejectedRecord = {
  source: PluginSource
  reason: string
  manifest?: unknown
}

export type PluginLoadResult = {
  loaded: PluginLoadRecord[]
  rejected: PluginLoadRejectedRecord[]
}

export type PluginLoader = {
  load(): Promise<PluginLoadResult>
}

export type TrustedLocalPluginPackage = {
  package: {
    name: string
    version: string
  }
  tabora: PluginManifest
  entry: string
}

export type ParsedTrustedLocalPluginPackage = {
  packageName: string
  packageVersion: string
  manifest: PluginManifest
  entry: string
  source: "local-trusted"
}

function majorVersion(version: string): number | null {
  const [major] = version.split(".")
  if (!major || !/^\d+$/.test(major)) return null
  return Number(major)
}

export function isPluginApiVersionCompatible(
  pluginApiVersion: string,
  hostApiVersion = TABORA_PLUGIN_API_VERSION,
): boolean {
  const pluginMajor = majorVersion(pluginApiVersion)
  const hostMajor = majorVersion(hostApiVersion)
  return pluginMajor !== null && hostMajor !== null && pluginMajor === hostMajor
}

function apiCompatibilityRejection(manifest: PluginManifest): string | undefined {
  if (!manifest.apiVersion) return "Plugin manifest must declare apiVersion"
  if (!isPluginApiVersionCompatible(manifest.apiVersion)) {
    return `Incompatible plugin apiVersion "${manifest.apiVersion}"`
  }
  return undefined
}

export function loadBuiltinPlugins(plugins: BuiltinPlugin[]): PluginLoadResult {
  const loaded: PluginLoadRecord[] = []
  const rejected: PluginLoadRejectedRecord[] = []

  for (const plugin of plugins) {
    const parsed = pluginManifestSchema.safeParse(plugin.manifest)
    if (!parsed.success) {
      rejected.push({
        source: "builtin",
        reason: hasApiVersion(plugin.manifest)
          ? "Invalid plugin manifest"
          : "Plugin manifest must declare apiVersion",
        manifest: plugin.manifest,
      })
      continue
    }

    const apiRejection = apiCompatibilityRejection(parsed.data as PluginManifest)
    if (apiRejection) {
      rejected.push({
        source: "builtin",
        reason: apiRejection,
        manifest: plugin.manifest,
      })
      continue
    }

    loaded.push({
      plugin,
      manifest: parsed.data as PluginManifest,
      source: "builtin",
    })
  }

  return { loaded, rejected }
}

function hasApiVersion(manifest: unknown): manifest is { apiVersion: string } {
  return (
    typeof manifest === "object" &&
    manifest !== null &&
    "apiVersion" in manifest &&
    typeof manifest.apiVersion === "string" &&
    manifest.apiVersion.length > 0
  )
}

export function createBuiltinPluginLoader(plugins: BuiltinPlugin[]): PluginLoader {
  return {
    async load() {
      return loadBuiltinPlugins(plugins)
    },
  }
}

export function parseTrustedLocalPluginPackage(
  value: TrustedLocalPluginPackage,
): ParsedTrustedLocalPluginPackage {
  const parsedManifest = pluginManifestSchema.parse(value.tabora) as PluginManifest
  const apiRejection = apiCompatibilityRejection(parsedManifest)
  if (apiRejection) throw new Error(apiRejection)
  return {
    packageName: value.package.name,
    packageVersion: value.package.version,
    manifest: parsedManifest,
    entry: value.entry,
    source: "local-trusted",
  }
}
