import { createRoot } from "solid-js"
import { describe, expect, it, vi } from "vitest"
import type { WorkbenchSearchSettings } from "@tabora/plugin-api"
import type { ToastManager } from "@tabora/orchestrator"

import { createWorkbenchShellState } from "./WorkbenchShellState"

const initialSearchSettings: WorkbenchSearchSettings = {
  defaultProviderId: "official.search.google",
  enabledProviderIds: ["official.search.google"],
}

describe("createWorkbenchShellState", () => {
  it("initializes shell signals from the current protocol defaults", () => {
    createRoot((dispose) => {
      const state = createWorkbenchShellState({ initialSearchSettings })

      expect(state.kernelReady()).toBe(false)
      expect(state.activeLayoutId()).toBe("official.layout.workbench-dashboard")
      expect(state.searchSettings()).toEqual(initialSearchSettings)
      expect(state.isDark()).toBe(false)

      state.setThemeId("official.theme.dark")
      expect(state.isDark()).toBe(true)

      dispose()
    })
  })

  it("shows and auto-dismisses plain toasts through the toast manager", () => {
    createRoot((dispose) => {
      const scheduled: Array<{ callback: () => void; delay: number }> = []
      const state = createWorkbenchShellState({
        initialSearchSettings,
        scheduleTimeout: (callback, delay) => {
          scheduled.push({ callback, delay })
          return 1 as ReturnType<typeof setTimeout>
        },
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
      expect(scheduled).toHaveLength(1)
      expect(scheduled[0]?.delay).toBe(2500)

      scheduled[0]?.callback()
      expect(state.toasts()).toEqual([])

      dispose()
    })
  })

  it("does not auto-dismiss action toasts", () => {
    createRoot((dispose) => {
      const scheduleTimeout = vi.fn()
      const state = createWorkbenchShellState({
        initialSearchSettings,
        scheduleTimeout,
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
      expect(scheduleTimeout).not.toHaveBeenCalled()

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
        createToastManager: () => manager,
      })

      state.showToast("Custom", { type: "success" })

      expect(show).toHaveBeenCalledWith("Custom", { type: "success" })
      expect(state.toasts()).toEqual([{ id: "toast-custom", message: "Custom", type: "success" }])

      dispose()
    })
  })
})
