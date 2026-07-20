import * as stylex from "@stylexjs/stylex"
import type { HostAdapter } from "@tabora/host-adapters"
import { createEffect, createMemo, onCleanup, Show } from "solid-js"
import type { PluginInstance, WorkbenchSearchSettings, Workspace } from "@tabora/plugin-api"
import { applyThemeTokens } from "@tabora/theme"
import { color, font } from "@tabora/theme/tokens.stylex"

import type { WorkbenchRuntimeBootstrap } from "../runtime/bootstrap"
import { applyBackgroundStyle } from "../appearance/backgroundResolver"
import { createLayoutFallbackTracker } from "../layout/layoutFallback"
import { createWorkbenchResponsiveState } from "../shared/responsive"
import { createWorkbenchShellHostRuntime } from "../runtime/WorkbenchShellHostRuntime"
import { activePluginStyles, createPluginStyleManager } from "../shared/pluginStyleManager"
import {
  createWorkbenchSettingsPanelPropsBuilder,
  openWorkbenchSettings,
} from "../surface/WorkbenchShellSettings"
import { WorkbenchShellProvider, type WorkbenchShell } from "./WorkbenchShellContext"
import { WorkbenchShellSurfaceHost } from "../surface/WorkbenchShellSurfaceHost"
import { createWorkbenchShellState } from "./WorkbenchShellState"
import { createWorkbenchWorkspaceController } from "../workspace/WorkbenchShellWorkspaceController"
import { assignGridOrder } from "../shared/workbenchGrid"
import { createWorkbenchShellRuntimes } from "./createWorkbenchShellRuntimes"
import { createWorkbenchShellPluginViewBoundaryCopy } from "../i18n"

export type WorkbenchShellAppProps = {
  composition: {
    host: HostAdapter
    initialState: {
      workspace: Workspace | null
      instances: PluginInstance[]
      searchSettings: WorkbenchSearchSettings
    }
  }
  runtime: WorkbenchRuntimeBootstrap
}

const styles = stylex.create({
  root: {
    backgroundColor: color.page,
    color: color.text,
    fontFamily: font.sans,
    minHeight: "100vh",
    WebkitFontSmoothing: "antialiased",
  },
  loading: {
    alignItems: "center",
    color: color.textMuted,
    display: "flex",
    fontSize: 14,
    height: "100vh",
    justifyContent: "center",
  },
})

export function WorkbenchShellApp(props: WorkbenchShellAppProps) {
  const composition = props.composition
  const runtime = props.runtime
  const state = createWorkbenchShellState({
    initialSearchSettings: composition.initialState.searchSettings,
    initialVisualState: {
      layoutId:
        composition.initialState.workspace?.activeLayoutId ??
        runtime.defaultWorkspacePreset.layoutId,
      themeId:
        composition.initialState.workspace?.activeThemeId ?? runtime.defaultWorkspacePreset.themeId,
      backgroundId:
        composition.initialState.workspace?.activeBackgroundProviderId ??
        runtime.defaultWorkspacePreset.backgroundProviderId,
    },
    darkThemeId: runtime.shellConfig.themeIds.dark,
  })
  const { kernelReady, setKernelReady, pluginRecords, setPluginRecords, showToast } = state.runtime
  const { workspaceState, setWorkspaceState, workspaceList, setWorkspaceList } = state.workspace
  const {
    activeLayoutId: _activeLayoutId,
    setActiveLayoutId,
    setThemeId,
    setBackgroundId,
    isDark,
  } = state.appearance
  const { instances, setInstances } = state.widgets
  // 仅保留 app 主体（controllers / effects / onKeyDown / openSettings / settings panel 装配）实际使用的
  // accessor/setter；纯供 surface 装配读取的 overlay 状态由 shell bundle 经 context 提供。
  const {
    setSettingsOpen,
    setActiveSettingsSectionId,
    setModalViewId,
    setModalProps,
    setFullscreenViewId,
    setFullscreenProps,
    expandState: _expandState,
    setExpandState,
    dragState: _dragState,
    setDragState: _setDragState,
    ctxMenu: _ctxMenu,
    setCtxMenu,
    setAddWidgetOpen,
    cmdPaletteOpen: _cmdPaletteOpen,
    setCmdPaletteOpen: _setCmdPaletteOpen,
  } = state.overlays
  const {
    searchSettings,
    setSearchSettings,
    searchHistory,
    setSearchHistory,
    inlineSearchQuery: _inlineSearchQuery,
    setInlineSearchQuery: _setInlineSearchQuery,
    inlineSearchOpen: _inlineSearchOpen,
    setInlineSearchOpen: _setInlineSearchOpen,
    inlineSearchActiveResultIndex: _inlineSearchActiveResultIndex,
    setInlineSearchActiveResultIndex: _setInlineSearchActiveResultIndex,
  } = state.search
  const responsive = createWorkbenchResponsiveState()
  const layoutFallback = createLayoutFallbackTracker({ notify: showToast })
  const { database, catalog: pluginCatalog, kernel, plugins, repositories } = runtime
  const { workspaceRepo, instanceRepo, pluginDataRepo, workspaceSnapshotRepo } = repositories
  const pluginStyleManager = createPluginStyleManager(document)
  const refreshPluginRecords = async () => {
    setPluginRecords(await repositories.pluginRecordRepo.getAll())
  }
  createEffect(() => {
    pluginStyleManager.apply(
      activePluginStyles({
        styles: runtime.pluginStyles,
        plugins,
        records: pluginRecords(),
      }),
    )
  })
  onCleanup(() => {
    pluginStyleManager.dispose()
  })
  createEffect(() => {
    if (_cmdPaletteOpen()) {
      _setInlineSearchOpen(false)
    }
  })
  const openSettings = (panelId?: string) =>
    openWorkbenchSettings(
      {
        panels: pluginCatalog.listSettingsPanels(),
        setActiveSettingsSectionId,
        setSettingsOpen,
      },
      panelId,
    )
  const workspaceController = createWorkbenchWorkspaceController({
    workspaceRepo,
    instanceRepo,
    pluginDataRepo,
    workspaceSnapshotRepo,
    database,
    kernel,
    pluginCatalog,
    getWorkspaceState: workspaceState,
    getInstances: instances,
    getSearchSettings: searchSettings,
    getSearchHistory: searchHistory,
    setWorkspaceState,
    setWorkspaceList,
    setActiveLayoutId,
    setSearchSettings,
    setSearchHistory,
    setInstances,
    setThemeId,
    setBackgroundId,
    applyTheme: (tokens) => applyThemeTokens(document.documentElement, tokens),
    applyBackground: applyBackgroundStyle,
    i18n: runtime.i18n,
    clearContextMenu: () => setCtxMenu(null),
    clearExpandState: () => setExpandState(null),
    defaultWorkspacePreset: runtime.defaultWorkspacePreset,
    shellConfig: runtime.shellConfig,
    assignGridOrder,
    syncPluginStyles: refreshPluginRecords,
  })
  const hostRuntime = createWorkbenchShellHostRuntime({
    runtime,
    hostPlatform: composition.host.platform,
    isDark,
    shellConfig: runtime.shellConfig,
    setAddWidgetOpen,
    openSettings,
    switchTheme: workspaceController.switchTheme,
    windowOpen: (url, target) => {
      window.open(url, target)
    },
    setPluginRecords,
    setKernelReady,
    setWorkspaceList,
    setWorkspaceState,
    setLocale: runtime.i18n.setLocale,
    setActiveLayoutId,
    setSearchSettings,
    setSearchHistory,
    setInstances,
    applyThemeSelection: workspaceController.applyThemeSelection,
    applyBackgroundSelection: workspaceController.applyBackgroundSelection,
    reconcileInstancesForLayout: workspaceController.reconcileInstancesForLayout,
    setModalViewId,
    setModalProps,
    setFullscreenViewId,
    setFullscreenProps,
    showToast,
  })
  onCleanup(hostRuntime.dispose)
  const authClient = runtime.authClient
  const syncManager = runtime.syncManager
  const buildSettingsPanelProps = createWorkbenchSettingsPanelPropsBuilder({
    getWorkspace: workspaceState,
    getWorkspaces: workspaceList,
    getLayouts: () => pluginCatalog.listLayouts(),
    getThemes: () => pluginCatalog.listThemes(),
    getBackgrounds: () => pluginCatalog.listBackgroundProviders(),
    getSearchProviders: () => pluginCatalog.listSearchProviders(),
    getSearchSettings: searchSettings,
    getPlugins: () => pluginCatalog.pluginSummaries(pluginRecords()),
    getLocale: () => runtime.i18n.locale(),
    getAvailableLocales: () => [
      { value: "zh-CN", label: "中文（简体）" },
      { value: "en-US", label: "English (US)" },
    ],
    host: {
      close: () => setSettingsOpen(false),
      setDirty: () => {},
      switchLayout: workspaceController.switchLayout,
      switchTheme: workspaceController.switchTheme,
      switchBackground: workspaceController.switchBackground,
      switchLocale: workspaceController.switchLocale,
      setDefaultSearchProvider: workspaceController.setDefaultSearchProvider,
      setSearchProviderEnabled: workspaceController.setSearchProviderEnabled,
      togglePluginEnabled: workspaceController.togglePluginEnabled,
      exportWorkspace: workspaceController.exportWorkspace,
      importWorkspace: workspaceController.importWorkspace,
      createWorkspace: async (name) => {
        const ws = await workspaceController.createWorkspace(name)
        await workspaceController.switchWorkspace(ws.id)
      },
      switchWorkspace: workspaceController.switchWorkspace,
      deleteWorkspace: workspaceController.deleteWorkspace,
      ...(authClient
        ? {
            auth: {
              getSession: async () => {
                const s = await authClient.getSession()
                if (!s) return null
                const result: { userId?: string; sessionId: string } = { sessionId: s.sessionId }
                if (s.userId !== undefined) result.userId = s.userId
                return result
              },
              getCurrentUser: async () => {
                const u = await authClient.getCurrentUser()
                if (!u) return null
                const result: { id: string; email?: string } = { id: u.id }
                if (u.email !== undefined) result.email = u.email
                return result
              },
              login: async (email: string, password: string) => {
                await authClient.login(email, password)
              },
              register: (email: string, password: string) => authClient.register(email, password),
              logout: () => authClient.logout(),
              requestPasswordReset: (email: string) => authClient.requestPasswordReset(email),
              resetPassword: (code: string, password: string) =>
                authClient.resetPassword(code, password),
            },
          }
        : {}),
      ...(syncManager
        ? {
            sync: {
              triggerSync: async () => {
                await syncManager.triggerSync()
                await runtime.repositories.syncMetaRepo.set("lastSyncAt", new Date().toISOString())
              },
              getLastSyncAt: async () =>
                (await runtime.repositories.syncMetaRepo.get("lastSyncAt")) ?? null,
            },
          }
        : {}),
    },
  })

  const { controllerRuntime, layoutRuntime } = createWorkbenchShellRuntimes({
    state,
    runtime,
    workspaceController,
    hostRuntime,
    layoutFallback,
    responsive,
    openSettings,
    showToast,
  })

  void hostRuntime.initialize()

  const layoutContent = createMemo(() => {
    kernelReady()
    return layoutRuntime.renderActiveLayout()
  })

  const shell: WorkbenchShell = {
    state,
    catalog: pluginCatalog,
    views: kernel.registry.views,
    controllerRuntime,
    buildSettingsPanelProps,
    layoutContent,
    tShell: (key, vars) => runtime.i18n.t("tabora.shell", key, vars),
    shellCopy: {
      pluginViewBoundaryCopy: createWorkbenchShellPluginViewBoundaryCopy((key, vars) =>
        runtime.i18n.t("tabora.shell", key, vars),
      ),
    },
  }

  const handleWorkbenchKeydown = (event: KeyboardEvent) => {
    if (event.defaultPrevented) return

    if (controllerRuntime.shortcutRegistry().executeKeydown(event)) {
      event.preventDefault()
      return
    }

    if (event.key === "Escape") {
      controllerRuntime.widgetController.closeExpand()
      setCtxMenu(null)
      setAddWidgetOpen(false)
    }
  }

  window.addEventListener("keydown", handleWorkbenchKeydown)
  onCleanup(() => {
    window.removeEventListener("keydown", handleWorkbenchKeydown)
  })

  return (
    <WorkbenchShellProvider shell={shell}>
      <div
        {...stylex.props(styles.root)}
        data-workbench-shell-root
        onKeyDown={handleWorkbenchKeydown}
        tabIndex={-1}
      >
        <Show
          when={kernelReady()}
          fallback={
            <div {...stylex.props(styles.loading)} data-workbench-loading>
              Loading Tabora...
            </div>
          }
        >
          <WorkbenchShellSurfaceHost />
        </Show>
      </div>
    </WorkbenchShellProvider>
  )
}
