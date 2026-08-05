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
  source: Exclude<PluginSource, "remote-untrusted">
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

export type TrustedLocalPluginPackage = {
  package: {
    name: string
    version: string
  }
  tabora: PluginManifest
  entry: string
  baseUrl?: string
}

export type ParsedTrustedLocalPluginPackage = {
  packageName: string
  packageVersion: string
  manifest: PluginManifest
  entry: string
  source: "local-trusted"
  styles: ResolvedPluginStyle[]
}

function resolveStyleHref(
  style: PluginStyleContribution,
  options: {
    baseUrl?: string
    styleAssetUrls?: Record<string, string>
  },
): string {
  if (options.styleAssetUrls && Object.hasOwn(options.styleAssetUrls, style.href)) {
    return options.styleAssetUrls[style.href] ?? style.href
  }
  if (options.baseUrl) return new URL(style.href, options.baseUrl).toString()
  return style.href
}

function resolveManifestStyles(options: {
  manifest: PluginManifest
  source: Exclude<PluginSource, "remote-untrusted">
  baseUrl?: string
  styleAssetUrls?: Record<string, string>
}): ResolvedPluginStyle[] {
  return (options.manifest.styles ?? []).map((style) => {
    const scope = style.scope ?? "plugin"
    if (scope === "global" && options.source !== "builtin") {
      throw new Error(
        `Only builtin plugins may declare global styles: ${options.manifest.id}/${style.href}`,
      )
    }
    return {
      pluginId: options.manifest.id,
      href: resolveStyleHref(style, options),
      sourceHref: style.href,
      scope,
      order: style.order ?? 0,
      source: options.source,
    }
  })
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
 * Validate packages supplied by the trusted builtin composition. This loader deliberately
 * refuses every other source: source admission and permission policy belong to the host,
 * never to a manifest or to a convenient bootstrap conversion.
 */
export function loadBuiltinPlugins(plugins: LoadedPluginPackage[]): PluginLoadResult {
  const loaded: PluginLoadRecord[] = []
  const rejected: PluginLoadRejectedRecord[] = []
  const seenPluginIds = new Set<string>()

  for (const pluginPackage of plugins) {
    if (pluginPackage.source !== "builtin") {
      rejected.push({
        source: pluginPackage.source,
        reason: 'Builtin loader only accepts packages with source "builtin"',
        manifest: pluginPackage.module.manifest,
      })
      continue
    }
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
    styles: resolveManifestStyles({
      manifest: parsedManifest,
      source: "local-trusted",
      ...(value.baseUrl ? { baseUrl: value.baseUrl } : {}),
    }),
  }
}
