import "fake-indexeddb/auto"
import { beforeEach, describe, expect, it } from "vitest"
import {
  builtinDefaultWorkspacePreset,
  builtinWorkbenchShellConfig,
} from "@tabora/builtin-plugin-registry/workspace"
import {
  createTaboraDatabase,
  createInstanceRepository,
  createPluginDataRepository,
  createWorkspaceRepository,
} from "@tabora/storage"
import type { PluginInstance, Workspace } from "@tabora/plugin-api"
import {
  createWorkspaceSession,
  deleteWorkspaceSession,
  ensureWorkspaceSession,
  readSearchSettings,
  updateWorkspaceBackground,
  updateWorkspaceRecord,
  updateWorkspaceTheme,
} from "@tabora/workbench-app/workspace-session"

const refs = {
  layout: {
    pluginId: "official.layout.workbench-dashboard",
    kind: "layout" as const,
    id: "official.layout.workbench-dashboard",
  },
  theme: (id: string) => ({ pluginId: "official.theme.default-pack", kind: "theme" as const, id }),
  background: (id: string) => ({
    pluginId: "official.background.basic",
    kind: "background-provider" as const,
    id,
  }),
  provider: (id: string) => ({
    pluginId: "official.search-providers.basic",
    kind: "search-provider" as const,
    id,
  }),
}

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
      activeLayout: refs.layout,
      activeTheme: refs.theme("official.theme.light"),
      activeBackgroundProvider: refs.background("background.gradient-green"),
      config: {
        search: {
          defaultProvider: refs.provider("official.search.github"),
          enabledProviders: [refs.provider("official.search.github")],
        },
      },
      regions: {},
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-01T00:00:00.000Z",
    }

    expect(readSearchSettings(workspace)).toEqual({
      defaultProvider: refs.provider("official.search.github"),
      enabledProviders: [refs.provider("official.search.github")],
    })
  })

  it("rejects workspace search settings when enabled provider ids are missing", () => {
    const workspace: Workspace = {
      id: "default",
      name: "默认工作区",
      activeLayout: refs.layout,
      activeTheme: refs.theme("official.theme.light"),
      activeBackgroundProvider: refs.background("background.gradient-green"),
      config: {
        search: {
          defaultProvider: refs.provider("official.search.github"),
        },
      },
      regions: {},
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-01T00:00:00.000Z",
    }

    expect(() => readSearchSettings(workspace)).toThrow("Workspace search settings are invalid")
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
      defaultWorkspacePreset: builtinDefaultWorkspacePreset,
      searchHistoryStorage: builtinWorkbenchShellConfig.searchHistory,
    })

    expect(session.workspace.id).toBe("default")
    expect(session.instances).toHaveLength(5)
    expect(session.searchSettings.defaultProvider.id).toBe("official.search.google")
  })

  it("keeps existing default workspace instances unchanged", async () => {
    const database = createTaboraDatabase("tabora-workspace-session-test")
    const workspaceRepo = createWorkspaceRepository(database)
    const instanceRepo = createInstanceRepository(database)
    const pluginDataRepo = createPluginDataRepository(database)
    const now = "2026-06-01T00:00:00.000Z"

    await workspaceRepo.save({
      id: "default",
      name: "默认工作区",
      activeLayout: refs.layout,
      activeTheme: refs.theme("official.theme.light"),
      activeBackgroundProvider: refs.background("background.gradient-green"),
      config: {
        search: {
          defaultProvider: refs.provider("official.search.google"),
          enabledProviders: [
            refs.provider("official.search.google"),
            refs.provider("official.search.github"),
          ],
        },
      },
      regions: {},
      createdAt: now,
      updatedAt: now,
    })
    const existingInstances: PluginInstance[] = (
      [
        [
          "search-main",
          "official.search.command-bar",
          "official.search.command-bar",
          "search",
          "topbar",
        ],
        ["quick-links-1", "official.widgets.quick-links", "quick-links", "widget", "mainGrid"],
        ["notes-1", "official.widgets.notes", "notes", "widget", "mainGrid"],
        ["todo-1", "official.widgets.todo", "todo", "widget", "mainGrid"],
      ] satisfies Array<[string, string, string, "widget" | "search", string]>
    ).map(([id, pluginId, contributionId, kind, regionId]) => ({
      id,
      workspaceId: "default",
      contribution: { pluginId, kind, id: contributionId },
      regionId,
      enabled: true,
      ...(kind === "widget" ? { size: "M" as const } : {}),
      config: {},
      createdAt: now,
      updatedAt: now,
    })) as PluginInstance[]
    for (const instance of existingInstances) {
      await instanceRepo.save(instance)
    }

    const session = await ensureWorkspaceSession({
      workspaceRepo,
      instanceRepo,
      pluginDataRepo,
      defaultWorkspacePreset: builtinDefaultWorkspacePreset,
      searchHistoryStorage: builtinWorkbenchShellConfig.searchHistory,
    })

    expect(session.instances.some((instance) => instance.id === "weather-1")).toBe(false)
    expect(session.instances).toHaveLength(4)
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
      activeLayout: refs.layout,
      activeTheme: refs.theme("official.theme.light"),
      activeBackgroundProvider: refs.background("background.gradient-green"),
      config: {
        search: {
          defaultProvider: refs.provider("official.search.google"),
          enabledProviders: [
            refs.provider("official.search.google"),
            refs.provider("official.search.github"),
          ],
        },
      },
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
      defaultWorkspacePreset: builtinDefaultWorkspacePreset,
      searchHistoryStorage: builtinWorkbenchShellConfig.searchHistory,
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
      defaultWorkspacePreset: builtinDefaultWorkspacePreset,
      name: "新的工作区",
    })

    const instances = await instanceRepo.getByWorkspace(workspace.id)
    expect(workspace.name).toBe("新的工作区")
    expect(instances).toHaveLength(5)
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
      defaultWorkspacePreset: builtinDefaultWorkspacePreset,
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
      defaultWorkspacePreset: builtinDefaultWorkspacePreset,
      name: "工作区 A",
    })
    const workspaceB = await createWorkspaceSession({
      workspaceRepo,
      instanceRepo,
      defaultWorkspacePreset: builtinDefaultWorkspacePreset,
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
      defaultWorkspacePreset: builtinDefaultWorkspacePreset,
      searchHistoryStorage: builtinWorkbenchShellConfig.searchHistory,
      workspaceId: workspaceA.id,
    })
    const sessionB = await ensureWorkspaceSession({
      workspaceRepo,
      instanceRepo,
      pluginDataRepo,
      defaultWorkspacePreset: builtinDefaultWorkspacePreset,
      searchHistoryStorage: builtinWorkbenchShellConfig.searchHistory,
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
      defaultWorkspacePreset: builtinDefaultWorkspacePreset,
      name: "设置工作区",
    })

    const updated = await updateWorkspaceRecord({
      workspaceRepo,
      workspaceId: workspace.id,
      mutator(current) {
        current.config = {
          ...(current.config ?? {}),
          search: {
            defaultProvider: refs.provider("official.search.github"),
          },
        }
        return current
      },
    })

    expect(updated?.config).toMatchObject({
      search: { defaultProvider: refs.provider("official.search.github") },
    })
  })

  it("updates workspace theme and background", async () => {
    const database = createTaboraDatabase("tabora-workspace-session-test")
    const workspaceRepo = createWorkspaceRepository(database)
    const instanceRepo = createInstanceRepository(database)

    const workspace = await createWorkspaceSession({
      workspaceRepo,
      instanceRepo,
      defaultWorkspacePreset: builtinDefaultWorkspacePreset,
      name: "外观工作区",
    })

    const themed = await updateWorkspaceTheme({
      workspaceRepo,
      workspaceId: workspace.id,
      theme: refs.theme("official.theme.dark"),
    })
    const backgrounded = await updateWorkspaceBackground({
      workspaceRepo,
      workspaceId: workspace.id,
      background: refs.background("background.gradient-blue"),
    })

    expect(themed?.activeTheme.id).toBe("official.theme.dark")
    expect(backgrounded?.activeBackgroundProvider.id).toBe("background.gradient-blue")
  })
})
