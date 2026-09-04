// Re-export types
export type {
  SettingsPanelDescriptor,
  SettingsSectionId,
  SettingsHostProps,
  SettingsHostCopy,
} from "./types"

// Re-export utilities
export { collectSettingsPanels, resolveInitialSettingsSectionId } from "./utils"

// Re-export from orchestrator (for backward compatibility)
export { resolveInitialSettingsPanelId, resolveSettingsSectionId } from "@tabora/orchestrator"

// Re-export main component
export { SettingsHost } from "./SettingsHost"
