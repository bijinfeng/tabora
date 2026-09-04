import type { AiPermissionAccess } from "./ai"
import type { SettingsPanelScope, SettingsSectionId, SettingsSurface } from "./settings"

/** Every manifest contribution has one of these kinds. */
export type ContributionKind =
  | "layout"
  | "widget"
  | "search"
  | "search-provider"
  | "background-provider"
  | "background-renderer"
  | "theme"
  | "settings-panel"

/** Legacy alias retained while region contracts migrate to RegionContentKind. */
export type ExtensionPoint = ContributionKind

/** Only renderable content may be placed in a layout region. */
export type RegionContentKind = "widget" | "search"

/** Canonical host-side identity for a manifest contribution. */
export type ContributionRefKind = ContributionKind | "command" | "keybinding" | "workspace-preset"

export type ContributionRef<K extends ContributionRefKind = ContributionRefKind> = {
  pluginId: string
  kind: K
  id: string
}

export function contributionRefKey(ref: ContributionRef): string {
  return `${ref.pluginId}:${ref.kind}:${ref.id}`
}

export function sameContributionRef(left: ContributionRef, right: ContributionRef): boolean {
  return left.pluginId === right.pluginId && left.kind === right.kind && left.id === right.id
}

/** A contribution that can be persisted in a layout region. */
export type RegionContributionRef = ContributionRef<RegionContentKind>
export type LayoutContributionRef = ContributionRef<"layout">
export type ThemeContributionRef = ContributionRef<"theme">
export type SearchProviderContributionRef = ContributionRef<"search-provider">
export type BackgroundProviderContributionRef = ContributionRef<"background-provider">
export type BackgroundRendererContributionRef = ContributionRef<"background-renderer">
export type OwnedContribution<T, K extends ContributionRefKind> = T & {
  ref: ContributionRef<K>
}

export type WidgetSize = "S" | "M" | "L" | "XL"

export type PluginPermission =
  | { type: "ai"; access: AiPermissionAccess[] }
  | { type: "external-open"; hosts: string[] }
  | { type: "network"; hosts: string[] }

export type PluginStyleScope = "plugin" | "global"

export type PluginStyleContribution = {
  href: string
  scope?: PluginStyleScope
  order?: number
}

/** An explicitly portable plugin-data collection. All plugin data is local-only unless listed here. */
export type PluginSyncCollection = {
  id: string
  recordKey: "id"
  updatedAt: "updatedAt"
  merge: "lww"
  schemaVersion: number
  excludedFields?: string[]
}

export type HostPlatform = "web" | "extension" | "desktop-webview"

export type HostCapabilityId =
  | "ai"
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
    expand?: string
    expandFooter?: string
    settings?: string
  }
  contextMenus?: WidgetContextMenuContribution[]
}

export type SearchContribution = {
  id: string
  title: string
  defaultProviders?: SearchProviderContributionRef[]
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
  defaultProvider: SearchProviderContributionRef
  enabledProviders: SearchProviderContributionRef[]
}

export type WorkspacePresetRegionContribution = {
  regionId: string
  accepts: RegionContentKind[]
}

type WorkspacePresetInstanceBaseContribution = {
  /** Canonical contribution identity persisted into the created instance. */
  contribution: RegionContributionRef
  instanceId: string
  regionId: string
  config?: Record<string, unknown>
}

export type WorkspacePresetInstanceContribution =
  | (WorkspacePresetInstanceBaseContribution & {
      contribution: RegionContributionRef & { kind: "widget" }
      size: WidgetSize
    })
  | (WorkspacePresetInstanceBaseContribution & {
      contribution: RegionContributionRef & { kind: Exclude<RegionContentKind, "widget"> }
      size?: never
    })

export type WorkspacePresetContribution = {
  id: string
  title: string
  description?: string
  plugins: string[]
  layout: LayoutContributionRef
  theme: ThemeContributionRef
  backgroundProvider: BackgroundProviderContributionRef
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
    /** Read-only snapshot of the workspace AI settings; present only when the host wired it. */
    getAiSettings?(): Promise<SettingsAiSettings>
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
  action: () => void | Promise<void>
}

export type SearchWidgetEntry = {
  instanceId: string
  icon: string
  name: string
  desc: string
  action: () => void
}

export type SearchResultItem = {
  id: string
  icon: string
  name: string
  desc: string
  hint?: string
}

export type SearchResultGroup = {
  id: string
  label: string
  items: SearchResultItem[]
}

export type SearchViewProps = {
  entry: "inline" | "palette"
  providers: SearchProviderContribution[]
  defaultProviderId: string
  activeProviderId: string
  query: string
  providerToken: string | null
  recentSearches: string[]
  results: SearchResultGroup[]
  activeResultIndex: number
  isOpen: boolean
  host: {
    setQuery(query: string): void
    submit(query: string, providerId?: string): Promise<void>
    setActiveProvider(providerId: string): void | Promise<void>
    resolveProvider(keyword: string): SearchProviderContribution | null
    moveSelection(direction: "next" | "prev"): void
    executeSelection(resultIndex?: number): Promise<void>
    open(): void
    close(): void
    showToast(message: string): void
  }
}

export type SettingsHostReadId =
  | "workspace.current.read"
  | "workspace.list.read"
  | "catalog.themes.read"
  | "catalog.backgrounds.read"
  | "catalog.search-providers.read"
  | "workspace.search.read"
  | "plugins.read"
  | "ai.settings.read"

export type SettingsAiInputModality = "text" | "image" | "audio" | "document"

/** Explicit model capability; clients must not infer it from a model identifier. */
export type SettingsAiReasoningCapabilities = {
  effort?: boolean
  summary?: boolean
  continuation?: boolean
}

export type SettingsAiModel = {
  id: string
  label: string
  /** Absent only for a legacy host; clients retain historic text/image behavior. */
  inputModalities?: SettingsAiInputModality[]
  reasoning?: SettingsAiReasoningCapabilities
}

/**
 * Safe AI configuration projection for settings views. API keys are deliberately
 * represented only as an availability flag and are never part of this contract.
 */
export type SettingsAiSettings = {
  supportedProviders?: Array<"builtin" | "custom">
  activeProvider: "builtin" | "custom"
  builtin: {
    status: "available" | "auth-required" | "unavailable"
    models: SettingsAiModel[]
    modelId: string
  }
  custom: {
    /** User-facing name for the configured provider. */
    name?: string
    baseUrl: string
    model: string
    models?: string[]
    /** Legacy custom settings use the historic Chat Completions text/image contract. */
    api?: "chat-completions" | "responses"
    inputModalities?: SettingsAiInputModality[]
    reasoning?: SettingsAiReasoningCapabilities
    apiKeyConfigured: boolean
    /** Whether an empty update keeps the existing secret on this host. */
    preservesApiKeyOnSave?: boolean
  }
}

export type SettingsAiSettingsUpdate = {
  activeProvider: SettingsAiSettings["activeProvider"]
  builtinModelId: string
  custom: {
    /** User-facing name for the configured provider. */
    name?: string
    baseUrl: string
    model: string
    models?: string[]
    api?: "chat-completions" | "responses"
    inputModalities?: SettingsAiInputModality[]
    reasoning?: SettingsAiReasoningCapabilities
    /** A missing key preserves the current local secret; it is never read back. */
    apiKey?: string
  }
}

/** Host-owned persistence boundary for an AI settings surface. */
export type AiSettingsService = {
  getSettings(): Promise<SettingsAiSettings>
  saveSettings(update: SettingsAiSettingsUpdate): Promise<SettingsAiSettings>
  /** Discover models without exposing a host-stored API key to the settings view. */
  discoverCustomModels?(baseUrl: string, apiKey?: string): Promise<string[]>
}

/** Read-only projection; intentionally not the host's persisted Workspace entity. */
export type SettingsWorkspaceSummary = {
  id: string
  name: string
  activeLayout: LayoutContributionRef
  activeTheme: ThemeContributionRef
  activeBackgroundProvider: BackgroundProviderContributionRef
  activeBackgroundRenderer?: BackgroundRendererContributionRef
  regionCount: number
}

export type SettingsPluginSummary = {
  id: string
  name: string
  version: string
  enabled: boolean
  status?: string
  lastError?: string
  disabledReason?: string
  requiredCapabilities?: HostCapabilityId[]
  supportedPlatforms?: HostPlatform[]
  /** Contribution counts avoid leaking a plugin's entire executable declaration. */
  contributionKinds: Array<ContributionRefKind>
}

export type SettingsPanelData = {
  workspace?: SettingsWorkspaceSummary
  workspaces?: SettingsWorkspaceSummary[]
  themes?: Array<OwnedContribution<ThemeContribution, "theme">>
  backgrounds?: Array<OwnedContribution<BackgroundProviderContribution, "background-provider">>
  searchProviders?: Array<OwnedContribution<SearchProviderContribution, "search-provider">>
  searchSettings?: WorkbenchSearchSettings
  plugins?: SettingsPluginSummary[]
  ai?: SettingsAiSettings
}

export type SettingsPanelViewProps = {
  panelId: string
  pluginId: string
  scope: SettingsPanelScope
  surface: SettingsSurface
  /** Present only when an instance-scoped panel was opened for a concrete plugin instance. */
  instanceId?: string
  locale?: "zh-CN" | "en-US"
  availableLocales?: Array<{ value: "zh-CN" | "en-US"; label: string }>
  host: {
    close(): void
    setDirty(isDirty: boolean): void
    switchTheme?(theme: ThemeContributionRef): Promise<void>
    switchBackground?(background: BackgroundProviderContributionRef): Promise<void>
    switchLocale?(locale: "zh-CN" | "en-US"): Promise<void>
    setDefaultSearchProvider?(provider: SearchProviderContributionRef): Promise<void>
    setSearchProviderEnabled?(
      provider: SearchProviderContributionRef,
      enabled: boolean,
    ): Promise<void>
    togglePluginEnabled?(pluginId: string, enabled: boolean): Promise<void>
    exportWorkspace?(): Promise<string>
    importWorkspace?(json: string): Promise<{ warnings: string[] }>
    createWorkspace?(name: string): Promise<void>
    switchWorkspace?(id: string): Promise<void>
    deleteWorkspace?(id: string): Promise<void>
    getAiSettings?(): Promise<SettingsAiSettings>
    saveAiSettings?(update: SettingsAiSettingsUpdate): Promise<SettingsAiSettings>
    discoverAiModels?(baseUrl: string, apiKey?: string): Promise<string[]>
  }
  /** Only properties explicitly requested by the panel and granted by the host are present. */
  data: Readonly<SettingsPanelData>
}

/** Explicit host actions a custom settings view may request from its shell. */
export type SettingsHostActionId =
  | "workspace.theme.write"
  | "workspace.background.write"
  | "workspace.locale.write"
  | "workspace.search.write"
  | "workspace.transfer"
  | "workspace.manage"
  | "plugins.manage"
  | "ai.settings.write"

export type SettingsPanelContribution = {
  id: string
  title: string
  section: SettingsSectionId
  scope: SettingsPanelScope
  surfaces: SettingsSurface[]
  order?: number
  /** Requested host actions. The host grants a subset based on its capabilities and policy. */
  hostActions?: SettingsHostActionId[]
  /** Requested read-only host data. Missing grants are omitted from custom-view props. */
  hostReads?: SettingsHostReadId[]
  content:
    | {
        kind: "schema"
        provider: string
        schemaVersion: 1
      }
    | {
        kind: "custom-view"
        view: string
      }
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
  styles?: PluginStyleContribution[]
  engine: {
    platform: string
  }
  permissions?: PluginPermission[]
  sync?: {
    collections: PluginSyncCollection[]
  }
  contributes: {
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
