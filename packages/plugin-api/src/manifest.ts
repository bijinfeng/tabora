import type { PluginInstance, Workspace } from "./workspace"

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

export type HostPlatform = "web" | "extension" | "desktop-webview"

export type HostCapabilityId =
  | "externalOpen"
  | "themeApply"
  | "backgroundApply"
  | "importExportWorkspace"
  | "clipboard"
  | "localFile"
  | "network"
  | "storage"

export type WidgetContextMenuContribution = {
  id: string
  label: string
  commandId?: string
  order?: number
  danger?: boolean
  when?: string
}

export type WidgetContribution = {
  id: string
  title: string
  icon?: string
  description?: string
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
  contextMenus?: WidgetContextMenuContribution[]
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
  view?: string
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
  source?: BackgroundSourceValue
  /** 默认 CSS 样式（fallback，当 renderer 不可用时使用） */
  defaultCss?: Record<string, string>
}

export type BackgroundRendererContribution = {
  id: string
  title: string
  accepts: Array<"css" | "image" | "video" | "gradient" | "canvas">
  view: string
}

export type ThemeTokenSet = Record<string, string>

export type ThemeContribution = {
  id: string
  title: string
  tokens: ThemeTokenSet
}

export type BackgroundSourceValue =
  | { type: "css"; css: Record<string, string> }
  | { type: "image"; url: string; fit?: "cover" | "contain" | "fill" }
  | { type: "video"; url: string; poster?: string }
  | { type: "gradient"; css: string }
  | { type: "canvas"; view: string }

export type WorkbenchSearchSettings = {
  defaultProviderId: string
  enabledProviderIds?: string[]
}

export type WorkspacePresetRegionContribution = {
  regionId: string
  accepts: ExtensionPoint[]
}

export type WorkspacePresetInstanceContribution = {
  pluginId: string
  contributionId: string
  instanceId: string
  extensionPoint: PluginInstance["extensionPoint"]
  regionId: string
  size?: WidgetSize
  config?: Record<string, unknown>
}

export type WorkspacePresetContribution = {
  id: string
  title: string
  description?: string
  plugins: string[]
  layoutId: string
  themeId: string
  backgroundProviderId: string
  search: WorkbenchSearchSettings
  instances: WorkspacePresetInstanceContribution[]
  regions: WorkspacePresetRegionContribution[]
}

export type ResolvedBackgroundValue = {
  [K in BackgroundSourceValue["type"]]: Extract<BackgroundSourceValue, { type: K }>
}[BackgroundSourceValue["type"]]

export type BackgroundRendererViewProps = {
  providerId: string
  providerTitle: string
  sourceType: "local" | "remote" | "generated" | "collection"
  resolvedValue: ResolvedBackgroundValue | null
  fallbackStyle: Record<string, string>
}

export type WidgetViewData = {
  get<T = unknown>(key: string): Promise<T | undefined>
  save<T = unknown>(key: string, value: T): Promise<void>
}

export type WidgetViewProps = {
  instanceId: string
  pluginId: string
  contributionId: string
  size: WidgetSize
  supportedSizes: WidgetSize[]
  config: Record<string, unknown>
  data: WidgetViewData
  host: {
    updateConfig(value: Record<string, unknown>): Promise<void>
    removeInstance(): Promise<void>
    requestResize(size: WidgetSize): Promise<void>
    openModal(viewId: string, props?: unknown): void
    closeModal(): void
    openExpand(): void
    showToast(
      message: string,
      opts?: {
        type?: "success" | "error" | "warning" | "info"
        duration?: number
        action?: { label: string; commandId: string }
      },
    ): void
    openExternal(url: string): Promise<boolean>
  }
}

export type SearchHistoryEntry = {
  query: string
  providerId: string
  timestamp: string
}

export type SearchCommandEntry = {
  id: string
  icon: string
  name: string
  desc: string
  shortcut?: string
  action: () => void
}

export type SearchWidgetEntry = {
  instanceId: string
  icon: string
  name: string
  desc: string
  action: () => void
}

export type SearchViewProps = {
  providers: SearchProviderContribution[]
  defaultProviderId: string
  openExternal?: (url: string) => boolean
  onDefaultProviderChange?: (providerId: string) => void | Promise<void>
  searchHistory?: SearchHistoryEntry[]
  commands?: SearchCommandEntry[]
  widgets?: SearchWidgetEntry[]
  onSaveHistory?: (entry: { query: string; providerId: string }) => Promise<void>
  onClearHistory?: () => Promise<void>
}

export type SettingsPanelViewProps = {
  panelId: string
  pluginId: string
  scope: "global" | "workspace" | "plugin" | "instance"
  host: {
    close(): void
    setDirty(isDirty: boolean): void
    switchLayout?(layoutId: string): Promise<void>
    switchTheme(themeId: string): Promise<void>
    switchBackground(backgroundId: string): Promise<void>
    setDefaultSearchProvider(providerId: string): Promise<void>
    setSearchProviderEnabled?(providerId: string, enabled: boolean): Promise<void>
    togglePluginEnabled?(pluginId: string, enabled: boolean): Promise<void>
    exportWorkspace?(): Promise<string>
    importWorkspace?(json: string): Promise<{ warnings: string[] }>
    createWorkspace?(name: string): Promise<void>
    switchWorkspace?(id: string): Promise<void>
    deleteWorkspace?(id: string): Promise<void>
  }
  workspaces?: Workspace[]
  workspace: Workspace
  layouts: LayoutContribution[]
  themes: ThemeContribution[]
  backgrounds: BackgroundProviderContribution[]
  searchProviders: SearchProviderContribution[]
  searchSettings: WorkbenchSearchSettings
  plugins: Array<{
    id: string
    name: string
    version: string
    enabled: boolean
    status?: string
    lastError?: string
    disabledReason?: string
    requiredCapabilities?: HostCapabilityId[]
    supportedPlatforms?: HostPlatform[]
    permissions: PluginPermission[]
    contributes: PluginManifest["contributes"]
  }>
}

export type SettingsPanelContribution = {
  id: string
  title: string
  view: string
  section: "general" | "appearance" | "search" | "plugins" | "about"
  scope: "global" | "workspace" | "plugin" | "instance"
  order?: number
}

export type CommandContribution = {
  id: string
  title: string
  description?: string
  icon?: string
  category: string
  keywords?: string[]
  defaultShortcut?: string
  requiredCapabilities?: string[]
}

export type KeybindingPlatform = "mac" | "windows" | "linux" | (string & {})

export type KeybindingContribution = {
  id: string
  commandId: string
  key: string
  platform?: KeybindingPlatform
  when?: string
  editable?: boolean
}

export type PluginManifest = {
  id: string
  name: string
  version: string
  apiVersion: string
  supportedPlatforms?: HostPlatform[]
  requiredCapabilities?: HostCapabilityId[]
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
    commands?: CommandContribution[]
    keybindings?: KeybindingContribution[]
    workspacePresets?: WorkspacePresetContribution[]
  }
}
