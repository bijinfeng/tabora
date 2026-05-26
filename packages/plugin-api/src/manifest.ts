export type ExtensionPoint =
  | "layout"
  | "widget"
  | "search"
  | "search-provider"
  | "background-provider"
  | "background-renderer"
  | "theme"
  | "settings-panel"

export type WidgetSize = "S" | "M" | "L" | "XL"

export type PluginPermission =
  | { type: "storage"; scope: "plugin" }
  | { type: "workspace"; access: "read" | "write" }
  | { type: "network"; hosts: string[] }
  | { type: "clipboard"; access: "read" | "write" }
  | { type: "local-file"; access: "read" | "write" }
  | { type: "external-open"; hosts: string[] }

export type WidgetContribution = {
  id: string
  title: string
  icon?: string
  supportedSizes: WidgetSize[]
  defaultSize: WidgetSize
  allowMultipleInstances: boolean
  defaultConfig?: Record<string, unknown>
  views: {
    card: string
    modal?: string
    fullscreen?: string
    settings?: string
  }
}

export type LayoutRegion = {
  id: string
  title: string
  accepts: ExtensionPoint[]
  required?: boolean
  maxInstances?: number
}

export type PluginInstanceRef = {
  instanceId: string
}

export type LayoutContribution = {
  id: string
  title: string
  preview?: string
  regions: LayoutRegion[]
  defaultRegions: Record<string, PluginInstanceRef[]>
  supportsResponsive: boolean
}

export type SearchContribution = {
  id: string
  title: string
  defaultProviderIds?: string[]
  supportsSuggestions?: boolean
  view: string
}

export type SearchProviderContribution = {
  id: string
  title: string
  icon?: string
  urlTemplate: string
  suggestionEndpoint?: string
  shortcut?: string
}

export type BackgroundProviderContribution = {
  id: string
  title: string
  sourceType: "local" | "remote" | "generated" | "collection"
}

export type BackgroundRendererContribution = {
  id: string
  title: string
  accepts: Array<"image" | "video" | "gradient" | "canvas" | "webgl">
  view: string
}

export type ThemeTokenSet = Record<string, string>

export type ThemeContribution = {
  id: string
  title: string
  tokens: ThemeTokenSet
}

export type SettingsPanelContribution = {
  id: string
  title: string
  view: string
}

export type PluginManifest = {
  id: string
  name: string
  version: string
  publisher?: string
  description?: string
  icon?: string
  entry: string
  engine: {
    platform: string
  }
  permissions?: PluginPermission[]
  contributes: {
    layouts?: LayoutContribution[]
    widgets?: WidgetContribution[]
    searches?: SearchContribution[]
    searchProviders?: SearchProviderContribution[]
    backgroundProviders?: BackgroundProviderContribution[]
    backgroundRenderers?: BackgroundRendererContribution[]
    themes?: ThemeContribution[]
    settingsPanels?: SettingsPanelContribution[]
  }
}
