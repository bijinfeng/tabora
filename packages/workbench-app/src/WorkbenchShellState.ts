import { createSignal } from "solid-js"
import type {
  PluginInstance,
  PluginRecord,
  SearchHistoryEntry,
  WorkbenchSearchSettings,
  Workspace,
} from "@tabora/plugin-api"
import {
  createToastManager,
  type ToastManager,
  type ToastOptions,
  type ToastRecord,
} from "@tabora/orchestrator"
import type { SettingsSectionId } from "@tabora/workbench-shell"

import { isWorkbenchDarkTheme } from "./shellConfig"
import type { WorkbenchDragControllerState } from "./WorkbenchDragController"
import type { WorkbenchExpandState } from "./WorkbenchShellInteractions"

export type WorkbenchContextMenuState = {
  x: number
  y: number
  instanceId: string
}

type ScheduleTimeout = (callback: () => void, delay: number) => ReturnType<typeof setTimeout>

export type CreateWorkbenchShellStateOptions = {
  initialSearchSettings: WorkbenchSearchSettings
  initialVisualState: {
    layoutId: string
    themeId: string
    backgroundId: string
  }
  darkThemeId: string
  createToastManager?: () => ToastManager
  scheduleTimeout?: ScheduleTimeout
}

export function createWorkbenchShellState(options: CreateWorkbenchShellStateOptions) {
  const [kernelReady, setKernelReady] = createSignal(false)
  const [instances, setInstances] = createSignal<PluginInstance[]>([])
  const [activeLayoutId, setActiveLayoutId] = createSignal(options.initialVisualState.layoutId)
  const [themeId, setThemeId] = createSignal(options.initialVisualState.themeId)
  const [backgroundId, setBackgroundId] = createSignal(options.initialVisualState.backgroundId)
  const [workspaceState, setWorkspaceState] = createSignal<Workspace | null>(null)
  const [workspaceList, setWorkspaceList] = createSignal<Workspace[]>([])
  const [settingsOpen, setSettingsOpen] = createSignal(false)
  const [activeSettingsSectionId, setActiveSettingsSectionId] =
    createSignal<SettingsSectionId>("general")
  const [searchSettings, setSearchSettings] = createSignal(options.initialSearchSettings)
  const [modalViewId, setModalViewId] = createSignal<string | null>(null)
  const [modalProps, setModalProps] = createSignal<Record<string, unknown>>({})
  const [fullscreenViewId, setFullscreenViewId] = createSignal<string | null>(null)
  const [fullscreenProps, setFullscreenProps] = createSignal<Record<string, unknown>>({})
  const [expandState, setExpandState] = createSignal<WorkbenchExpandState | null>(null)
  const [dragState, setDragState] = createSignal<WorkbenchDragControllerState | null>(null)
  const [ctxMenu, setCtxMenu] = createSignal<WorkbenchContextMenuState | null>(null)
  const [addWidgetOpen, setAddWidgetOpen] = createSignal(false)
  const [cmdPaletteOpen, setCmdPaletteOpen] = createSignal(false)
  const [pluginRecords, setPluginRecords] = createSignal<PluginRecord[]>([])
  const toastManager = options.createToastManager?.() ?? createToastManager()
  const [toasts, setToasts] = createSignal<ToastRecord[]>([])
  const [searchHistory, setSearchHistory] = createSignal<SearchHistoryEntry[]>([])
  const [inlineSearchQuery, setInlineSearchQuery] = createSignal("")
  const [inlineSearchOpen, setInlineSearchOpen] = createSignal(false)
  const [inlineSearchActiveResultIndex, setInlineSearchActiveResultIndex] = createSignal(-1)

  const refreshToasts = () => {
    setToasts(toastManager.list())
  }

  const showToast = (message: string, toastOptions?: ToastOptions) => {
    const id = toastManager.show(message, toastOptions)
    refreshToasts()
    if (!toastManager.shouldAutoDismiss(id)) {
      return
    }

    const toast = toastManager.list().find((item) => item.id === id)
    const scheduleTimeout = options.scheduleTimeout ?? setTimeout
    scheduleTimeout(() => {
      toastManager.dismiss(id)
      refreshToasts()
    }, toast?.duration ?? 2500)
  }

  const isDark = () => isWorkbenchDarkTheme(themeId(), options.darkThemeId)

  return {
    kernelReady,
    setKernelReady,
    instances,
    setInstances,
    activeLayoutId,
    setActiveLayoutId,
    themeId,
    setThemeId,
    backgroundId,
    setBackgroundId,
    workspaceState,
    setWorkspaceState,
    workspaceList,
    setWorkspaceList,
    settingsOpen,
    setSettingsOpen,
    activeSettingsSectionId,
    setActiveSettingsSectionId,
    searchSettings,
    setSearchSettings,
    modalViewId,
    setModalViewId,
    modalProps,
    setModalProps,
    fullscreenViewId,
    setFullscreenViewId,
    fullscreenProps,
    setFullscreenProps,
    expandState,
    setExpandState,
    dragState,
    setDragState,
    ctxMenu,
    setCtxMenu,
    addWidgetOpen,
    setAddWidgetOpen,
    cmdPaletteOpen,
    setCmdPaletteOpen,
    pluginRecords,
    setPluginRecords,
    toasts,
    searchHistory,
    setSearchHistory,
    inlineSearchQuery,
    setInlineSearchQuery,
    inlineSearchOpen,
    setInlineSearchOpen,
    inlineSearchActiveResultIndex,
    setInlineSearchActiveResultIndex,
    isDark,
    refreshToasts,
    showToast,
  }
}
