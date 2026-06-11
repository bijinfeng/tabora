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

export const workbenchSearchSettingsSchema = z
  .object({
    defaultProviderId: z.string().min(1),
    enabledProviderIds: z.array(z.string().min(1)).min(1),
  })
  .superRefine((value, ctx) => {
    if (!value.enabledProviderIds.includes(value.defaultProviderId)) {
      ctx.addIssue({
        code: "custom",
        message: "defaultProviderId must be included in enabledProviderIds",
        path: ["defaultProviderId"],
      })
    }
  })

const gridPlacementSchema = z.object({
  x: z.number(),
  y: z.number(),
  colSpan: z.number().int().positive(),
  rowSpan: z.number().int().positive(),
  locked: z.boolean().optional(),
})

export const pluginInstanceSchema = z
  .object({
    id: z.string().min(1),
    workspaceId: z.string().min(1),
    pluginId: z.string().min(1),
    contributionId: z.string().min(1),
    extensionPoint: extensionPointSchema,
    regionId: z.string().min(1),
    enabled: z.boolean(),
    size: widgetSizeSchema.optional(),
    grid: gridPlacementSchema.optional(),
    config: z.record(z.string(), z.unknown()),
    createdAt: z.string().min(1),
    updatedAt: z.string().min(1),
  })
  .superRefine((value, ctx) => {
    if (value.extensionPoint === "widget" && !value.size) {
      ctx.addIssue({
        code: "custom",
        message: "widget instances must declare size",
        path: ["size"],
      })
    }

    if (value.extensionPoint !== "widget" && value.size !== undefined) {
      ctx.addIssue({
        code: "custom",
        message: "non-widget instances must not declare size",
        path: ["size"],
      })
    }
  })

const regionStateSchema = z.object({
  regionId: z.string().min(1),
  accepts: z.array(extensionPointSchema).min(1),
  instances: z.array(
    z.object({
      instanceId: z.string().min(1),
    }),
  ),
})

const workbenchAppearanceSchema = z
  .object({
    locale: z.enum(["zh-CN", "en-US"]).optional(),
  })
  .catchall(z.unknown())

const workspaceConfigSchema = z
  .object({
    search: workbenchSearchSettingsSchema,
    appearance: workbenchAppearanceSchema.optional(),
  })
  .catchall(z.unknown())

export const workspaceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  activeLayoutId: z.string().min(1),
  activeThemeId: z.string().min(1),
  activeBackgroundProviderId: z.string().min(1),
  activeBackgroundRendererId: z.string().min(1).optional(),
  config: workspaceConfigSchema,
  regions: z.record(z.string(), regionStateSchema),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

const pluginDataRowSchema = z.object({
  id: z.string().min(1),
  pluginId: z.string().min(1),
  workspaceId: z.string().min(1).optional(),
  instanceId: z.string().min(1).optional(),
  key: z.string().min(1),
  value: z.unknown(),
  updatedAt: z.string().min(1),
})

export const workspaceExportSchema = z.object({
  schemaVersion: z.literal(1),
  exportedAt: z.string().min(1),
  workspace: workspaceSchema,
  instances: z.array(pluginInstanceSchema),
  pluginData: z.array(pluginDataRowSchema),
})
