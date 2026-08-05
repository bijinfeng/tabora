import {
  type BackgroundProviderContributionRef,
  type ContributionKind,
  type ContributionRef,
  type LayoutContributionRef,
  type PluginManifest,
  type SearchProviderContributionRef,
  type ThemeContributionRef,
  type WorkbenchSearchSettings,
  type Workspace,
  workspaceSchema,
} from "@tabora/plugin-api"

type LegacyWorkspace = Record<string, unknown> & {
  id?: string
  activeLayoutId?: string
  activeThemeId?: string
  activeBackgroundProviderId?: string
  activeBackgroundRendererId?: string
  config?: Record<string, unknown>
}

function contributionItems(
  manifest: PluginManifest,
  kind: ContributionKind,
): Array<{ id: string }> {
  switch (kind) {
    case "layout":
      return manifest.contributes.layouts ?? []
    case "search-provider":
      return manifest.contributes.searchProviders ?? []
    case "background-provider":
      return manifest.contributes.backgroundProviders ?? []
    case "background-renderer":
      return manifest.contributes.backgroundRenderers ?? []
    case "theme":
      return manifest.contributes.themes ?? []
    default:
      return []
  }
}

function resolveLegacyContribution<K extends ContributionKind>(options: {
  manifests: PluginManifest[]
  kind: K
  id: string
  workspaceId: string
}): ContributionRef<K> {
  const matches = options.manifests.flatMap((manifest) =>
    contributionItems(manifest, options.kind)
      .filter((contribution) => contribution.id === options.id)
      .map(() => ({ pluginId: manifest.id, kind: options.kind, id: options.id })),
  )
  if (matches.length === 1) return matches[0]!
  const reason = matches.length === 0 ? "not found" : "ambiguous"
  throw new Error(
    `Cannot migrate workspace "${options.workspaceId}" ${options.kind} "${options.id}": ${reason}`,
  )
}

function legacySearchSettings(
  workspace: LegacyWorkspace,
  manifests: PluginManifest[],
): WorkbenchSearchSettings {
  const search = workspace.config?.search
  if (!search || typeof search !== "object") {
    throw new Error(`Cannot migrate workspace "${workspace.id ?? "unknown"}" search settings`)
  }
  const legacy = search as { defaultProviderId?: unknown; enabledProviderIds?: unknown }
  if (typeof legacy.defaultProviderId !== "string" || !Array.isArray(legacy.enabledProviderIds)) {
    throw new Error(`Cannot migrate workspace "${workspace.id ?? "unknown"}" search settings`)
  }
  const workspaceId = workspace.id ?? "unknown"
  const enabledProviders = legacy.enabledProviderIds.map((id) => {
    if (typeof id !== "string") {
      throw new Error(`Cannot migrate workspace "${workspaceId}" invalid enabled search provider`)
    }
    return resolveLegacyContribution({
      manifests,
      kind: "search-provider",
      id,
      workspaceId,
    }) as SearchProviderContributionRef
  })
  return {
    defaultProvider: resolveLegacyContribution({
      manifests,
      kind: "search-provider",
      id: legacy.defaultProviderId,
      workspaceId,
    }) as SearchProviderContributionRef,
    enabledProviders,
  }
}

/**
 * Legacy workspace IDs are accepted only at a persistence/import boundary. They are never
 * returned to runtime callers: each legacy ID must resolve to exactly one installed manifest.
 */
export function migrateWorkspaceContributionRefs(
  value: unknown,
  manifests: PluginManifest[],
): Workspace {
  const parsed = workspaceSchema.safeParse(value)
  if (parsed.success) return value as Workspace

  if (!value || typeof value !== "object") throw new Error("Invalid workspace record")
  const legacy = value as LegacyWorkspace
  if (
    typeof legacy.id !== "string" ||
    typeof legacy.activeLayoutId !== "string" ||
    typeof legacy.activeThemeId !== "string" ||
    typeof legacy.activeBackgroundProviderId !== "string"
  ) {
    throw new Error(`Invalid workspace record "${legacy.id ?? "unknown"}"`)
  }

  const workspaceId = legacy.id
  const activeLayout = resolveLegacyContribution({
    manifests,
    kind: "layout",
    id: legacy.activeLayoutId,
    workspaceId,
  }) as LayoutContributionRef
  const activeTheme = resolveLegacyContribution({
    manifests,
    kind: "theme",
    id: legacy.activeThemeId,
    workspaceId,
  }) as ThemeContributionRef
  const activeBackgroundProvider = resolveLegacyContribution({
    manifests,
    kind: "background-provider",
    id: legacy.activeBackgroundProviderId,
    workspaceId,
  }) as BackgroundProviderContributionRef
  const activeBackgroundRenderer =
    typeof legacy.activeBackgroundRendererId === "string"
      ? (resolveLegacyContribution({
          manifests,
          kind: "background-renderer",
          id: legacy.activeBackgroundRendererId,
          workspaceId,
        }) as ContributionRef<"background-renderer">)
      : undefined
  const config = { ...(legacy.config ?? {}), search: legacySearchSettings(legacy, manifests) }
  const migrated = {
    ...legacy,
    activeLayout,
    activeTheme,
    activeBackgroundProvider,
    ...(activeBackgroundRenderer ? { activeBackgroundRenderer } : {}),
    config,
  }
  delete migrated.activeLayoutId
  delete migrated.activeThemeId
  delete migrated.activeBackgroundProviderId
  delete migrated.activeBackgroundRendererId

  const migratedParsed = workspaceSchema.safeParse(migrated)
  if (!migratedParsed.success) {
    throw new Error(`Invalid migrated workspace "${workspaceId}"`)
  }
  return migratedParsed.data as Workspace
}
