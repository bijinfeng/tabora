import { createRoot } from "solid-js"
import { describe, expect, it } from "vitest"
import type { PluginInstance } from "@tabora/plugin-api"

import { createWorkbenchWidgetStore } from "./WorkbenchWidgetStore"

const instance = { id: "instance-1", pluginId: "official.notes" } as unknown as PluginInstance

describe("createWorkbenchWidgetStore", () => {
  it("starts empty and replaces the instance list", () => {
    createRoot((dispose) => {
      const store = createWorkbenchWidgetStore()

      expect(store.instances()).toEqual([])

      store.setInstances([instance])
      expect(store.instances()).toEqual([instance])

      dispose()
    })
  })

  it("supports updater-style setters", () => {
    createRoot((dispose) => {
      const store = createWorkbenchWidgetStore()

      store.setInstances([instance])
      store.setInstances((previous) => [...previous, instance])

      expect(store.instances()).toHaveLength(2)

      dispose()
    })
  })
})
