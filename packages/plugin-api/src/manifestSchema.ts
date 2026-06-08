import { z } from "zod"

import { workbenchSearchSettingsSchema } from "./workspaceSchema"

const widgetSizeSchema = z.enum(["S", "M", "L", "XL"])

const settingsPanelSectionSchema = z.enum(["general", "appearance", "search", "plugins", "about"])

const settingsPanelScopeSchema = z.enum(["global", "workspace", "plugin", "instance"])

const hostPlatformSchema = z.enum(["web", "extension", "desktop-webview"])

const hostCapabilitySchema = z.enum([
  "externalOpen",
  "themeApply",
  "backgroundApply",
  "importExportWorkspace",
  "clipboard",
  "localFile",
  "network",
  "storage",
])

const extensionPointSchema = z.enum([
  "layout",
  "widget",
  "search",
  "search-provider",
  "background-provider",
  "background-renderer",
  "theme",
  "settings-panel",
])

const pluginPermissionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("external-open"),
    hosts: z.array(z.string().min(1)).min(1),
  }),
  z.object({
    type: z.literal("storage"),
    scope: z.literal("plugin"),
  }),
  z.object({
    type: z.literal("workspace"),
    access: z.enum(["read", "write"]),
  }),
  z.object({
    type: z.literal("network"),
    hosts: z.array(z.string().min(1)).min(1),
  }),
  z.object({
    type: z.literal("clipboard"),
    access: z.enum(["read", "write"]),
  }),
  z.object({
    type: z.literal("local-file"),
    access: z.enum(["read", "write"]),
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
    pluginId: z.string().min(1),
    contributionId: z.string().min(1),
    instanceId: z.string().min(1),
    extensionPoint: extensionPointSchema,
    regionId: z.string().min(1),
    size: widgetSizeSchema.optional(),
    config: z.record(z.string(), z.unknown()).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.extensionPoint === "widget" && !value.size) {
      ctx.addIssue({
        code: "custom",
        message: "workspace preset widget instances must declare size",
        path: ["size"],
      })
    }

    if (value.extensionPoint !== "widget" && value.size !== undefined) {
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
  layoutId: z.string().min(1),
  themeId: z.string().min(1),
  backgroundProviderId: z.string().min(1),
  search: workbenchSearchSettingsSchema,
  regions: z
    .array(
      z.object({
        regionId: z.string().min(1),
        accepts: z.array(extensionPointSchema).min(1),
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

const layoutRegionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  accepts: z.array(extensionPointSchema).min(1),
  required: z.boolean().optional(),
  maxInstances: z.number().int().positive().optional(),
})

const instanceRefSchema = z.object({ instanceId: z.string().min(1) })

export const pluginManifestSchema = z.object({
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
  contributes: z.object({
    layouts: z
      .array(
        z
          .object({
            id: z.string().min(1),
            title: z.string().min(1),
            preview: z.string().optional(),
            view: z.string().min(1),
            regions: z.array(layoutRegionSchema).min(1),
            defaultRegions: z.record(z.string(), z.array(instanceRefSchema)),
            supportsResponsive: z.boolean(),
          })
          .refine((layout) => layout.regions.some((region) => region.accepts.includes("widget")), {
            message: "layout must declare at least one region accepting widget",
            path: ["regions"],
          }),
      )
      .optional(),
    widgets: z.array(widgetContributionSchema).optional(),
    searches: z
      .array(
        z.object({
          id: z.string().min(1),
          title: z.string().min(1),
          defaultProviderIds: z.array(z.string()).optional(),
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
        z.object({
          id: z.string().min(1),
          title: z.string().min(1),
          view: z.string().min(1),
          section: settingsPanelSectionSchema,
          scope: settingsPanelScopeSchema,
          order: z.number().int().optional(),
        }),
      )
      .optional(),
    commands: z.array(commandContributionSchema).optional(),
    keybindings: z.array(keybindingContributionSchema).optional(),
    workspacePresets: z.array(workspacePresetSchema).optional(),
  }),
})
