import type {
  PluginInstance,
  SearchHistoryEntry,
  WorkbenchSearchSettings,
  Workspace,
} from "@tabora/plugin-api"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  hydrateWorkbenchSessionState: vi.fn(),
  createWorkspaceSession: vi.fn(),
  deleteWorkspaceSession: vi.fn(),
  ensureWorkspaceSession: vi.fn(),
  readSearchSettings: vi.fn(),
  updateWorkspaceRecord: vi.fn(),
  exportWorkspaceData: vi.fn(),
  importWorkspaceData: vi.fn(),
}))

vi.mock("./WorkbenchShellSessionState", () => ({
  hydrateWorkbenchSessionState: mocks.hydrateWorkbenchSessionState,
}))

vi.mock("./workspaceSession", () => ({
  createWorkspaceSession: mocks.createWorkspaceSession,
  deleteWorkspaceSession: mocks.deleteWorkspaceSession,
  ensureWorkspaceSession: mocks.ensureWorkspaceSession,
  readSearchSettings: mocks.readSearchSettings,
  updateWorkspaceRecord: mocks.updateWorkspaceRecord,
}))

vi.mock("./workspaceTransfer", () => ({
  exportWorkspaceData: mocks.exportWorkspaceData,
  importWorkspaceData: mocks.importWorkspaceData,
}))

import { createWorkbenchWorkspaceState } from "./WorkbenchShellWorkspaceState"

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

function searchSettings(): WorkbenchSearchSettings {
  return {
    defaultProviderId: "official.search.google",
    enabledProviderIds: ["official.search.google"],
  }
}

describe("createWorkbenchWorkspaceState", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.readSearchSettings.mockReturnValue(searchSettings())
  })

  it("hydrates imported workspace state and reconciles imported instances", async () => {
    const importedWorkspace = workspace({
      id: "workspace-imported",
      activeThemeId: "official.theme.dark",
      activeBackgroundProviderId: "official.background.sunset",
    })
    const importedInstances = [instance({ workspaceId: importedWorkspace.id })]
    const reconciledInstances = [
      instance({ id: "widget-reconciled", workspaceId: importedWorkspace.id }),
    ]
    mocks.importWorkspaceData.mockResolvedValue({
      workspace: importedWorkspace,
      instances: importedInstances,
      warnings: ["renamed"],
    })

    let workspaceList = [workspace()]
    const setWorkspaceState = vi.fn()
    const setWorkspaceList = vi.fn((updater: (prev: Workspace[]) => Workspace[]) => {
      workspaceList = updater(workspaceList)
    })
    const setActiveLayoutId = vi.fn()
    const setSearchSettings = vi.fn()
    const setSearchHistory = vi.fn()
    const setInstances = vi.fn()
    const applyThemeSelection = vi.fn()
    const applyBackgroundSelection = vi.fn()
    const clearContextMenu = vi.fn()
    const clearExpandState = vi.fn()
    const reconcileInstancesForLayout = vi.fn(async () => ({ instances: reconciledInstances }))

    const actions = createWorkbenchWorkspaceState({
      workspaceRepo: { get: vi.fn() } as any,
      instanceRepo: {} as any,
      pluginDataRepo: {} as any,
      database: {} as any,
      availablePluginIds: () => ["plugin.widgets"],
      getWorkspaceState: () => workspace(),
      setWorkspaceState,
      setWorkspaceList,
      setActiveLayoutId,
      setSearchSettings,
      setSearchHistory,
      setInstances,
      applyThemeSelection,
      applyBackgroundSelection,
      reconcileInstancesForLayout,
      clearContextMenu,
      clearExpandState,
    })

    const result = await actions.importWorkspace('{"workspace":{}}')

    expect(mocks.importWorkspaceData).toHaveBeenCalledWith(
      expect.objectContaining({
        json: '{"workspace":{}}',
        availablePluginIds: ["plugin.widgets"],
      }),
    )
    expect(clearContextMenu).toHaveBeenCalled()
    expect(clearExpandState).toHaveBeenCalled()
    expect(setWorkspaceState).toHaveBeenCalledWith(importedWorkspace)
    expect(reconcileInstancesForLayout).toHaveBeenCalledWith(
      importedWorkspace.activeLayoutId,
      importedInstances,
    )
    expect(setInstances).toHaveBeenCalledWith(reconciledInstances)
    expect(setActiveLayoutId).toHaveBeenCalledWith(importedWorkspace.activeLayoutId)
    expect(applyThemeSelection).toHaveBeenCalledWith(importedWorkspace.activeThemeId)
    expect(applyBackgroundSelection).toHaveBeenCalledWith(
      importedWorkspace.activeBackgroundProviderId,
    )
    expect(setSearchSettings).toHaveBeenCalledWith(searchSettings())
    expect(workspaceList).toEqual([workspace(), importedWorkspace])
    expect(result).toEqual({ warnings: ["renamed"] })
  })

  it("skips switching when the requested workspace is already active", async () => {
    const currentWorkspace = workspace()
    const actions = createWorkbenchWorkspaceState({
      workspaceRepo: { get: vi.fn() } as any,
      instanceRepo: {} as any,
      pluginDataRepo: {} as any,
      database: {} as any,
      availablePluginIds: () => [],
      getWorkspaceState: () => currentWorkspace,
      setWorkspaceState: vi.fn(),
      setWorkspaceList: vi.fn(),
      setActiveLayoutId: vi.fn(),
      setSearchSettings: vi.fn(),
      setSearchHistory: vi.fn(),
      setInstances: vi.fn(),
      applyThemeSelection: vi.fn(),
      applyBackgroundSelection: vi.fn(),
      reconcileInstancesForLayout: vi.fn(async () => ({ instances: [] })),
      clearContextMenu: vi.fn(),
      clearExpandState: vi.fn(),
    })

    await actions.switchWorkspace(currentWorkspace.id)

    expect(mocks.ensureWorkspaceSession).not.toHaveBeenCalled()
    expect(mocks.hydrateWorkbenchSessionState).not.toHaveBeenCalled()
  })

  it("falls back to the default workspace after deleting the active workspace", async () => {
    const currentWorkspace = workspace()
    const defaultWorkspace = workspace({ id: "default", name: "Default" })
    const defaultSession = {
      workspace: defaultWorkspace,
      instances: [instance({ workspaceId: defaultWorkspace.id })],
      searchHistory: [] as SearchHistoryEntry[],
      searchSettings: searchSettings(),
      activeLayoutId: defaultWorkspace.activeLayoutId,
      activeThemeId: defaultWorkspace.activeThemeId,
      activeBackgroundId: defaultWorkspace.activeBackgroundProviderId,
    }
    mocks.ensureWorkspaceSession.mockResolvedValue(defaultSession)

    let workspaceList = [currentWorkspace, defaultWorkspace]
    const workspaceRepo = {
      get: vi.fn(async (id: string) => (id === "default" ? defaultWorkspace : null)),
    }
    const setWorkspaceList = vi.fn((updater: (prev: Workspace[]) => Workspace[]) => {
      workspaceList = updater(workspaceList)
    })

    const actions = createWorkbenchWorkspaceState({
      workspaceRepo: workspaceRepo as any,
      instanceRepo: {} as any,
      pluginDataRepo: {} as any,
      database: {} as any,
      availablePluginIds: () => [],
      getWorkspaceState: () => currentWorkspace,
      setWorkspaceState: vi.fn(),
      setWorkspaceList,
      setActiveLayoutId: vi.fn(),
      setSearchSettings: vi.fn(),
      setSearchHistory: vi.fn(),
      setInstances: vi.fn(),
      applyThemeSelection: vi.fn(),
      applyBackgroundSelection: vi.fn(),
      reconcileInstancesForLayout: vi.fn(async () => ({ instances: [] })),
      clearContextMenu: vi.fn(),
      clearExpandState: vi.fn(),
    })

    await actions.deleteWorkspace(currentWorkspace.id)

    expect(mocks.deleteWorkspaceSession).toHaveBeenCalledWith(
      expect.objectContaining({ workspaceId: currentWorkspace.id }),
    )
    expect(workspaceList).toEqual([defaultWorkspace])
    expect(workspaceRepo.get).toHaveBeenCalledWith("default")
    expect(mocks.ensureWorkspaceSession).toHaveBeenCalledWith(
      expect.objectContaining({ workspaceId: "default" }),
    )
    expect(mocks.hydrateWorkbenchSessionState).toHaveBeenCalledWith(
      expect.objectContaining({ session: defaultSession }),
    )
  })
})
