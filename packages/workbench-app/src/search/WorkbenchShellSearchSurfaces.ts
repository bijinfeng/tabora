import type {
  PluginInstance,
  SearchCommandEntry,
  SearchHistoryEntry,
  SearchViewProps,
  SearchWidgetEntry,
} from "@tabora/plugin-api"
import type { CommandPaletteProps } from "@tabora/workbench-shell"
import type { SearchProviderContributionDescriptor, ToastOptions } from "@tabora/orchestrator"

import { buildWorkbenchInlineSearchViewProps } from "./WorkbenchInlineSearchViewProps"
import type { WorkbenchShellCommandPaletteCopy } from "../i18n"

export function createWorkbenchSearchSurfaces(options: {
  getProviders: () => SearchProviderContributionDescriptor[]
  getDefaultProviderId: () => string
  getCommands: () => SearchCommandEntry[]
  getWidgets: () => SearchWidgetEntry[]
  getHistory: () => SearchHistoryEntry[]
  getInlineSearchQuery: () => string
  getInlineSearchOpen: () => boolean
  getInlineSearchActiveResultIndex: () => number
  setInlineSearchQuery: (query: string) => void
  setInlineSearchOpen: (open: boolean) => void
  setInlineSearchActiveResultIndex: (next: number | ((current: number) => number)) => void
  setDefaultProvider: (providerId: string) => void | Promise<void>
  saveHistory: (entry: { query: string; providerId: string }) => Promise<void>
  openExternalForPlugin: (pluginId: string, url: string) => boolean
  showToast: (message: string, options?: ToastOptions) => void
  isCommandPaletteOpen: () => boolean
  closeCommandPalette: () => void
  getCommandPaletteCopy?: () => WorkbenchShellCommandPaletteCopy
}) {
  return {
    buildInlineSearchViewProps(_instance: PluginInstance): SearchViewProps {
      return buildWorkbenchInlineSearchViewProps({
        getQuery: options.getInlineSearchQuery,
        getIsOpen: options.getInlineSearchOpen,
        getActiveResultIndex: options.getInlineSearchActiveResultIndex,
        getProviders: options.getProviders,
        getDefaultProviderId: options.getDefaultProviderId,
        getCommands: options.getCommands,
        getWidgets: options.getWidgets,
        getHistory: options.getHistory,
        setQuery: options.setInlineSearchQuery,
        setOpen: options.setInlineSearchOpen,
        setActiveResultIndex: options.setInlineSearchActiveResultIndex,
        setDefaultProvider: options.setDefaultProvider,
        saveHistory: options.saveHistory,
        openExternal: options.openExternalForPlugin,
        showToast: options.showToast,
      })
    },
    buildCommandPaletteProps(): CommandPaletteProps {
      const copy = options.getCommandPaletteCopy?.()
      return {
        isOpen: options.isCommandPaletteOpen(),
        query: options.getInlineSearchQuery(),
        activeIdx: options.getInlineSearchActiveResultIndex(),
        onQueryChange: options.setInlineSearchQuery,
        onActiveIdxChange: options.setInlineSearchActiveResultIndex,
        onClose: options.closeCommandPalette,
        commands: options.getCommands(),
        widgets: options.getWidgets(),
        providers: options.getProviders(),
        defaultProviderId: options.getDefaultProviderId(),
        searchHistory: options.getHistory(),
        ...(copy ? { copy } : {}),
        openExternalForPlugin: (request) =>
          options.openExternalForPlugin(request.pluginId, request.url),
        onSaveHistory: options.saveHistory,
      }
    },
  }
}
