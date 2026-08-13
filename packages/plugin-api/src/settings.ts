export type SettingsSectionId =
  | "general"
  | "appearance"
  | "search"
  | "account"
  | "ai"
  | "sync"
  | "plugins"
  | "about"

export type SettingsPanelScope = "global" | "workspace" | "plugin" | "instance"
export type SettingsSurface = "desktop" | "mobile"

export type SettingsTextTone = "default" | "muted" | "danger"
export type SettingsStatusTone = "neutral" | "accent" | "success" | "warning" | "danger"
export type SettingsPanelLayout = "default" | "account"

export type SettingsPanelNavigation = {
  title: string
  meta: string
  avatar?: string
}

type SettingsFieldBase = {
  type: "field"
  id: string
  label: string
  description?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  autocomplete?: string
}

export type SettingsTextFieldNode = SettingsFieldBase & {
  control: "text" | "email"
  minLength?: number
  persistence?: "ephemeral"
  value?: string
}

export type SettingsPasswordFieldNode = SettingsFieldBase & {
  control: "password"
  minLength?: number
  persistence: "ephemeral"
  value?: never
}

export type SettingsSwitchFieldNode = Omit<
  SettingsFieldBase,
  "autocomplete" | "placeholder" | "required"
> & {
  control: "switch"
  persistence?: "ephemeral"
  value?: boolean
}

export type SettingsFieldNode =
  | SettingsTextFieldNode
  | SettingsPasswordFieldNode
  | SettingsSwitchFieldNode

export type SettingsActionNode = {
  id: string
  label: string
  variant?: "primary" | "secondary" | "ghost" | "link" | "danger"
  disabled?: boolean
  pressed?: boolean
}

export type SettingsActionsLayout = "inline" | "stack" | "segmented" | "form"

export type SettingsRowNode = {
  type: "row"
  label: string
  description?: string
  meta?: string
  metaTone?: SettingsStatusTone
  metaVariant?: "text" | "badge"
  action?: SettingsActionNode
}

export type SettingsNode =
  | { type: "stack"; children: SettingsNode[] }
  | {
      type: "group"
      title?: string
      description?: string
      meta?: string
      children: SettingsNode[]
    }
  | { type: "text"; text: string; tone?: SettingsTextTone }
  | SettingsFieldNode
  | { type: "status"; label: string; value: string; tone?: SettingsStatusTone }
  | SettingsRowNode
  | {
      type: "actions"
      actions: SettingsActionNode[]
      layout?: SettingsActionsLayout
      description?: string
    }

export type SettingsPanelModel = {
  version: 1
  ariaLabel?: string
  layout?: SettingsPanelLayout
  navigation?: SettingsPanelNavigation
  nodes: SettingsNode[]
}

export type SettingsPanelAction = {
  id: string
  values: Readonly<Record<string, unknown>>
}

export type SettingsPanelProviderContext = {
  surface: SettingsSurface
  locale?: "zh-CN" | "en-US"
  panel?: {
    id: string
    pluginId: string
    scope: SettingsPanelScope
    /** Present when the settings panel targets a particular plugin instance. */
    instanceId?: string
  }
  /** Signals that the panel is no longer active; providers must not commit stale async state. */
  signal?: AbortSignal
  /** Ask the shell-owned renderer to retrieve a fresh model. */
  invalidate?(): void
}

export type SettingsPanelProvider = {
  getModel(context: SettingsPanelProviderContext): SettingsPanelModel | Promise<SettingsPanelModel>
  dispatch(action: SettingsPanelAction, context: SettingsPanelProviderContext): void | Promise<void>
}
