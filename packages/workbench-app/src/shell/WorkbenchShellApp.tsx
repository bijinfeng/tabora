import * as stylex from "@stylexjs/stylex"
import { Route, Router, useLocation, useNavigate } from "@solidjs/router"
import type { HostAdapter } from "@tabora/host-adapters"
import { createEffect, createMemo, createSignal, onCleanup, Show, type JSX } from "solid-js"
import type {
  BackgroundRendererViewProps,
  PluginInstance,
  PluginPermission,
  SettingsSectionId,
  WorkbenchSearchSettings,
  Workspace,
} from "@tabora/plugin-api"
import { applyThemeTokens } from "@tabora/theme"
import { color, font } from "@tabora/theme/tokens.stylex"
import { PermissionRequestDialog } from "@tabora/workbench-shell"

import type { WorkbenchRuntimeBootstrap } from "../runtime/bootstrap"
import {
  applyBackgroundStyle,
  resolveBackgroundStyle,
  resolveBackgroundValue,
} from "../appearance/backgroundResolver"
import { createLayoutErrorTracker } from "../layout/layoutError"
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
import {
  parseWorkbenchSettingsRoute,
  settingsHomePath,
  settingsRoutePath,
} from "../routing/workbenchSettingsRoute"

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
  return (
    <Router root={() => <WorkbenchShellAppRouteRoot {...props} />}>
      <Route path="*path" component={() => null} />
    </Router>
  )
}

function WorkbenchShellAppRouteRoot(props: WorkbenchShellAppProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const composition = props.composition
  const runtime = props.runtime
  const state = createWorkbenchShellState({
    initialSearchSettings: composition.initialState.searchSettings,
    initialVisualState: {
      layoutId:
        composition.initialState.workspace?.activeLayout.id ??
        runtime.defaultWorkspacePreset.layout.id,
      themeId:
        composition.initialState.workspace?.activeTheme.id ??
        runtime.defaultWorkspacePreset.theme.id,
      backgroundId:
        composition.initialState.workspace?.activeBackgroundProvider.id ??
        runtime.defaultWorkspacePreset.backgroundProvider.id,
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
  const layoutError = createLayoutErrorTracker()
  const { database, catalog: pluginCatalog, kernel, repositories } = runtime
  const { workspaceRepo, instanceRepo, pluginDataRepo } = repositories

  // Permission request state
  type PermissionRequestState = {
    pluginId: string
    permission: PluginPermission
    reason?: string
    resolve: (granted: boolean) => void
  }
  const [permissionRequest, setPermissionRequest] = createSignal<PermissionRequestState | null>(
    null,
  )

  const currentRoute = createMemo(() => parseWorkbenchSettingsRoute(location.pathname))
  const navigateToSettings = (sectionId: SettingsSectionId) => {
    setActiveSettingsSectionId(sectionId)
    setSettingsOpen(true)
    const nextPath = settingsRoutePath(sectionId)
    if (location.pathname !== nextPath) navigate(nextPath)
  }
  const navigateToSettingsHome = () => {
    setSettingsOpen(true)
    const nextPath = settingsHomePath()
    if (location.pathname !== nextPath) navigate(nextPath)
  }
  const closeSettings = () => {
    setSettingsOpen(false)
    if (currentRoute().kind === "settings") navigate("/", { replace: true })
  }
  createEffect(() => {
    const route = currentRoute()
    if (route.kind !== "settings") {
      if (state.overlays.settingsOpen()) setSettingsOpen(false)
      return
    }

    if (route.section !== null) setActiveSettingsSectionId(route.section)
    setSettingsOpen(true)
  })
  const pluginStyleManager = createPluginStyleManager(document)
  const refreshPluginRecords = async () => {
    setPluginRecords(await repositories.pluginRecordRepo.getAll())
  }
  createEffect(() => {
    pluginStyleManager.apply(
      activePluginStyles({
        styles: runtime.pluginStyles,
        plugins: kernel.plugins,
        records: pluginRecords(),
      }),
    )
  })
  onCleanup(() => {
    pluginStyleManager.dispose()
  })

  // Listen for permission requests
  createEffect(() => {
    const dispose = kernel.events.on("permission.request", (payload) => {
      const request = payload as {
        pluginId: string
        permission: PluginPermission
        reason?: string
        resolve: (granted: boolean) => void
      }
      setPermissionRequest({
        pluginId: request.pluginId,
        permission: request.permission,
        resolve: request.resolve,
        ...(request.reason !== undefined ? { reason: request.reason } : {}),
      })
    })
    onCleanup(dispose)
  })

  // Handle permission response
  const handlePermissionResponse = async (granted: boolean, remember: boolean) => {
    const request = permissionRequest()
    if (!request) return

    if (granted && remember) {
      try {
        await kernel.grantPermission(request.pluginId, request.permission)
        await refreshPluginRecords()
      } catch (error) {
        console.error("Failed to grant permission:", error)
        showToast("授予权限失败", { type: "error" })
      }
    }

    request.resolve(granted)
    setPermissionRequest(null)
  }

  createEffect(() => {
    if (_cmdPaletteOpen()) {
      _setInlineSearchOpen(false)
    }
  })
  const openSettings = (panelId?: string) => {
    if (responsive.isMobile() && !panelId) {
      navigateToSettingsHome()
      return
    }
    const sectionId = openWorkbenchSettings(
      {
        panels: pluginCatalog.listSettingsPanels(),
        surface: responsive.isMobile() ? "mobile" : "desktop",
        setActiveSettingsSectionId,
        setSettingsOpen,
      },
      panelId,
    )
    navigateToSettings(sectionId)
  }
  const workspaceController = createWorkbenchWorkspaceController({
    workspaceRepo,
    instanceRepo,
    pluginDataRepo,
    ...(database ? { database } : {}),
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
    switchTheme: async (themeId) => {
      const theme = pluginCatalog.listThemes().find((candidate) => candidate.id === themeId)
      if (theme) await workspaceController.switchTheme(theme.ref)
    },
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
    setModalViewId,
    setModalProps,
    setFullscreenViewId,
    setFullscreenProps,
    showToast,
  })
  onCleanup(hostRuntime.dispose)
  const buildSettingsPanelProps = createWorkbenchSettingsPanelPropsBuilder({
    getWorkspace: workspaceState,
    getWorkspaces: workspaceList,
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
      close: closeSettings,
      setDirty: () => {},
      switchTheme: workspaceController.switchTheme,
      switchBackground: workspaceController.switchBackground,
      switchLocale: workspaceController.switchLocale,
      setDefaultSearchProvider: workspaceController.setDefaultSearchProvider,
      setSearchProviderEnabled: workspaceController.setSearchProviderEnabled,
      togglePluginEnabled: workspaceController.togglePluginEnabled,
      ...(database
        ? {
            exportWorkspace: workspaceController.exportWorkspace,
            importWorkspace: workspaceController.importWorkspace,
          }
        : {}),
      createWorkspace: async (name) => {
        const ws = await workspaceController.createWorkspace(name)
        await workspaceController.switchWorkspace(ws.id)
      },
      switchWorkspace: workspaceController.switchWorkspace,
      deleteWorkspace: workspaceController.deleteWorkspace,
    },
  })

  const { controllerRuntime, layoutRuntime } = createWorkbenchShellRuntimes({
    state,
    runtime,
    workspaceController,
    hostRuntime,
    layoutError,
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
    settingsProviders: kernel.registry.settings,
    settingsProviderContext: (surface) => ({ locale: runtime.i18n.locale(), surface }),
    settingsRoute: {
      navigate: navigateToSettings,
      home: navigateToSettingsHome,
      isHome: () => {
        const route = currentRoute()
        return route.kind === "settings" && route.section === null
      },
      close: closeSettings,
    },
    responsive,
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
        {...stylex.attrs(styles.root)}
        data-workbench-shell-root
        onKeyDown={handleWorkbenchKeydown}
        tabIndex={-1}
      >
        <Show
          when={kernelReady()}
          fallback={
            <div {...stylex.attrs(styles.loading)} data-workbench-loading>
              Loading Tabora...
            </div>
          }
        >
          <Show when={shell.state.workspace.workspaceState()?.activeBackgroundRenderer}>
            {(rendererRef) => {
              const workspace = shell.state.workspace.workspaceState()
              if (!workspace) return null

              const backgrounds = pluginCatalog.listBackgroundProviders()
              const value = resolveBackgroundValue(
                workspace.activeBackgroundProvider.id,
                backgrounds,
              )
              const fallbackStyle = resolveBackgroundStyle(
                workspace.activeBackgroundProvider.id,
                backgrounds,
              )

              const viewId = rendererRef().pluginId + "." + rendererRef().id
              const Component = kernel.registry.views.get(viewId) as unknown as (
                props: BackgroundRendererViewProps,
              ) => JSX.Element
              if (!Component) return null

              return (
                <Component
                  providerId={workspace.activeBackgroundProvider.id}
                  providerTitle={
                    backgrounds.find((bg) => bg.id === workspace.activeBackgroundProvider.id)
                      ?.title ?? "Unknown"
                  }
                  sourceType={
                    backgrounds.find((bg) => bg.id === workspace.activeBackgroundProvider.id)
                      ?.sourceType ?? "generated"
                  }
                  resolvedValue={value}
                  fallbackStyle={fallbackStyle}
                />
              )
            }}
          </Show>
          <WorkbenchShellSurfaceHost />
          <Show when={permissionRequest()}>
            {(request) => {
              const plugin = kernel.plugins.find((p) => p.manifest.id === request().pluginId)
              const props = {
                pluginId: request().pluginId,
                pluginName: plugin?.manifest.name ?? request().pluginId,
                permission: request().permission,
                onResponse: handlePermissionResponse,
                onClose: () => {
                  request().resolve(false)
                  setPermissionRequest(null)
                },
                ...(request().reason ? { reason: request().reason } : {}),
              }
              return <PermissionRequestDialog {...props} />
            }}
          </Show>
        </Show>
      </div>
    </WorkbenchShellProvider>
  )
}
