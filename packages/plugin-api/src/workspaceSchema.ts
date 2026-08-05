import { z } from "zod"

const widgetSizeSchema = z.enum(["S", "M", "L", "XL"])

const regionContentKindSchema = z.enum(["widget", "search"])

const contributionRefSchema = (
  kind: "layout" | "theme" | "search-provider" | "background-provider" | "background-renderer",
) =>
  z.object({
    pluginId: z.string().min(1),
    kind: z.literal(kind),
    id: z.string().min(1),
  })

const searchProviderRefSchema = contributionRefSchema("search-provider")

export const workbenchSearchSettingsSchema = z
  .object({
    defaultProvider: searchProviderRefSchema,
    enabledProviders: z.array(searchProviderRefSchema).min(1),
  })
  .superRefine((value, ctx) => {
    if (
      !value.enabledProviders.some(
        (provider) =>
          provider.pluginId === value.defaultProvider.pluginId &&
          provider.id === value.defaultProvider.id,
      )
    ) {
      ctx.addIssue({
        code: "custom",
        message: "defaultProvider must be included in enabledProviders",
        path: ["defaultProvider"],
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
    contribution: z.object({
      pluginId: z.string().min(1),
      kind: regionContentKindSchema,
      id: z.string().min(1),
    }),
    regionId: z.string().min(1),
    enabled: z.boolean(),
    size: widgetSizeSchema.optional(),
    grid: gridPlacementSchema.optional(),
    config: z.record(z.string(), z.unknown()),
    createdAt: z.string().min(1),
    updatedAt: z.string().min(1),
  })
  .superRefine((value, ctx) => {
    if (value.contribution.kind === "widget" && !value.size) {
      ctx.addIssue({
        code: "custom",
        message: "widget instances must declare size",
        path: ["size"],
      })
    }

    if (value.contribution.kind !== "widget" && value.size !== undefined) {
      ctx.addIssue({
        code: "custom",
        message: "non-widget instances must not declare size",
        path: ["size"],
      })
    }
  })

const regionStateSchema = z.object({
  regionId: z.string().min(1),
  accepts: z.array(regionContentKindSchema).min(1),
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
  activeLayout: contributionRefSchema("layout"),
  activeTheme: contributionRefSchema("theme"),
  activeBackgroundProvider: contributionRefSchema("background-provider"),
  activeBackgroundRenderer: contributionRefSchema("background-renderer").optional(),
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
