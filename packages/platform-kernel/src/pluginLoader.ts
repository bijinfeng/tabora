import {
  pluginManifestSchema,
  type PluginManifest,
  type PluginModule,
  type PluginStyleContribution,
  type PluginStyleScope,
} from "@tabora/plugin-api"
import type { LoadedPluginPackage, PluginPackageSource } from "./pluginKernel"

export const TABORA_PLUGIN_API_VERSION = "1.0.0"

export type PluginSource = PluginPackageSource

export type ResolvedPluginStyle = {
  pluginId: string
  href: string
  sourceHref: string
  scope: PluginStyleScope
  order: number
  source: PluginSource
}

export type PluginLoadRecord = {
  pluginPackage: LoadedPluginPackage
  module: PluginModule
  manifest: PluginManifest
  source: PluginSource
  styles: ResolvedPluginStyle[]
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

function resolveStyleHref(
  style: PluginStyleContribution,
  options: {
    styleAssetUrls?: Record<string, string>
  },
): string {
  if (options.styleAssetUrls && Object.hasOwn(options.styleAssetUrls, style.href)) {
    return options.styleAssetUrls[style.href] ?? style.href
  }
  return style.href
}

function resolveManifestStyles(options: {
  manifest: PluginManifest
  source: PluginSource
  styleAssetUrls?: Record<string, string>
}): ResolvedPluginStyle[] {
  return (options.manifest.styles ?? []).map((style) => ({
    pluginId: options.manifest.id,
    href: resolveStyleHref(style, options),
    sourceHref: style.href,
    scope: style.scope ?? "plugin",
    order: style.order ?? 0,
    source: options.source,
  }))
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

/**
 * Validate packages supplied by the trusted builtin composition. Manifest validation and
 * api-version compatibility are enforced here; permission policy belongs to the host.
 */
export function loadBuiltinPlugins(plugins: LoadedPluginPackage[]): PluginLoadResult {
  const loaded: PluginLoadRecord[] = []
  const rejected: PluginLoadRejectedRecord[] = []
  const seenPluginIds = new Set<string>()

  for (const pluginPackage of plugins) {
    const { module } = pluginPackage
    if (seenPluginIds.has(module.manifest.id)) {
      rejected.push({
        source: pluginPackage.source,
        reason: `Duplicate plugin package id: ${module.manifest.id}`,
        manifest: module.manifest,
      })
      continue
    }
    seenPluginIds.add(module.manifest.id)
    const parsed = pluginManifestSchema.safeParse(module.manifest)
    if (!parsed.success) {
      rejected.push({
        source: pluginPackage.source,
        reason: hasApiVersion(module.manifest)
          ? "Invalid plugin manifest"
          : "Plugin manifest must declare apiVersion",
        manifest: module.manifest,
      })
      continue
    }

    const apiRejection = apiCompatibilityRejection(parsed.data as PluginManifest)
    if (apiRejection) {
      rejected.push({
        source: pluginPackage.source,
        reason: apiRejection,
        manifest: module.manifest,
      })
      continue
    }

    try {
      loaded.push({
        pluginPackage,
        module,
        manifest: parsed.data as PluginManifest,
        source: pluginPackage.source,
        styles: resolveManifestStyles({
          manifest: parsed.data as PluginManifest,
          source: "builtin",
          ...(pluginPackage.styleAssetUrls ? { styleAssetUrls: pluginPackage.styleAssetUrls } : {}),
        }),
      })
    } catch (error) {
      rejected.push({
        source: pluginPackage.source,
        reason: error instanceof Error ? error.message : String(error),
        manifest: pluginPackage.module.manifest,
      })
    }
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

export function createBuiltinPluginLoader(plugins: LoadedPluginPackage[]): PluginLoader {
  return {
    async load() {
      return loadBuiltinPlugins(plugins)
    },
  }
}
