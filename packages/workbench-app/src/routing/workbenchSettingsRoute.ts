import type { SettingsSectionId } from "@tabora/plugin-api"

export type WorkbenchSettingsRoute =
  | { kind: "workbench"; pathname: string }
  | { kind: "settings"; pathname: string; section: SettingsSectionId | null }

const SETTINGS_SECTION_IDS: readonly SettingsSectionId[] = [
  "general",
  "appearance",
  "search",
  "account",
  "ai",
  "sync",
  "plugins",
  "about",
]

function normalizePathname(pathname: string): string {
  const path = pathname.trim() || "/"
  const prefixed = path.startsWith("/") ? path : `/${path}`
  return prefixed.length > 1 ? prefixed.replace(/\/+$/, "") : prefixed
}

export function isSettingsSectionId(value: string): value is SettingsSectionId {
  return SETTINGS_SECTION_IDS.includes(value as SettingsSectionId)
}

export function settingsRoutePath(section: SettingsSectionId): string {
  return `/settings/${section}`
}

export function settingsHomePath(): string {
  return "/settings"
}

export function parseWorkbenchSettingsRoute(pathname: string): WorkbenchSettingsRoute {
  const normalizedPathname = normalizePathname(pathname)
  const segments = normalizedPathname.split("/").filter(Boolean)

  if (segments[0] !== "settings") {
    return { kind: "workbench", pathname: normalizedPathname }
  }

  const candidate = segments.length === 2 ? segments[1] : undefined
  const section = candidate && isSettingsSectionId(candidate) ? candidate : null
  return { kind: "settings", pathname: normalizedPathname, section }
}
