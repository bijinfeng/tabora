import { z } from "zod"

const widgetSizeSchema = z.enum(["S", "M", "L", "XL"])

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
      modal: z.string().min(1).optional(),
      fullscreen: z.string().min(1).optional(),
      settings: z.string().min(1).optional(),
    }),
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
  publisher: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  entry: z.string().min(1),
  engine: z.object({ platform: z.string().min(1) }),
  permissions: z.array(z.unknown()).optional(),
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
        }),
      )
      .optional(),
    backgroundRenderers: z
      .array(
        z.object({
          id: z.string().min(1),
          title: z.string().min(1),
          accepts: z.array(z.enum(["image", "video", "gradient", "canvas", "webgl"])).min(1),
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
          order: z.number().int().optional(),
        }),
      )
      .optional(),
    commands: z.array(commandContributionSchema).optional(),
  }),
})
