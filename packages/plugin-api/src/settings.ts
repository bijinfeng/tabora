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

export type SettingsTextTone = "default" | "muted" | "danger"
export type SettingsStatusTone = "neutral" | "accent" | "success" | "warning" | "danger"

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
  variant?: "primary" | "secondary" | "ghost" | "danger"
  disabled?: boolean
}

export type SettingsNode =
  | { type: "stack"; children: SettingsNode[] }
  | { type: "group"; title?: string; description?: string; children: SettingsNode[] }
  | { type: "text"; text: string; tone?: SettingsTextTone }
  | SettingsFieldNode
  | { type: "status"; label: string; value: string; tone?: SettingsStatusTone }
  | { type: "actions"; actions: SettingsActionNode[] }

export type SettingsPanelModel = {
  version: 1
  ariaLabel?: string
  nodes: SettingsNode[]
}

export type SettingsPanelAction = {
  id: string
  values: Readonly<Record<string, unknown>>
}

export type SettingsPanelProviderContext = {
  locale?: "zh-CN" | "en-US"
}

export type SettingsPanelProvider = {
  getModel(context: SettingsPanelProviderContext): SettingsPanelModel | Promise<SettingsPanelModel>
  dispatch(action: SettingsPanelAction, context: SettingsPanelProviderContext): void | Promise<void>
}
