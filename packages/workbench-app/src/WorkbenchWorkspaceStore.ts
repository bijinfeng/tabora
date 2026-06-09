import { createSignal } from "solid-js"
import type { Workspace } from "@tabora/plugin-api"

// Workspace 装配状态会写入 Dexie/IndexedDB；保留 createSignal 持有原始对象，避免 store proxy 进入结构化克隆。
export function createWorkbenchWorkspaceStore() {
  const [workspaceState, setWorkspaceState] = createSignal<Workspace | null>(null)
  const [workspaceList, setWorkspaceList] = createSignal<Workspace[]>([])

  return {
    workspaceState,
    setWorkspaceState,
    workspaceList,
    setWorkspaceList,
  }
}

export type WorkbenchWorkspaceStore = ReturnType<typeof createWorkbenchWorkspaceStore>
