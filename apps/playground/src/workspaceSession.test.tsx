import "fake-indexeddb/auto"
import { beforeEach, describe, expect, it } from "vitest"
import {
  createTaboraDatabase,
  createInstanceRepository,
  createPluginDataRepository,
  createWorkspaceRepository,
} from "@tabora/storage"
import type { PluginInstance, SearchProviderContribution, Workspace } from "@tabora/plugin-api"
import {
  createWorkspaceSession,
  deleteWorkspaceSession,
  ensureWorkspaceSession,
  readSearchSettings,
  updateWorkspaceBackground,
  updateWorkspaceRecord,
  updateWorkspaceTheme,
} from "./workspaceSession"

const providers: SearchProviderContribution[] = [
  {
    id: "official.search.google",
    title: "Google",
    urlTemplate: "https://www.google.com/search?q={query}",
  },
  {
    id: "official.search.github",
    title: "GitHub",
    urlTemplate: "https://github.com/search?q={query}",
    shortcut: "gh",
  },
]

function deleteTestDatabase() {
  const request = indexedDB.deleteDatabase("tabora-workspace-session-test")
  return new Promise<void>((resolve, reject) => {
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
    request.onblocked = () => resolve()
  })
}

describe("workspaceSession", () => {
  beforeEach(() => deleteTestDatabase())

  it("reads search settings from workspace config", () => {
    const workspace: Workspace = {
      id: "default",
      name: "默认工作区",
      activeLayoutId: "official.layout.workbench-dashboard",
      activeThemeId: "official.theme.light",
      config: {
        search: {
          defaultProviderId: "official.search.github",
          enabledProviderIds: ["official.search.github"],
        },
      },
      regions: {},
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-01T00:00:00.000Z",
    }

    expect(readSearchSettings(workspace, providers)).toEqual({
      defaultProviderId: "official.search.github",
      enabledProviderIds: ["official.search.github"],
    })
  })

  it("creates a default workspace session when none exists", async () => {
    const database = createTaboraDatabase("tabora-workspace-session-test")
    const workspaceRepo = createWorkspaceRepository(database)
    const instanceRepo = createInstanceRepository(database)
    const pluginDataRepo = createPluginDataRepository(database)

    const session = await ensureWorkspaceSession({
      workspaceRepo,
      instanceRepo,
      pluginDataRepo,
      searchProviders: providers,
    })

    expect(session.workspace.id).toBe("default")
    expect(session.instances).toHaveLength(7)
    expect(session.searchSettings.defaultProviderId).toBe("official.search.google")
  })

  it("does not backfill existing default workspace instances", async () => {
    const database = createTaboraDatabase("tabora-workspace-session-test")
    const workspaceRepo = createWorkspaceRepository(database)
    const instanceRepo = createInstanceRepository(database)
    const pluginDataRepo = createPluginDataRepository(database)
    const now = "2026-06-01T00:00:00.000Z"

    await workspaceRepo.save({
      id: "default",
      name: "默认工作区",
      activeLayoutId: "official.layout.workbench-dashboard",
      activeThemeId: "official.theme.light",
      activeBackgroundProviderId: "background.gradient-green",
      regions: {},
      createdAt: now,
      updatedAt: now,
    })
    const legacyInstances: PluginInstance[] = [
      [
        "search-main",
        "official.search.command-bar",
        "official.search.command-bar",
        "search",
        "topbar",
      ],
      ["today-focus-1", "official.widgets.today-focus", "today-focus", "widget", "mainGrid"],
      ["quick-links-1", "official.widgets.quick-links", "quick-links", "widget", "mainGrid"],
      ["notes-1", "official.widgets.notes", "notes", "widget", "mainGrid"],
      ["todo-1", "official.widgets.todo", "todo", "widget", "mainGrid"],
    ].map(([id, pluginId, contributionId, extensionPoint, regionId]) => ({
      id,
      workspaceId: "default",
      pluginId,
      contributionId,
      extensionPoint,
      regionId,
      enabled: true,
      size: "M",
      config: {},
      createdAt: now,
      updatedAt: now,
    })) as PluginInstance[]
    for (const instance of legacyInstances) {
      await instanceRepo.save(instance)
    }

    const session = await ensureWorkspaceSession({
      workspaceRepo,
      instanceRepo,
      pluginDataRepo,
      searchProviders: providers,
    })

    expect(session.instances.some((instance) => instance.id === "weather-1")).toBe(false)
    expect(session.instances.some((instance) => instance.id === "plugin-status-1")).toBe(false)
    expect(session.instances).toHaveLength(5)
  })

  it("does not seed an existing empty workspace", async () => {
    const database = createTaboraDatabase("tabora-workspace-session-test")
    const workspaceRepo = createWorkspaceRepository(database)
    const instanceRepo = createInstanceRepository(database)
    const pluginDataRepo = createPluginDataRepository(database)
    const now = "2026-06-01T00:00:00.000Z"

    await workspaceRepo.save({
      id: "default",
      name: "空工作区",
      activeLayoutId: "official.layout.workbench-dashboard",
      activeThemeId: "official.theme.light",
      activeBackgroundProviderId: "background.gradient-green",
      regions: {
        topbar: { regionId: "topbar", accepts: ["search"], instances: [] },
        mainGrid: { regionId: "mainGrid", accepts: ["widget"], instances: [] },
      },
      createdAt: now,
      updatedAt: now,
    })

    const session = await ensureWorkspaceSession({
      workspaceRepo,
      instanceRepo,
      pluginDataRepo,
      searchProviders: providers,
    })

    expect(session.workspace.name).toBe("空工作区")
    expect(session.instances).toEqual([])
    await expect(instanceRepo.getByWorkspace("default")).resolves.toEqual([])
  })

  it("creates an isolated workspace with seeded instances", async () => {
    const database = createTaboraDatabase("tabora-workspace-session-test")
    const workspaceRepo = createWorkspaceRepository(database)
    const instanceRepo = createInstanceRepository(database)

    const workspace = await createWorkspaceSession({
      workspaceRepo,
      instanceRepo,
      name: "新的工作区",
    })

    const instances = await instanceRepo.getByWorkspace(workspace.id)
    expect(workspace.name).toBe("新的工作区")
    expect(instances).toHaveLength(7)
    expect(instances.every((instance) => instance.workspaceId === workspace.id)).toBe(true)
  })

  it("deletes workspace records, instances, and plugin data together", async () => {
    const database = createTaboraDatabase("tabora-workspace-session-test")
    const workspaceRepo = createWorkspaceRepository(database)
    const instanceRepo = createInstanceRepository(database)
    const pluginDataRepo = createPluginDataRepository(database)

    const workspace = await createWorkspaceSession({
      workspaceRepo,
      instanceRepo,
      name: "待删除工作区",
    })
    await pluginDataRepo.saveForWorkspace(
      "official.search.command-bar",
      workspace.id,
      "search-history",
      ["hello"],
    )

    await deleteWorkspaceSession({
      workspaceRepo,
      instanceRepo,
      pluginDataRepo,
      workspaceId: workspace.id,
    })

    await expect(workspaceRepo.get(workspace.id)).resolves.toBeUndefined()
    await expect(instanceRepo.getByWorkspace(workspace.id)).resolves.toEqual([])
    await expect(
      pluginDataRepo.getByWorkspace("official.search.command-bar", workspace.id, "search-history"),
    ).resolves.toBeUndefined()
  })

  it("loads switched workspace state with its own instances and search history", async () => {
    const database = createTaboraDatabase("tabora-workspace-session-test")
    const workspaceRepo = createWorkspaceRepository(database)
    const instanceRepo = createInstanceRepository(database)
    const pluginDataRepo = createPluginDataRepository(database)

    const workspaceA = await createWorkspaceSession({
      workspaceRepo,
      instanceRepo,
      name: "工作区 A",
    })
    const workspaceB = await createWorkspaceSession({
      workspaceRepo,
      instanceRepo,
      name: "工作区 B",
    })

    await pluginDataRepo.saveForWorkspace(
      "official.search.command-bar",
      workspaceA.id,
      "search-history",
      [
        {
          query: "alpha",
          providerId: "official.search.google",
          timestamp: "2026-06-01T00:00:00.000Z",
        },
      ],
    )
    await pluginDataRepo.saveForWorkspace(
      "official.search.command-bar",
      workspaceB.id,
      "search-history",
      [
        {
          query: "beta",
          providerId: "official.search.github",
          timestamp: "2026-06-01T00:00:00.000Z",
        },
      ],
    )

    const sessionA = await ensureWorkspaceSession({
      workspaceRepo,
      instanceRepo,
      pluginDataRepo,
      searchProviders: providers,
      workspaceId: workspaceA.id,
    })
    const sessionB = await ensureWorkspaceSession({
      workspaceRepo,
      instanceRepo,
      pluginDataRepo,
      searchProviders: providers,
      workspaceId: workspaceB.id,
    })

    expect(sessionA.workspace.id).toBe(workspaceA.id)
    expect(sessionB.workspace.id).toBe(workspaceB.id)
    expect(sessionA.instances.every((instance) => instance.workspaceId === workspaceA.id)).toBe(
      true,
    )
    expect(sessionB.instances.every((instance) => instance.workspaceId === workspaceB.id)).toBe(
      true,
    )
    expect(sessionA.searchHistory).toEqual([
      {
        query: "alpha",
        providerId: "official.search.google",
        timestamp: "2026-06-01T00:00:00.000Z",
      },
    ])
    expect(sessionB.searchHistory).toEqual([
      {
        query: "beta",
        providerId: "official.search.github",
        timestamp: "2026-06-01T00:00:00.000Z",
      },
    ])
  })

  it("updates workspace config via shared record helper", async () => {
    const database = createTaboraDatabase("tabora-workspace-session-test")
    const workspaceRepo = createWorkspaceRepository(database)
    const instanceRepo = createInstanceRepository(database)

    const workspace = await createWorkspaceSession({
      workspaceRepo,
      instanceRepo,
      name: "设置工作区",
    })

    const updated = await updateWorkspaceRecord({
      workspaceRepo,
      workspaceId: workspace.id,
      mutator(current) {
        current.config = {
          ...(current.config ?? {}),
          search: {
            defaultProviderId: "official.search.github",
          },
        }
        return current
      },
    })

    expect(updated?.config).toMatchObject({
      search: { defaultProviderId: "official.search.github" },
    })
  })

  it("updates workspace theme and background", async () => {
    const database = createTaboraDatabase("tabora-workspace-session-test")
    const workspaceRepo = createWorkspaceRepository(database)
    const instanceRepo = createInstanceRepository(database)

    const workspace = await createWorkspaceSession({
      workspaceRepo,
      instanceRepo,
      name: "外观工作区",
    })

    const themed = await updateWorkspaceTheme({
      workspaceRepo,
      workspaceId: workspace.id,
      themeId: "official.theme.dark",
    })
    const backgrounded = await updateWorkspaceBackground({
      workspaceRepo,
      workspaceId: workspace.id,
      backgroundId: "background.gradient-blue",
    })

    expect(themed?.activeThemeId).toBe("official.theme.dark")
    expect(backgrounded?.activeBackgroundProviderId).toBe("background.gradient-blue")
  })
})
