import type { Workspace } from "@tabora/plugin-api"

export function currentShortcutPlatform(): string {
  if (typeof navigator === "undefined") return "linux"
  const platform = navigator.platform.toLowerCase()
  if (platform.includes("mac")) return "mac"
  if (platform.includes("win")) return "windows"
  return "linux"
}

export function shortcutDisplay(key: string): string {
  return key
    .split("+")
    .map((part) => {
      if (part === "mod") return "⌘/Ctrl"
      if (part.length === 1) return part.toUpperCase()
      return part
    })
    .join("+")
}

export function requireWorkspace(workspace: Workspace | null): Workspace {
  if (!workspace) {
    throw new Error("Workspace is not ready")
  }

  return workspace
}
