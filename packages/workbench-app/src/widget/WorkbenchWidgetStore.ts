import { createSignal } from "solid-js"
import type { PluginInstance } from "@tabora/plugin-api"

// PluginInstance[] 会写入 Dexie/IndexedDB；保留 createSignal 持有原始对象，避免 store proxy 进入结构化克隆。
export function createWorkbenchWidgetStore() {
  const [instances, setInstances] = createSignal<PluginInstance[]>([])

  return {
    instances,
    setInstances,
  }
}

export type WorkbenchWidgetStore = ReturnType<typeof createWorkbenchWidgetStore>
