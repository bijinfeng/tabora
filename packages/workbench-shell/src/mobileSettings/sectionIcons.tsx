import type { JSX } from "solid-js"
import type { SettingsSectionId } from "@tabora/plugin-api"
import Info from "lucide-solid/icons/info"
import Palette from "lucide-solid/icons/palette"
import Puzzle from "lucide-solid/icons/puzzle"
import RefreshCw from "lucide-solid/icons/refresh-cw"
import Search from "lucide-solid/icons/search"
import Settings from "lucide-solid/icons/settings"
import Sparkles from "lucide-solid/icons/sparkles"
import UserRound from "lucide-solid/icons/user-round"

export function getSectionIcon(sectionId: SettingsSectionId): JSX.Element {
  if (sectionId === "account") return <UserRound size={20} strokeWidth={2.25} />
  if (sectionId === "general") return <Settings size={20} strokeWidth={2.25} />
  if (sectionId === "appearance") return <Palette size={20} strokeWidth={2.25} />
  if (sectionId === "search") return <Search size={20} strokeWidth={2.25} />
  if (sectionId === "ai") return <Sparkles size={20} strokeWidth={2.25} />
  if (sectionId === "sync") return <RefreshCw size={20} strokeWidth={2.25} />
  if (sectionId === "plugins") return <Puzzle size={20} strokeWidth={2.25} />
  return <Info size={20} strokeWidth={2.25} />
}

export function getSectionIconColor(
  sectionId: SettingsSectionId,
): "orange" | "blue" | "green" | "purple" {
  if (sectionId === "account" || sectionId === "appearance" || sectionId === "about")
    return "orange"
  if (sectionId === "general" || sectionId === "search" || sectionId === "plugins") return "blue"
  if (sectionId === "sync") return "green"
  return "purple"
}
