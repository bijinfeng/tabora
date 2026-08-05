import type { AiRuntimeBridge } from "./ai"
import type { PluginManifest, PluginPermission } from "./manifest"
import type { SettingsPanelProvider } from "./settings"

/** A renderable plugin view. The host owns rendering and supplies the matching props contract. */
export type PluginViewComponent = (...args: any[]) => unknown

export type PluginActivationDisposer = () => void

export type PluginCommandInvocation = {
  commandId: string
  source: "palette" | "shortcut" | "context-menu" | "programmatic"
  instanceId?: string
}

export type PluginCommandHandler = (invocation: PluginCommandInvocation) => void | Promise<void>

/**
 * Registration is deliberately write-only. Plugins can register only values declared in
 * their own manifest; resolving another plugin's registrations is a host responsibility.
 */
export type PluginViewRegistration = {
  register(viewId: string, view: PluginViewComponent): PluginActivationDisposer
}

export type PluginSettingsRegistration = {
  register(providerId: string, provider: SettingsPanelProvider): PluginActivationDisposer
}

export type PluginCommandRegistration = {
  register(commandId: string, handler: PluginCommandHandler): PluginActivationDisposer
}

export type PluginUiBridge = {
  openModal(viewId: string, props?: Record<string, unknown>): void
  closeModal(): void
  openFullscreen(viewId: string, props?: Record<string, unknown>): void
  closeFullscreen(): void
  showToast(
    message: string,
    options?: {
      type?: "success" | "error" | "warning" | "info"
      duration?: number
      action?: { label: string; commandId: string }
    },
  ): void
}

export type PluginPermissionBridge = {
  canOpenExternal(url: string): boolean
  openExternal(url: string): boolean
}

/** Host-owned outbound request implementation. Plugin code never reaches global fetch directly. */
export type PluginNetworkBridge = {
  fetch(url: string, init?: RequestInit): Promise<Response>
}

export type PluginNetworkAccess = {
  canFetch(url: string): boolean
  fetch(url: string, init?: RequestInit): Promise<Response>
}

export type PluginI18nMessageBundle = {
  locale: string
  messages: Record<string, string>
}

export type PluginI18nBridge = {
  locale(): string
  registerMessages(bundles: PluginI18nMessageBundle[]): void
  t(key: string, vars?: Record<string, string | number>): string
  formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string
  formatNumber(value: number, options?: Intl.NumberFormatOptions): string
}

/** Public Plugin SDK runtime facade. It intentionally exposes no global registry lookup. */
export type PluginContext = {
  pluginId: string
  views: PluginViewRegistration
  settings: PluginSettingsRegistration
  commands: PluginCommandRegistration
  ui: PluginUiBridge
  permissions: PluginPermissionBridge
  network: PluginNetworkAccess
  ai?: AiRuntimeBridge
  i18n?: PluginI18nBridge
  logger: {
    warn(message: string): void
    error(message: string): void
  }
}

/** The complete module contract owned by a plugin author. */
export type PluginModule = {
  manifest: PluginManifest
  activate(
    context: PluginContext,
  ): void | PluginActivationDisposer | Promise<void | PluginActivationDisposer>
}

/** Requested permissions stay in the manifest; this helper names a host-owned grant set. */
export type PluginPermissionGrant = PluginPermission
