import type { PluginInstance } from "@tabora/plugin-api"

import { mergeWorkbenchGridOrder } from "./WorkbenchShellWidgets"

export function focusWorkbenchWidgetInstance(instanceId: string): boolean {
  const card = document.querySelector<HTMLElement>(`[data-widget-instance-id="${instanceId}"]`)
  if (!card) return false
  card.scrollIntoView({ behavior: "smooth", block: "center" })
  card.focus()
  return true
}

export async function persistWorkbenchGridOrder(options: {
  currentInstances: PluginInstance[]
  orderedInstances: PluginInstance[]
  saveInstance: (instance: PluginInstance) => Promise<void>
  setInstances: (instances: PluginInstance[]) => void
}) {
  for (const instance of options.orderedInstances) {
    await options.saveInstance(instance)
  }

  options.setInstances(mergeWorkbenchGridOrder(options.currentInstances, options.orderedInstances))
}

export function runWorkbenchRailAction(
  actionId: string,
  options: {
    platform: string
    onAddWidget: () => void
    onToggleTheme: () => void
    onOpenSettings: () => void
  },
) {
  if (actionId === "add-widget") {
    options.onAddWidget()
  } else if (actionId === "theme") {
    options.onToggleTheme()
  } else if (actionId === "settings") {
    options.onOpenSettings()
  } else if (actionId === "home" && options.platform === "web") {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }
}
