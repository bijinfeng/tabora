import { createRoot } from "solid-js"
import { describe, expect, it } from "vitest"

import { createWorkbenchOverlayStore } from "./WorkbenchOverlayStore"

describe("createWorkbenchOverlayStore", () => {
  it("starts with every overlay closed", () => {
    createRoot((dispose) => {
      const overlays = createWorkbenchOverlayStore()

      expect(overlays.settingsOpen()).toBe(false)
      expect(overlays.activeSettingsSectionId()).toBe("general")
      expect(overlays.modalViewId()).toBeNull()
      expect(overlays.modalProps()).toEqual({})
      expect(overlays.fullscreenViewId()).toBeNull()
      expect(overlays.fullscreenProps()).toEqual({})
      expect(overlays.addWidgetOpen()).toBe(false)
      expect(overlays.cmdPaletteOpen()).toBe(false)
      expect(overlays.ctxMenu()).toBeNull()
      expect(overlays.expandState()).toBeNull()
      expect(overlays.dragState()).toBeNull()

      dispose()
    })
  })

  it("toggles flags and routes settings section changes", () => {
    createRoot((dispose) => {
      const overlays = createWorkbenchOverlayStore()

      overlays.setSettingsOpen(true)
      overlays.setAddWidgetOpen(true)
      overlays.setCmdPaletteOpen(true)
      overlays.setActiveSettingsSectionId("appearance")

      expect(overlays.settingsOpen()).toBe(true)
      expect(overlays.addWidgetOpen()).toBe(true)
      expect(overlays.cmdPaletteOpen()).toBe(true)
      expect(overlays.activeSettingsSectionId()).toBe("appearance")

      dispose()
    })
  })

  it("replaces modal / fullscreen surface state and can clear it", () => {
    createRoot((dispose) => {
      const overlays = createWorkbenchOverlayStore()

      overlays.setModalViewId("official.plugin-manager.modal")
      overlays.setModalProps({ pluginId: "official.notes" })
      expect(overlays.modalViewId()).toBe("official.plugin-manager.modal")
      expect(overlays.modalProps()).toEqual({ pluginId: "official.notes" })

      // 整体替换语义（不是 merge）：旧 key 必须被丢弃。
      overlays.setModalProps({ next: true })
      expect(overlays.modalProps()).toEqual({ next: true })

      overlays.setModalViewId(null)
      expect(overlays.modalViewId()).toBeNull()

      overlays.setFullscreenViewId("official.notes.fullscreen")
      overlays.setFullscreenProps({ instanceId: "instance-1" })
      expect(overlays.fullscreenViewId()).toBe("official.notes.fullscreen")
      expect(overlays.fullscreenProps()).toEqual({ instanceId: "instance-1" })

      overlays.setFullscreenProps({ replaced: true })
      expect(overlays.fullscreenProps()).toEqual({ replaced: true })

      overlays.setFullscreenViewId(null)
      expect(overlays.fullscreenViewId()).toBeNull()

      dispose()
    })
  })

  it("round-trips expand and drag interaction state", () => {
    createRoot((dispose) => {
      const overlays = createWorkbenchOverlayStore()

      const expandState = { instanceId: "instance-1", mode: "expand" } as unknown as Parameters<
        typeof overlays.setExpandState
      >[0]
      overlays.setExpandState(expandState)
      expect(overlays.expandState()).toBe(expandState)
      overlays.setExpandState(null)
      expect(overlays.expandState()).toBeNull()

      const dragState = { activeInstanceId: "instance-1" } as unknown as Parameters<
        typeof overlays.setDragState
      >[0]
      overlays.setDragState(dragState)
      expect(overlays.dragState()).toBe(dragState)
      overlays.setDragState(null)
      expect(overlays.dragState()).toBeNull()

      dispose()
    })
  })

  it("tracks the context menu anchor", () => {
    createRoot((dispose) => {
      const overlays = createWorkbenchOverlayStore()

      overlays.setCtxMenu({ x: 12, y: 24, instanceId: "instance-1" })
      expect(overlays.ctxMenu()).toEqual({ x: 12, y: 24, instanceId: "instance-1" })

      overlays.setCtxMenu(null)
      expect(overlays.ctxMenu()).toBeNull()

      dispose()
    })
  })
})
