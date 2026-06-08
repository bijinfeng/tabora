import { createRoot } from "solid-js"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { WorkbenchSearchSettings } from "@tabora/plugin-api"
import type { ToastManager } from "@tabora/orchestrator"

import { createWorkbenchShellState } from "./WorkbenchShellState"

const initialSearchSettings: WorkbenchSearchSettings = {
  defaultProviderId: "official.search.google",
  enabledProviderIds: ["official.search.google"],
}

const initialVisualState = {
  layoutId: "community.layout.board",
  themeId: "theme.light.custom",
  backgroundId: "background.clouds",
}

describe("createWorkbenchShellState", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("initializes shell signals from injected visual defaults", () => {
    createRoot((dispose) => {
      const state = createWorkbenchShellState({
        initialSearchSettings,
        initialVisualState,
        darkThemeId: "theme.dark.custom",
      })

      expect(state.kernelReady()).toBe(false)
      expect(state.activeLayoutId()).toBe("community.layout.board")
      expect(state.backgroundId()).toBe("background.clouds")
      expect(state.searchSettings()).toEqual(initialSearchSettings)
      expect(state.isDark()).toBe(false)

      state.setThemeId("theme.dark.custom")
      expect(state.isDark()).toBe(true)

      dispose()
    })
  })

  it("shows and auto-dismisses plain toasts through the toast manager", () => {
    createRoot((dispose) => {
      const state = createWorkbenchShellState({
        initialSearchSettings,
        initialVisualState,
        darkThemeId: "theme.dark.custom",
      })

      state.showToast("已保存")

      expect(state.toasts()).toEqual([
        {
          id: "toast-1",
          message: "已保存",
          type: "info",
          duration: 2500,
        },
      ])

      vi.advanceTimersByTime(2500)
      expect(state.toasts()).toEqual([])

      dispose()
    })
  })

  it("does not auto-dismiss action toasts", () => {
    createRoot((dispose) => {
      const state = createWorkbenchShellState({
        initialSearchSettings,
        initialVisualState,
        darkThemeId: "theme.dark.custom",
      })

      state.showToast("查看详情", {
        type: "error",
        action: { label: "打开", commandId: "open-details" },
      })

      expect(state.toasts()).toEqual([
        {
          id: "toast-1",
          message: "查看详情",
          type: "error",
          action: { label: "打开", commandId: "open-details" },
        },
      ])

      vi.runAllTimers()
      expect(state.toasts()).toHaveLength(1)

      dispose()
    })
  })

  it("can use an injected toast manager implementation", () => {
    createRoot((dispose) => {
      const show = vi.fn<ToastManager["show"]>(() => "toast-custom")
      const dismiss = vi.fn<ToastManager["dismiss"]>(() => {})
      const list = vi.fn<ToastManager["list"]>(() => [
        { id: "toast-custom", message: "Custom", type: "success" },
      ])
      const shouldAutoDismiss = vi.fn<ToastManager["shouldAutoDismiss"]>(() => false)
      const manager: ToastManager = {
        show,
        dismiss,
        list,
        shouldAutoDismiss,
      }
      const state = createWorkbenchShellState({
        initialSearchSettings,
        initialVisualState,
        darkThemeId: "theme.dark.custom",
        createToastManager: () => manager,
      })

      state.showToast("Custom", { type: "success" })

      expect(show).toHaveBeenCalledWith("Custom", { type: "success" })
      expect(state.toasts()).toEqual([{ id: "toast-custom", message: "Custom", type: "success" }])

      dispose()
    })
  })
})
