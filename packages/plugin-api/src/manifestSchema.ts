import { z } from "zod"
import type { ContributionKind, PluginManifest, WorkbenchSearchSettings } from "./manifest"

import { workbenchSearchSettingsSchema } from "./workspaceSchema"

const widgetSizeSchema = z.enum(["S", "M", "L", "XL"])

const settingsPanelSectionSchema = z.enum([
  "general",
  "appearance",
  "search",
  "account",
  "ai",
  "sync",
  "plugins",
  "about",
])

const settingsPanelScopeSchema = z.enum(["global", "workspace", "plugin", "instance"])
const settingsPanelSurfaceSchema = z.enum(["desktop", "mobile"])

const settingsHostActionSchema = z.enum([
  "workspace.theme.write",
  "workspace.background.write",
  "workspace.locale.write",
  "workspace.search.write",
  "workspace.transfer",
  "workspace.manage",
  "plugins.manage",
  "ai.settings.write",
])
const settingsHostReadSchema = z.enum([
  "workspace.current.read",
  "workspace.list.read",
  "catalog.themes.read",
  "catalog.backgrounds.read",
  "catalog.search-providers.read",
  "workspace.search.read",
  "plugins.read",
  "ai.settings.read",
])

const settingsPanelContentSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("schema"),
      provider: z.string().min(1),
      schemaVersion: z.literal(1),
    })
    .strict(),
  z
    .object({
      kind: z.literal("custom-view"),
      view: z.string().min(1),
    })
    .strict(),
])

const hostPlatformSchema = z.enum(["web", "extension", "desktop-webview"])

const hostCapabilitySchema = z.enum([
  "ai",
  "externalOpen",
  "themeApply",
  "backgroundApply",
  "importExportWorkspace",
  "clipboard",
  "localFile",
  "network",
  "storage",
])

const regionContentKindSchema = z.enum(["widget", "search"])

const contributionRefSchema = (
  kind: "layout" | "theme" | "search-provider" | "background-provider",
) =>
  z.object({
    pluginId: z.string().min(1),
    kind: z.literal(kind),
    id: z.string().min(1),
  })

const searchProviderRefSchema = contributionRefSchema("search-provider")

const pluginPermissionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("ai"),
    access: z.array(z.enum(["generate", "context", "tools"])).min(1),
  }),
  z.object({
    type: z.literal("external-open"),
    hosts: z.array(z.string().min(1)).min(1),
  }),
  z.object({
    type: z.literal("network"),
    hosts: z.array(z.string().min(1)).min(1),
  }),
])

const pluginStyleSchema = z.object({
  href: z.string().min(1),
  scope: z.enum(["plugin", "global"]).optional(),
  order: z.number().int().optional(),
})

const widgetContributionSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    icon: z.string().optional(),
    description: z.string().optional(),
    supportedSizes: z.array(widgetSizeSchema).min(1),
    defaultSize: widgetSizeSchema,
    allowMultipleInstances: z.boolean(),
    defaultConfig: z.record(z.string(), z.unknown()).optional(),
    views: z.object({
      card: z.string().min(1),
      expand: z.string().min(1).optional(),
      expandFooter: z.string().min(1).optional(),
      settings: z.string().min(1).optional(),
    }),
    contextMenus: z
      .array(
        z.object({
          id: z.string().min(1),
          label: z.string().min(1),
          commandId: z.string().min(1).optional(),
          order: z.number().int().optional(),
          danger: z.boolean().optional(),
          when: z.string().min(1).optional(),
        }),
      )
      .optional(),
  })
  .refine((value) => value.supportedSizes.includes(value.defaultSize), {
    message: "defaultSize must be included in supportedSizes",
    path: ["defaultSize"],
  })

const commandContributionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  icon: z.string().optional(),
  category: z.string().min(1),
  keywords: z.array(z.string().min(1)).optional(),
  defaultShortcut: z.string().optional(),
  requiredCapabilities: z.array(z.string().min(1)).optional(),
})

const keybindingContributionSchema = z.object({
  id: z.string().min(1),
  commandId: z.string().min(1),
  key: z.string().min(1),
  platform: z.string().min(1).optional(),
  when: z.string().min(1).optional(),
  editable: z.boolean().optional(),
})

const workspacePresetInstanceSchema = z
  .object({
    contribution: z.object({
      pluginId: z.string().min(1),
      kind: regionContentKindSchema,
      id: z.string().min(1),
    }),
    instanceId: z.string().min(1),
    regionId: z.string().min(1),
    size: widgetSizeSchema.optional(),
    config: z.record(z.string(), z.unknown()).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.contribution.kind === "widget" && !value.size) {
      ctx.addIssue({
        code: "custom",
        message: "workspace preset widget instances must declare size",
        path: ["size"],
      })
    }

    if (value.contribution.kind !== "widget" && value.size !== undefined) {
      ctx.addIssue({
        code: "custom",
        message: "workspace preset non-widget instances must not declare size",
        path: ["size"],
      })
    }
  })

const workspacePresetSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  plugins: z.array(z.string().min(1)),
  layout: contributionRefSchema("layout"),
  theme: contributionRefSchema("theme"),
  backgroundProvider: contributionRefSchema("background-provider"),
  search: workbenchSearchSettingsSchema,
  regions: z
    .array(
      z.object({
        regionId: z.string().min(1),
        accepts: z.array(regionContentKindSchema).min(1),
      }),
    )
    .min(1),
  instances: z.array(workspacePresetInstanceSchema),
})

const backgroundSourceSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("css"),
    css: z.record(z.string(), z.string()),
  }),
  z.object({
    type: z.literal("image"),
    url: z.string().min(1),
    fit: z.enum(["cover", "contain", "fill"]).optional(),
  }),
  z.object({
    type: z.literal("video"),
    url: z.string().min(1),
    poster: z.string().min(1).optional(),
  }),
  z.object({
    type: z.literal("gradient"),
    css: z.string().min(1),
  }),
  z.object({
    type: z.literal("canvas"),
    view: z.string().min(1),
  }),
])

export const pluginManifestSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    version: z.string().min(1),
    apiVersion: z.string().min(1),
    supportedPlatforms: z.array(hostPlatformSchema).optional(),
    requiredCapabilities: z.array(hostCapabilitySchema).optional(),
    publisher: z.string().optional(),
    description: z.string().optional(),
    icon: z.string().optional(),
    entry: z.string().min(1),
    styles: z.array(pluginStyleSchema).optional(),
    engine: z.object({ platform: z.string().min(1) }),
    permissions: z.array(pluginPermissionSchema).optional(),
    sync: z
      .object({
        collections: z
          .array(
            z
              .object({
                id: z.string().min(1),
                recordKey: z.literal("id"),
                updatedAt: z.literal("updatedAt"),
                merge: z.literal("lww"),
                schemaVersion: z.number().int().positive(),
                excludedFields: z.array(z.string().min(1)).optional(),
              })
              .strict(),
          )
          .min(1),
      })
      .strict()
      .optional(),
    contributes: z.object({
      widgets: z.array(widgetContributionSchema).optional(),
      searches: z
        .array(
          z.object({
            id: z.string().min(1),
            title: z.string().min(1),
            defaultProviders: z.array(searchProviderRefSchema).optional(),
            supportsSuggestions: z.boolean().optional(),
            view: z.string().min(1),
          }),
        )
        .optional(),
      searchProviders: z
        .array(
          z.object({
            id: z.string().min(1),
            title: z.string().min(1),
            icon: z.string().optional(),
            urlTemplate: z.string().min(1),
            suggestionEndpoint: z.string().optional(),
            shortcut: z.string().optional(),
          }),
        )
        .optional(),
      backgroundProviders: z
        .array(
          z.object({
            id: z.string().min(1),
            title: z.string().min(1),
            sourceType: z.enum(["local", "remote", "generated", "collection"]),
            source: backgroundSourceSchema.optional(),
            defaultCss: z.record(z.string(), z.string()).optional(),
          }),
        )
        .optional(),
      backgroundRenderers: z
        .array(
          z.object({
            id: z.string().min(1),
            title: z.string().min(1),
            accepts: z.array(z.enum(["css", "image", "video", "gradient", "canvas"])).min(1),
            view: z.string().min(1),
          }),
        )
        .optional(),
      themes: z
        .array(
          z.object({
            id: z.string().min(1),
            title: z.string().min(1),
            tokens: z.record(z.string(), z.string()),
          }),
        )
        .optional(),
      settingsPanels: z
        .array(
          z
            .object({
              id: z.string().min(1),
              title: z.string().min(1),
              section: settingsPanelSectionSchema,
              scope: settingsPanelScopeSchema,
              surfaces: z.array(settingsPanelSurfaceSchema).min(1),
              order: z.number().int().optional(),
              hostActions: z.array(settingsHostActionSchema).min(1).optional(),
              hostReads: z.array(settingsHostReadSchema).min(1).optional(),
              content: settingsPanelContentSchema,
            })
            .strict(),
        )
        .optional(),
      commands: z.array(commandContributionSchema).optional(),
      keybindings: z.array(keybindingContributionSchema).optional(),
      workspacePresets: z.array(workspacePresetSchema).optional(),
    }),
  })
  .superRefine((manifest, ctx) => {
    const ownsRegistration = (id: string) => id.startsWith(`${manifest.id}.`)
    const requireOwnedRegistration = (id: string, path: Array<string | number>, label: string) => {
      if (ownsRegistration(id)) return
      ctx.addIssue({
        code: "custom",
        message: `${label} must use the owning plugin namespace "${manifest.id}.": ${id}`,
        path,
      })
    }
    const syncCollectionIds = new Set<string>()
    for (const [index, collection] of (manifest.sync?.collections ?? []).entries()) {
      if (syncCollectionIds.has(collection.id)) {
        ctx.addIssue({
          code: "custom",
          message: `duplicate sync collection id: ${collection.id}`,
          path: ["sync", "collections", index, "id"],
        })
      }
      syncCollectionIds.add(collection.id)
    }
    const collections = Object.entries(manifest.contributes) as Array<
      [string, Array<{ id: string }> | undefined]
    >
    for (const [kind, contributions] of collections) {
      if (!contributions) continue
      const seen = new Set<string>()
      contributions.forEach((contribution, index) => {
        if (seen.has(contribution.id)) {
          ctx.addIssue({
            code: "custom",
            message: `duplicate ${kind} contribution id: ${contribution.id}`,
            path: ["contributes", kind, index, "id"],
          })
        }
        seen.add(contribution.id)
      })
    }

    const declaredCommandIds = new Set(
      (manifest.contributes.commands ?? []).map((command) => command.id),
    )
    for (const [index, command] of (manifest.contributes.commands ?? []).entries()) {
      requireOwnedRegistration(command.id, ["contributes", "commands", index, "id"], "command id")
    }
    for (const [index, keybinding] of (manifest.contributes.keybindings ?? []).entries()) {
      requireOwnedRegistration(
        keybinding.id,
        ["contributes", "keybindings", index, "id"],
        "keybinding id",
      )
      if (!declaredCommandIds.has(keybinding.commandId)) {
        ctx.addIssue({
          code: "custom",
          message: `keybinding commandId must reference a command declared by this plugin: ${keybinding.commandId}`,
          path: ["contributes", "keybindings", index, "commandId"],
        })
      }
    }

    for (const [widgetIndex, widget] of (manifest.contributes.widgets ?? []).entries()) {
      for (const [menuIndex, menu] of (widget.contextMenus ?? []).entries()) {
        if (menu.commandId && !declaredCommandIds.has(menu.commandId)) {
          ctx.addIssue({
            code: "custom",
            message: `widget context menu commandId must reference a command declared by this plugin: ${menu.commandId}`,
            path: ["contributes", "widgets", widgetIndex, "contextMenus", menuIndex, "commandId"],
          })
        }
      }
    }

    const declaredViewIds = new Set<string>(
      [
        ...(manifest.contributes.widgets ?? []).flatMap((widget) => [
          widget.views.card,
          widget.views.expand,
          widget.views.expandFooter,
          widget.views.settings,
        ]),
        ...(manifest.contributes.searches ?? []).map((search) => search.view),
        ...(manifest.contributes.backgroundRenderers ?? []).map((renderer) => renderer.view),
        ...(manifest.contributes.settingsPanels ?? []).flatMap((panel) =>
          panel.content.kind === "custom-view" ? [panel.content.view] : [],
        ),
      ].filter((view): view is string => Boolean(view)),
    )
    for (const viewId of declaredViewIds) {
      requireOwnedRegistration(viewId, ["contributes"], "view id")
    }
    for (const [panelIndex, panel] of (manifest.contributes.settingsPanels ?? []).entries()) {
      if (panel.content.kind === "schema") {
        requireOwnedRegistration(
          panel.content.provider,
          ["contributes", "settingsPanels", panelIndex, "content", "provider"],
          "settings provider id",
        )
      }
    }
    for (const [index, provider] of (manifest.contributes.backgroundProviders ?? []).entries()) {
      if (provider.source?.type === "canvas" && !declaredViewIds.has(provider.source.view)) {
        ctx.addIssue({
          code: "custom",
          message: `background canvas source must reference a declared view: ${provider.source.view}`,
          path: ["contributes", "backgroundProviders", index, "source", "view"],
        })
      }
    }

    for (const [presetIndex, preset] of (manifest.contributes.workspacePresets ?? []).entries()) {
      const regionById = new Map(preset.regions.map((region) => [region.regionId, region]))
      const instanceIds = new Set<string>()
      for (const [instanceIndex, instance] of preset.instances.entries()) {
        if (instanceIds.has(instance.instanceId)) {
          ctx.addIssue({
            code: "custom",
            message: `workspace preset instanceId must be unique: ${instance.instanceId}`,
            path: [
              "contributes",
              "workspacePresets",
              presetIndex,
              "instances",
              instanceIndex,
              "instanceId",
            ],
          })
        }
        instanceIds.add(instance.instanceId)
        const region = regionById.get(instance.regionId)
        if (!region) {
          ctx.addIssue({
            code: "custom",
            message: `workspace preset instance must reference a declared region: ${instance.regionId}`,
            path: [
              "contributes",
              "workspacePresets",
              presetIndex,
              "instances",
              instanceIndex,
              "regionId",
            ],
          })
        } else if (!region.accepts.includes(instance.contribution.kind)) {
          ctx.addIssue({
            code: "custom",
            message: `workspace preset instance contribution kind "${instance.contribution.kind}" is incompatible with region "${instance.regionId}"`,
            path: [
              "contributes",
              "workspacePresets",
              presetIndex,
              "instances",
              instanceIndex,
              "contribution",
              "kind",
            ],
          })
        }
      }
    }
  })

type ManifestSymbol = {
  pluginId: string
  kind: ContributionKind
  id: string
}

function contributionSymbols(manifest: PluginManifest): ManifestSymbol[] {
  const contributes = manifest.contributes
  return [
    ...(contributes.widgets ?? []).map((item) => ({
      pluginId: manifest.id,
      kind: "widget" as const,
      id: item.id,
    })),
    ...(contributes.searches ?? []).map((item) => ({
      pluginId: manifest.id,
      kind: "search" as const,
      id: item.id,
    })),
    ...(contributes.searchProviders ?? []).map((item) => ({
      pluginId: manifest.id,
      kind: "search-provider" as const,
      id: item.id,
    })),
    ...(contributes.backgroundProviders ?? []).map((item) => ({
      pluginId: manifest.id,
      kind: "background-provider" as const,
      id: item.id,
    })),
    ...(contributes.backgroundRenderers ?? []).map((item) => ({
      pluginId: manifest.id,
      kind: "background-renderer" as const,
      id: item.id,
    })),
    ...(contributes.themes ?? []).map((item) => ({
      pluginId: manifest.id,
      kind: "theme" as const,
      id: item.id,
    })),
    ...(contributes.settingsPanels ?? []).map((item) => ({
      pluginId: manifest.id,
      kind: "settings-panel" as const,
      id: item.id,
    })),
  ]
}

function hasSymbol(
  symbols: ManifestSymbol[],
  pluginIds: Set<string>,
  kind: ContributionKind,
  id: string,
): boolean {
  return symbols.some(
    (symbol) => pluginIds.has(symbol.pluginId) && symbol.kind === kind && symbol.id === id,
  )
}

/**
 * Validate references that intentionally span manifests. Call this after a complete discovery
 * batch has passed the per-manifest schema so no unresolved preset reaches the runtime catalog.
 *
 * `hostBuiltinPluginIds` names plugin ids the host resolves itself (dashboard layout, builtin
 * theme/search/background packs) rather than through discovered manifests. Preset refs to those
 * ids skip the plugins-list and resolvability checks here; their ids are validated against the
 * host data in the official preset test.
 */
export function validatePluginManifestComposition(
  manifests: PluginManifest[],
  options: { hostBuiltinPluginIds?: ReadonlySet<string> } = {},
): void {
  const hostBuiltinPluginIds = options.hostBuiltinPluginIds ?? new Set<string>()
  const pluginIds = new Set(manifests.map((manifest) => manifest.id))
  const symbols = manifests.flatMap(contributionSymbols)
  const issues: string[] = []

  for (const manifest of manifests) {
    for (const preset of manifest.contributes.workspacePresets ?? []) {
      const selectedPlugins = new Set(preset.plugins)
      for (const pluginId of selectedPlugins) {
        if (!pluginIds.has(pluginId)) {
          issues.push(
            `Workspace preset "${preset.id}" references undiscovered plugin "${pluginId}"`,
          )
        }
      }
      const requireSelectedSymbol = (ref: unknown, label: string) => {
        if (
          !ref ||
          typeof ref !== "object" ||
          typeof (ref as { pluginId?: unknown }).pluginId !== "string" ||
          typeof (ref as { kind?: unknown }).kind !== "string" ||
          typeof (ref as { id?: unknown }).id !== "string"
        ) {
          issues.push(`Workspace preset "${preset.id}" ${label} must use a contribution ref`)
          return
        }
        const contributionRef = ref as {
          pluginId: string
          kind: ContributionKind
          id: string
        }
        if (hostBuiltinPluginIds.has(contributionRef.pluginId)) {
          return
        }
        if (!selectedPlugins.has(contributionRef.pluginId)) {
          issues.push(
            `Workspace preset "${preset.id}" ${label} uses plugin outside its plugins list: ${contributionRef.pluginId}`,
          )
        }
        if (
          !hasSymbol(
            symbols,
            new Set([contributionRef.pluginId]),
            contributionRef.kind,
            contributionRef.id,
          )
        ) {
          issues.push(
            `Workspace preset "${preset.id}" ${label} is not resolvable: ${contributionRef.pluginId}/${contributionRef.kind}/${contributionRef.id}`,
          )
        }
      }
      requireSelectedSymbol(preset.layout, "layout")
      requireSelectedSymbol(preset.theme, "theme")
      requireSelectedSymbol(preset.backgroundProvider, "background provider")
      const search = preset.search as Partial<WorkbenchSearchSettings>
      requireSelectedSymbol(search.defaultProvider, "default search provider")
      for (const provider of search.enabledProviders ?? []) {
        requireSelectedSymbol(provider, "enabled search provider")
      }
      for (const instance of preset.instances) {
        if (!selectedPlugins.has(instance.contribution.pluginId)) {
          issues.push(
            `Workspace preset "${preset.id}" instance "${instance.instanceId}" uses plugin outside its plugins list: ${instance.contribution.pluginId}`,
          )
        }
        if (
          !hasSymbol(
            symbols,
            new Set([instance.contribution.pluginId]),
            instance.contribution.kind,
            instance.contribution.id,
          )
        ) {
          issues.push(
            `Workspace preset "${preset.id}" instance "${instance.instanceId}" contribution is not resolvable: ${instance.contribution.pluginId}/${instance.contribution.kind}/${instance.contribution.id}`,
          )
        }
      }
    }
  }

  if (issues.length > 0) {
    throw new Error(`Invalid plugin manifest composition: ${issues.join("; ")}`)
  }
}
