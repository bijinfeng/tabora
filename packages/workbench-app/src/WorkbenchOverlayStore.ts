import { createSignal } from "solid-js"
import { createStore } from "solid-js/store"
import type { SettingsSectionId } from "@tabora/workbench-shell"

import type { WorkbenchDragControllerState } from "./WorkbenchDragController"
import type { WorkbenchExpandState } from "./WorkbenchShellInteractions"

export type WorkbenchContextMenuState = {
  x: number
  y: number
  instanceId: string
}

// 标量开关/视图 id 用 createStore 分组；这些值（boolean / string / null）replace 语义安全。
type WorkbenchOverlayFlags = {
  settingsOpen: boolean
  activeSettingsSectionId: SettingsSectionId
  modalViewId: string | null
  fullscreenViewId: string | null
  addWidgetOpen: boolean
  cmdPaletteOpen: boolean
}

// 注意：Solid 的 setStore("key", objectValue) 对「非数组对象」是 merge 而非 replace。
// modalProps / fullscreenProps / ctxMenu / expandState / dragState 都需要整体替换语义，
// 因此用 createSignal 持有（同时保留原始对象引用，不被 store proxy 包裹）。
export function createWorkbenchOverlayStore() {
  const [flags, setFlags] = createStore<WorkbenchOverlayFlags>({
    settingsOpen: false,
    activeSettingsSectionId: "general",
    modalViewId: null,
    fullscreenViewId: null,
    addWidgetOpen: false,
    cmdPaletteOpen: false,
  })
  const [modalProps, setModalProps] = createSignal<Record<string, unknown>>({})
  const [fullscreenProps, setFullscreenProps] = createSignal<Record<string, unknown>>({})
  const [ctxMenu, setCtxMenu] = createSignal<WorkbenchContextMenuState | null>(null)
  const [expandState, setExpandState] = createSignal<WorkbenchExpandState | null>(null)
  const [dragState, setDragState] = createSignal<WorkbenchDragControllerState | null>(null)

  return {
    settingsOpen: () => flags.settingsOpen,
    setSettingsOpen: (open: boolean) => setFlags("settingsOpen", open),
    activeSettingsSectionId: () => flags.activeSettingsSectionId,
    setActiveSettingsSectionId: (sectionId: SettingsSectionId) =>
      setFlags("activeSettingsSectionId", sectionId),
    modalViewId: () => flags.modalViewId,
    setModalViewId: (viewId: string | null) => setFlags("modalViewId", viewId),
    fullscreenViewId: () => flags.fullscreenViewId,
    setFullscreenViewId: (viewId: string | null) => setFlags("fullscreenViewId", viewId),
    addWidgetOpen: () => flags.addWidgetOpen,
    setAddWidgetOpen: (open: boolean) => setFlags("addWidgetOpen", open),
    cmdPaletteOpen: () => flags.cmdPaletteOpen,
    setCmdPaletteOpen: (open: boolean) => setFlags("cmdPaletteOpen", open),
    modalProps,
    setModalProps,
    fullscreenProps,
    setFullscreenProps,
    ctxMenu,
    setCtxMenu,
    expandState,
    setExpandState,
    dragState,
    setDragState,
  }
}

export type WorkbenchOverlayStore = ReturnType<typeof createWorkbenchOverlayStore>
