import { z } from "zod"

const settingsTextFieldNodeSchema = z
  .object({
    type: z.literal("field"),
    id: z.string().min(1),
    label: z.string().min(1),
    description: z.string().optional(),
    control: z.enum(["text", "email"]),
    placeholder: z.string().optional(),
    required: z.boolean().optional(),
    disabled: z.boolean().optional(),
    minLength: z.number().int().nonnegative().optional(),
    autocomplete: z.string().optional(),
    persistence: z.literal("ephemeral").optional(),
    value: z.string().optional(),
  })
  .strict()

const settingsPasswordFieldNodeSchema = z
  .object({
    type: z.literal("field"),
    id: z.string().min(1),
    label: z.string().min(1),
    description: z.string().optional(),
    control: z.literal("password"),
    placeholder: z.string().optional(),
    required: z.boolean().optional(),
    disabled: z.boolean().optional(),
    minLength: z.number().int().nonnegative().optional(),
    autocomplete: z.string().optional(),
    persistence: z.literal("ephemeral"),
  })
  .strict()

const settingsSwitchFieldNodeSchema = z
  .object({
    type: z.literal("field"),
    id: z.string().min(1),
    label: z.string().min(1),
    description: z.string().optional(),
    control: z.literal("switch"),
    disabled: z.boolean().optional(),
    persistence: z.literal("ephemeral").optional(),
    value: z.boolean().optional(),
  })
  .strict()

const settingsActionNodeSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1),
    variant: z.enum(["primary", "secondary", "ghost", "link", "danger"]).optional(),
    disabled: z.boolean().optional(),
    pressed: z.boolean().optional(),
  })
  .strict()

export const settingsNodeSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z
      .object({
        type: z.literal("stack"),
        children: z.array(settingsNodeSchema),
      })
      .strict(),
    z
      .object({
        type: z.literal("group"),
        title: z.string().optional(),
        description: z.string().optional(),
        meta: z.string().optional(),
        children: z.array(settingsNodeSchema),
      })
      .strict(),
    z
      .object({
        type: z.literal("text"),
        text: z.string(),
        tone: z.enum(["default", "muted", "danger"]).optional(),
      })
      .strict(),
    settingsTextFieldNodeSchema,
    settingsPasswordFieldNodeSchema,
    settingsSwitchFieldNodeSchema,
    z
      .object({
        type: z.literal("status"),
        label: z.string().min(1),
        value: z.string(),
        tone: z.enum(["neutral", "accent", "success", "warning", "danger"]).optional(),
      })
      .strict(),
    z
      .object({
        type: z.literal("row"),
        label: z.string().min(1),
        description: z.string().optional(),
        meta: z.string().optional(),
        metaTone: z.enum(["neutral", "accent", "success", "warning", "danger"]).optional(),
        metaVariant: z.enum(["text", "badge"]).optional(),
        action: settingsActionNodeSchema.optional(),
      })
      .strict(),
    z
      .object({
        type: z.literal("actions"),
        actions: z.array(settingsActionNodeSchema).min(1),
        layout: z.enum(["inline", "stack", "segmented", "form"]).optional(),
        description: z.string().optional(),
      })
      .strict(),
  ]),
)

export const settingsPanelModelSchema = z
  .object({
    version: z.literal(1),
    ariaLabel: z.string().min(1).optional(),
    layout: z.enum(["default", "account"]).optional(),
    navigation: z
      .object({
        title: z.string().min(1),
        meta: z.string().min(1),
        avatar: z.string().min(1).optional(),
      })
      .strict()
      .optional(),
    nodes: z.array(settingsNodeSchema),
  })
  .strict()
