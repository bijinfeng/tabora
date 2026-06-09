import { createSignal } from "solid-js"
import type { SearchHistoryEntry, WorkbenchSearchSettings } from "@tabora/plugin-api"

export type CreateWorkbenchSearchStoreOptions = {
  initialSearchSettings: WorkbenchSearchSettings
}

// searchSettings / searchHistory 会写入 Dexie/IndexedDB；保留 createSignal 持有原始对象，避免 store proxy 进入结构化克隆。
export function createWorkbenchSearchStore(options: CreateWorkbenchSearchStoreOptions) {
  const [searchSettings, setSearchSettings] = createSignal(options.initialSearchSettings)
  const [searchHistory, setSearchHistory] = createSignal<SearchHistoryEntry[]>([])
  const [inlineSearchQuery, setInlineSearchQuery] = createSignal("")
  const [inlineSearchOpen, setInlineSearchOpen] = createSignal(false)
  const [inlineSearchActiveResultIndex, setInlineSearchActiveResultIndex] = createSignal(-1)

  return {
    searchSettings,
    setSearchSettings,
    searchHistory,
    setSearchHistory,
    inlineSearchQuery,
    setInlineSearchQuery,
    inlineSearchOpen,
    setInlineSearchOpen,
    inlineSearchActiveResultIndex,
    setInlineSearchActiveResultIndex,
  }
}

export type WorkbenchSearchStore = ReturnType<typeof createWorkbenchSearchStore>
