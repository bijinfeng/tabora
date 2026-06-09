import { createRoot } from "solid-js"
import { describe, expect, it } from "vitest"
import type { Workspace } from "@tabora/plugin-api"

import { createWorkbenchWorkspaceStore } from "./WorkbenchWorkspaceStore"

const workspace = { id: "workspace-1", name: "默认工作区" } as unknown as Workspace

describe("createWorkbenchWorkspaceStore", () => {
  it("starts empty and stores active workspace + list", () => {
    createRoot((dispose) => {
      const store = createWorkbenchWorkspaceStore()

      expect(store.workspaceState()).toBeNull()
      expect(store.workspaceList()).toEqual([])

      store.setWorkspaceState(workspace)
      store.setWorkspaceList([workspace])

      expect(store.workspaceState()).toBe(workspace)
      expect(store.workspaceList()).toEqual([workspace])

      dispose()
    })
  })
})
