import { makeTimer } from "@solid-primitives/timer"
import { createStore } from "solid-js/store"
import type { PluginRecord } from "@tabora/plugin-api"
import {
  createToastManager,
  type ToastManager,
  type ToastOptions,
  type ToastRecord,
} from "@tabora/orchestrator"

export type CreateWorkbenchRuntimeStoreOptions = {
  createToastManager?: (() => ToastManager) | undefined
}

type WorkbenchRuntimeStoreState = {
  kernelReady: boolean
  pluginRecords: PluginRecord[]
  toasts: ToastRecord[]
}

export function createWorkbenchRuntimeStore(options: CreateWorkbenchRuntimeStoreOptions = {}) {
  const [store, setStore] = createStore<WorkbenchRuntimeStoreState>({
    kernelReady: false,
    pluginRecords: [],
    toasts: [],
  })
  const toastManager = options.createToastManager?.() ?? createToastManager()

  const refreshToasts = () => {
    setStore("toasts", toastManager.list())
  }

  const showToast = (message: string, toastOptions?: ToastOptions) => {
    const id = toastManager.show(message, toastOptions)
    refreshToasts()
    if (!toastManager.shouldAutoDismiss(id)) {
      return
    }

    const toast = toastManager.list().find((item) => item.id === id)
    makeTimer(
      () => {
        toastManager.dismiss(id)
        refreshToasts()
      },
      toast?.duration ?? 2500,
      setTimeout,
    )
  }

  return {
    kernelReady: () => store.kernelReady,
    setKernelReady: (ready: boolean) => setStore("kernelReady", ready),
    pluginRecords: () => store.pluginRecords,
    setPluginRecords: (records: PluginRecord[]) => setStore("pluginRecords", records),
    toasts: () => store.toasts,
    refreshToasts,
    showToast,
  }
}

export type WorkbenchRuntimeStore = ReturnType<typeof createWorkbenchRuntimeStore>
