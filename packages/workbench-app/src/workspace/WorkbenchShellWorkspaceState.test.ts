import type {
  PluginInstance,
  SearchHistoryEntry,
  WorkbenchSearchSettings,
  Workspace,
  WorkspacePresetContribution,
} from "@tabora/plugin-api"
import type {
  InstanceRepository,
  PluginDataRepository,
  TaboraDatabase,
  WorkspaceRepository,
} from "@tabora/storage"
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

const databaseStub = {} as unknown as TaboraDatabase

function createWorkspaceRepo(overrides: Partial<WorkspaceRepository> = {}): WorkspaceRepository {
  return {
    get: overrides.get ?? vi.fn(async () => undefined),
    getAll: overrides.getAll ?? vi.fn(async () => []),
    save: overrides.save ?? vi.fn(async () => {}),
    remove: overrides.remove ?? vi.fn(async () => {}),
  }
}

function createInstanceRepo(overrides: Partial<InstanceRepository> = {}): InstanceRepository {
  return {
    getAll: overrides.getAll ?? vi.fn(async () => []),
    getByWorkspace: overrides.getByWorkspace ?? vi.fn(async () => []),
    getByRegion: overrides.getByRegion ?? vi.fn(async () => []),
    get: overrides.get ?? vi.fn(async () => undefined),
    save: overrides.save ?? vi.fn(async () => {}),
    removeByWorkspace: overrides.removeByWorkspace ?? vi.fn(async () => {}),
    remove: overrides.remove ?? vi.fn(async () => {}),
  }
}

function createPluginDataRepo(overrides: Partial<PluginDataRepository> = {}): PluginDataRepository {
  return {
    get: overrides.get ?? vi.fn(async () => undefined),
    getAll: overrides.getAll ?? vi.fn(async () => []),
    save: overrides.save ?? vi.fn(async () => {}),
    remove: overrides.remove ?? vi.fn(async () => {}),
    getByWorkspace: overrides.getByWorkspace ?? vi.fn(async () => undefined),
    getAllByWorkspace: overrides.getAllByWorkspace ?? vi.fn(async () => []),
    saveForWorkspace: overrides.saveForWorkspace ?? vi.fn(async () => {}),
    removeForWorkspace: overrides.removeForWorkspace ?? vi.fn(async () => {}),
    removeByWorkspace: overrides.removeByWorkspace ?? vi.fn(async () => {}),
    getByInstance: overrides.getByInstance ?? vi.fn(async () => undefined),
    getAllByInstance: overrides.getAllByInstance ?? vi.fn(async () => []),
    saveForInstance: overrides.saveForInstance ?? vi.fn(async () => {}),
    removeForInstance: overrides.removeForInstance ?? vi.fn(async () => {}),
  }
}

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

function defaultWorkspacePreset(): WorkspacePresetContribution {
  return {
    id: "preset.default",
    title: "Default Workspace",
    plugins: ["plugin.widgets"],
    layoutId: "official.layout.workbench-dashboard",
    themeId: "official.theme.light",
    backgroundProviderId: "official.background.default",
    search: searchSettings(),
    regions: [{ regionId: "mainGrid", accepts: ["widget"] }],
    instances: [],
  }
}

function searchHistoryStorage() {
  return {
    pluginId: "search.plugin.custom",
    key: "search-history-custom",
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
    const preset = defaultWorkspacePreset()
    const storage = searchHistoryStorage()
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
      workspaceRepo: createWorkspaceRepo({ get: vi.fn(async () => undefined) }),
      instanceRepo: createInstanceRepo(),
      pluginDataRepo: createPluginDataRepo(),
      database: databaseStub,
      availablePluginIds: () => ["plugin.widgets"],
      getWorkspaceState: () => workspace(),
      setWorkspaceState,
      setWorkspaceList,
      setLocale: vi.fn(),
      setActiveLayoutId,
      setSearchSettings,
      setSearchHistory,
      setInstances,
      applyThemeSelection,
      applyBackgroundSelection,
      reconcileInstancesForLayout,
      clearContextMenu,
      clearExpandState,
      defaultWorkspacePreset: preset,
      searchHistoryStorage: storage,
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
    const preset = defaultWorkspacePreset()
    const storage = searchHistoryStorage()
    const actions = createWorkbenchWorkspaceState({
      workspaceRepo: createWorkspaceRepo({ get: vi.fn(async () => undefined) }),
      instanceRepo: createInstanceRepo(),
      pluginDataRepo: createPluginDataRepo(),
      database: databaseStub,
      availablePluginIds: () => [],
      getWorkspaceState: () => currentWorkspace,
      setWorkspaceState: vi.fn(),
      setWorkspaceList: vi.fn(),
      setLocale: vi.fn(),
      setActiveLayoutId: vi.fn(),
      setSearchSettings: vi.fn(),
      setSearchHistory: vi.fn(),
      setInstances: vi.fn(),
      applyThemeSelection: vi.fn(),
      applyBackgroundSelection: vi.fn(),
      reconcileInstancesForLayout: vi.fn(async () => ({ instances: [] })),
      clearContextMenu: vi.fn(),
      clearExpandState: vi.fn(),
      defaultWorkspacePreset: preset,
      searchHistoryStorage: storage,
    })

    await actions.switchWorkspace(currentWorkspace.id)

    expect(mocks.ensureWorkspaceSession).not.toHaveBeenCalled()
    expect(mocks.hydrateWorkbenchSessionState).not.toHaveBeenCalled()
  })

  it("falls back to the default workspace after deleting the active workspace", async () => {
    const currentWorkspace = workspace()
    const defaultWorkspace = workspace({ id: "default", name: "Default" })
    const preset = defaultWorkspacePreset()
    const storage = searchHistoryStorage()
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
      get: vi.fn(async (id: string) => (id === "default" ? defaultWorkspace : undefined)),
    }
    const setWorkspaceList = vi.fn((updater: (prev: Workspace[]) => Workspace[]) => {
      workspaceList = updater(workspaceList)
    })

    const actions = createWorkbenchWorkspaceState({
      workspaceRepo: createWorkspaceRepo(workspaceRepo),
      instanceRepo: createInstanceRepo(),
      pluginDataRepo: createPluginDataRepo(),
      database: databaseStub,
      availablePluginIds: () => [],
      getWorkspaceState: () => currentWorkspace,
      setWorkspaceState: vi.fn(),
      setWorkspaceList,
      setLocale: vi.fn(),
      setActiveLayoutId: vi.fn(),
      setSearchSettings: vi.fn(),
      setSearchHistory: vi.fn(),
      setInstances: vi.fn(),
      applyThemeSelection: vi.fn(),
      applyBackgroundSelection: vi.fn(),
      reconcileInstancesForLayout: vi.fn(async () => ({ instances: [] })),
      clearContextMenu: vi.fn(),
      clearExpandState: vi.fn(),
      defaultWorkspacePreset: preset,
      searchHistoryStorage: storage,
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

  it("passes the injected default workspace preset when creating a workspace", async () => {
    const createdWorkspace = workspace({ id: "workspace-new", name: "Workspace New" })
    mocks.createWorkspaceSession.mockResolvedValue(createdWorkspace)

    let workspaceList = [workspace()]
    const setWorkspaceList = vi.fn((updater: (prev: Workspace[]) => Workspace[]) => {
      workspaceList = updater(workspaceList)
    })
    const preset = defaultWorkspacePreset()
    const storage = searchHistoryStorage()

    const actions = createWorkbenchWorkspaceState({
      workspaceRepo: createWorkspaceRepo({ get: vi.fn(async () => undefined) }),
      instanceRepo: createInstanceRepo(),
      pluginDataRepo: createPluginDataRepo(),
      database: databaseStub,
      availablePluginIds: () => [],
      getWorkspaceState: () => workspace(),
      setWorkspaceState: vi.fn(),
      setWorkspaceList,
      setLocale: vi.fn(),
      setActiveLayoutId: vi.fn(),
      setSearchSettings: vi.fn(),
      setSearchHistory: vi.fn(),
      setInstances: vi.fn(),
      applyThemeSelection: vi.fn(),
      applyBackgroundSelection: vi.fn(),
      reconcileInstancesForLayout: vi.fn(async () => ({ instances: [] })),
      clearContextMenu: vi.fn(),
      clearExpandState: vi.fn(),
      defaultWorkspacePreset: preset,
      searchHistoryStorage: storage,
    })

    const result = await actions.createWorkspace("Workspace New")

    expect(mocks.createWorkspaceSession).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Workspace New",
        defaultWorkspacePreset: preset,
      }),
    )
    expect(workspaceList).toEqual([workspace(), createdWorkspace])
    expect(result).toBe(createdWorkspace)
  })
})
