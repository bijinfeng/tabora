import type { SettingsSectionId } from "@tabora/plugin-api"

export type MobileSettingsIndexProps = {
  title: string
  visibleSections: SettingsSectionId[]
  searchPlaceholder: string
  sectionTitle: (sectionId: SettingsSectionId) => string
  sectionDescription: (sectionId: SettingsSectionId) => string
  sectionMeta?: (sectionId: SettingsSectionId) => string
  onSectionChange: (sectionId: SettingsSectionId) => void
  onClose: () => void
  backAriaLabel?: string
}
