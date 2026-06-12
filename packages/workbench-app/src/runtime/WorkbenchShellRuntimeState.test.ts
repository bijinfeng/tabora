import type {
  PluginInstance,
  PluginRecord,
  Workspace,
  WorkspacePresetContribution,
} from "@tabora/plugin-api"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  ensureWorkspaceSession: vi.fn(),
  hydrateWorkbenchSessionState: vi.fn(),
}))

vi.mock("../workspace/workspaceSession", () => ({
  ensureWorkspaceSession: mocks.ensureWorkspaceSession,
}))

vi.mock("../workspace/WorkbenchShellSessionState", () => ({
  hydrateWorkbenchSessionState: mocks.hydrateWorkbenchSessionState,
}))

import {
  initializeWorkbenchShellRuntime,
  wireWorkbenchRuntimeEvents,
} from "./WorkbenchShellRuntimeState"
import { createWorkbenchI18nStore } from "../i18n"

type RuntimeBootstrap = Parameters<typeof initializeWorkbenchShellRuntime>[0]["runtime"]

function workspace(overrides: Partial<Workspace> = {}): Workspace {
  return {
    id: "workspace-1",
    name: "Main",
    activeLayoutId: "official.layout.workbench-dashboard",
    activeThemeId: "official.theme.light",
    activeBackgroundProviderId: "official.background.default",
    config: {},
    regions: {},
    createdAt: "2026-06-07T00:00:00.000Z",
    updatedAt: "2026-06-07T00:00:00.000Z",
    ...overrides,
  }
}

function instance(overrides: Partial<PluginInstance> = {}): PluginInstance {
  return {
    id: "widget-1",
    workspaceId: "workspace-1",
    pluginId: "plugin.widgets",
    contributionId: "widget.notes",
    extensionPoint: "widget",
    regionId: "mainGrid",
    enabled: true,
    size: "M",
    config: {},
    createdAt: "2026-06-07T00:00:00.000Z",
    updatedAt: "2026-06-07T00:00:00.000Z",
    ...overrides,
  }
}

function createRuntime(records: PluginRecord[] = []) {
  const defaultWorkspacePreset: WorkspacePresetContribution = {
    id: "preset.default",
    title: "Default Workspace",
    plugins: ["plugin.widgets"],
    layoutId: "official.layout.workbench-dashboard",
    themeId: "official.theme.light",
    backgroundProviderId: "official.background.default",
    search: {
      defaultProviderId: "official.search.google",
      enabledProviderIds: ["official.search.google"],
    },
    regions: [{ regionId: "mainGrid", accepts: ["widget"] }],
    instances: [],
  }
  const shellConfig = {
    themeIds: {
      light: "theme.light.custom",
      dark: "theme.dark.custom",
    },
    layoutIds: {
      dashboard: "layout.dashboard.custom",
      focus: "layout.focus.custom",
    },
    settingsPanelIds: {
      appearance: "settings.appearance.custom",
    },
    searchHistory: {
      pluginId: "search.plugin.custom",
      key: "search-history-custom",
    },
  }
  const handlers = new Map<string, Set<(payload: unknown) => void>>()
  const events: RuntimeBootstrap["kernel"]["events"] = {
    on: vi.fn((eventName: string, handler: (payload: unknown) => void) => {
      const eventHandlers = handlers.get(eventName) ?? new Set<(payload: unknown) => void>()
      eventHandlers.add(handler)
      handlers.set(eventName, eventHandlers)
      return () => {
        eventHandlers.delete(handler)
      }
    }),
    emit: vi.fn((eventName: string, payload: unknown) => {
      for (const handler of handlers.get(eventName) ?? []) {
        handler(payload)
      }
    }),
  }

  const discover = vi.fn(async () => {})
  const activateEnabledPlugins = vi.fn(async () => {})

  const runtime: RuntimeBootstrap = {
    kernel: {
      registry: {} as unknown as RuntimeBootstrap["kernel"]["registry"],
      plugins: [],
      discover,
      activateEnabledPlugins,
      setPluginEnabled: vi.fn(async () => {}),
      events,
    },
    defaultWorkspacePreset,
    shellConfig,
    plugins: [],
    i18n: createWorkbenchI18nStore({ initialLocale: "zh-CN", fallbackLocale: "zh-CN" }),
    repositories: {
      workspaceRepo: {
        get: vi.fn(async () => undefined),
        getAll: vi.fn(async () => [workspace()]),
        save: vi.fn(async () => {}),
        remove: vi.fn(async () => {}),
      },
      instanceRepo: {
        getAll: vi.fn(async () => []),
        getByWorkspace: vi.fn(async () => []),
        getByRegion: vi.fn(async () => []),
        get: vi.fn(async () => undefined),
        save: vi.fn(async () => {}),
        removeByWorkspace: vi.fn(async () => {}),
        remove: vi.fn(async () => {}),
      },
      pluginDataRepo: {
        get: vi.fn(async () => undefined),
        getAll: vi.fn(async () => []),
        save: vi.fn(async () => {}),
        remove: vi.fn(async () => {}),
        getByWorkspace: vi.fn(async () => undefined),
        getAllByWorkspace: vi.fn(async () => []),
        saveForWorkspace: vi.fn(async () => {}),
        removeForWorkspace: vi.fn(async () => {}),
        removeByWorkspace: vi.fn(async () => {}),
        getByInstance: vi.fn(async () => undefined),
        getAllByInstance: vi.fn(async () => []),
        saveForInstance: vi.fn(async () => {}),
        removeForInstance: vi.fn(async () => {}),
      },
      pluginRecordRepo: {
        get: vi.fn(async () => undefined),
        getAll: vi.fn(async () => records),
        save: vi.fn(async () => {}),
        remove: vi.fn(async () => {}),
      },
      workspaceSnapshotRepo: {
        save: vi.fn(async () => {}),
        getLast: vi.fn(async () => undefined),
      },
    },
  }

  return {
    runtime,
    defaultWorkspacePreset,
    shellConfig,
    discover,
    activateEnabledPlugins,
    emit: (eventName: string, payload: unknown) => {
      events.emit(eventName, payload)
    },
  }
}

describe("initializeWorkbenchShellRuntime", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("discovers plugins, hydrates the session, and marks the kernel ready", async () => {
    const pluginRecords: PluginRecord[] = [
      {
        id: "plugin.widgets",
        version: "1.0.0",
        enabled: true,
        status: "active",
        source: "builtin",
        installedAt: "2026-06-07T00:00:00.000Z",
        updatedAt: "2026-06-07T00:00:00.000Z",
        manifest: {
          id: "plugin.widgets",
          name: "Widgets",
          version: "1.0.0",
          apiVersion: "1.0.0",
          entry: "./index.ts",
          engine: { platform: "^0.1.0" },
          contributes: {},
        },
        grantedPermissions: [],
      },
    ]
    const session = {
      workspace: workspace(),
      instances: [instance()],
      searchHistory: [],
      searchSettings: {
        defaultProviderId: "official.search.google",
        enabledProviderIds: ["official.search.google"],
      },
      activeLayoutId: "official.layout.workbench-dashboard",
      activeThemeId: "official.theme.light",
      activeBackgroundId: "official.background.default",
    }
    const { runtime, defaultWorkspacePreset, shellConfig, discover, activateEnabledPlugins } =
      createRuntime(pluginRecords)
    mocks.ensureWorkspaceSession.mockResolvedValue(session)

    const setPluginRecords = vi.fn()
    const setKernelReady = vi.fn()
    const setWorkspaceList = vi.fn()
    const setWorkspaceState = vi.fn()
    const setLocale = vi.fn()
    const setActiveLayoutId = vi.fn()
    const setSearchSettings = vi.fn()
    const setSearchHistory = vi.fn()
    const setInstances = vi.fn()
    const applyThemeSelection = vi.fn()
    const applyBackgroundSelection = vi.fn()
    const reconcileInstancesForLayout = vi.fn(async () => ({ instances: [] }))

    await initializeWorkbenchShellRuntime({
      runtime,
      setPluginRecords,
      setKernelReady,
      setWorkspaceList,
      setWorkspaceState,
      setLocale,
      setActiveLayoutId,
      setSearchSettings,
      setSearchHistory,
      setInstances,
      applyThemeSelection,
      applyBackgroundSelection,
      reconcileInstancesForLayout,
    })

    expect(discover).toHaveBeenCalledWith(runtime.plugins)
    expect(activateEnabledPlugins).toHaveBeenCalled()
    expect(setPluginRecords).toHaveBeenCalledWith(pluginRecords)
    expect(mocks.ensureWorkspaceSession).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultWorkspacePreset,
        searchHistoryStorage: shellConfig.searchHistory,
        workspaceRepo: runtime.repositories.workspaceRepo,
        instanceRepo: runtime.repositories.instanceRepo,
        pluginDataRepo: runtime.repositories.pluginDataRepo,
      }),
    )
    expect(mocks.hydrateWorkbenchSessionState).toHaveBeenCalledWith(
      expect.objectContaining({
        session,
        setWorkspaceState,
        setLocale,
        setActiveLayoutId,
        setSearchSettings,
        setSearchHistory,
        setInstances,
        applyThemeSelection,
        applyBackgroundSelection,
        reconcileInstancesForLayout,
      }),
    )
    expect(setWorkspaceList).toHaveBeenCalledWith([workspace()])
    expect(setKernelReady).toHaveBeenCalledWith(true)
  })
})

describe("wireWorkbenchRuntimeEvents", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("routes kernel UI events into shell state setters and cleanup detaches them", () => {
    const { runtime, emit } = createRuntime()
    const setModalViewId = vi.fn()
    const setModalProps = vi.fn()
    const setFullscreenViewId = vi.fn()
    const setFullscreenProps = vi.fn()
    const showToast = vi.fn()
    const openExternal = vi.fn()

    const dispose = wireWorkbenchRuntimeEvents({
      runtime,
      setModalViewId,
      setModalProps,
      setFullscreenViewId,
      setFullscreenProps,
      showToast,
      openExternal,
    })

    emit("ui.modal.open", { viewId: "modal.view", props: { tab: "a" } })
    emit("ui.modal.close", null)
    emit("ui.fullscreen.open", { viewId: "fullscreen.view", props: { page: 2 } })
    emit("ui.fullscreen.close", null)
    emit("ui.toast.show", { message: "saved", options: { type: "success" } })
    emit("host.external.open", { url: "https://example.com" })

    expect(setModalViewId).toHaveBeenNthCalledWith(1, "modal.view")
    expect(setModalProps).toHaveBeenCalledWith({ tab: "a" })
    expect(setModalViewId).toHaveBeenNthCalledWith(2, null)
    expect(setFullscreenViewId).toHaveBeenNthCalledWith(1, "fullscreen.view")
    expect(setFullscreenProps).toHaveBeenCalledWith({ page: 2 })
    expect(setFullscreenViewId).toHaveBeenNthCalledWith(2, null)
    expect(showToast).toHaveBeenCalledWith("saved", { type: "success" })
    expect(openExternal).toHaveBeenCalledWith("https://example.com")

    dispose()
    emit("ui.toast.show", { message: "after-dispose" })

    expect(showToast).toHaveBeenCalledTimes(1)
  })
})
