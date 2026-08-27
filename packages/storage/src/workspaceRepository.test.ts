import "fake-indexeddb/auto"
import { beforeEach, describe, expect, it } from "vitest"
import type { PluginManifest, PluginRecord, Workspace } from "@tabora/plugin-api"
import { createTaboraDatabase } from "./database"
import { createWorkspaceRepository } from "./workspaceRepository"

function installedPlugin(id: string, contributes: PluginManifest["contributes"]): PluginRecord {
  return {
    id,
    version: "1.0.0",
    source: "builtin",
    enabled: true,
    status: "active",
    installedAt: "2026-05-26T00:00:00.000Z",
    updatedAt: "2026-05-26T00:00:00.000Z",
    manifest: {
      id,
      name: id,
      version: "1.0.0",
      apiVersion: "1.0.0",
      entry: `builtin:${id}`,
      engine: { platform: "tabora" },
      contributes,
    },
    grantedPermissions: [],
  }
}

describe("createWorkspaceRepository", () => {
  beforeEach(() => {
    const request = indexedDB.deleteDatabase("tabora-test")
    return new Promise<void>((resolve, reject) => {
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
      request.onblocked = () => resolve()
    })
  })

  it("saves and loads a workspace", async () => {
    const database = createTaboraDatabase("tabora-test")
    const repository = createWorkspaceRepository(database)
    const workspace: Workspace = {
      id: "default",
      name: "默认",
      activeLayout: {
        pluginId: "official.layout.workbench-dashboard",
        kind: "layout",
        id: "official.layout.workbench-dashboard",
      },
      activeTheme: { pluginId: "official.theme", kind: "theme", id: "official.theme.light" },
      activeBackgroundProvider: {
        pluginId: "official.background",
        kind: "background-provider",
        id: "background.gradient-green",
      },
      config: {
        search: {
          defaultProvider: {
            pluginId: "official.search",
            kind: "search-provider",
            id: "official.search.google",
          },
          enabledProviders: [
            {
              pluginId: "official.search",
              kind: "search-provider",
              id: "official.search.google",
            },
          ],
        },
      },
      createdAt: "2026-05-26T00:00:00.000Z",
      updatedAt: "2026-05-26T00:00:00.000Z",
    }

    await repository.save(workspace)

    await expect(repository.get("default")).resolves.toEqual(workspace)
  })

  it("migrates a legacy workspace row while reading and rewrites the canonical row", async () => {
    const database = createTaboraDatabase("tabora-test")
    const repository = createWorkspaceRepository(database)
    await database.plugins.bulkPut([
      installedPlugin("official.theme", {
        themes: [{ id: "official.theme.light", title: "Light", tokens: {} }],
      }),
      installedPlugin("official.search", {
        searchProviders: [
          {
            id: "official.search.google",
            title: "Google",
            urlTemplate: "https://search.test/?q={query}",
          },
        ],
      }),
      installedPlugin("official.background", {
        backgroundProviders: [
          { id: "background.gradient-green", title: "Green", sourceType: "generated" },
        ],
      }),
    ])
    await database.workspaces.put({
      id: "default",
      name: "默认",
      activeLayoutId: "legacy.layout.grid",
      activeThemeId: "official.theme.light",
      activeBackgroundProviderId: "background.gradient-green",
      config: {
        search: {
          defaultProviderId: "official.search.google",
          enabledProviderIds: ["official.search.google"],
        },
      },
      createdAt: "2026-05-26T00:00:00.000Z",
      updatedAt: "2026-05-26T00:00:00.000Z",
    } as unknown as Workspace)

    await expect(repository.get("default")).resolves.toMatchObject({
      activeTheme: { pluginId: "official.theme", kind: "theme", id: "official.theme.light" },
      activeLayout: {
        pluginId: "official.layout.workbench-dashboard",
        kind: "layout",
        id: "official.layout.workbench-dashboard",
      },
    })

    const raw = (await database.workspaces.get("default")) as unknown as Record<string, unknown>
    expect(raw).not.toHaveProperty("activeThemeId")
    expect(raw).not.toHaveProperty("activeLayoutId")
    expect(raw).not.toHaveProperty("activeBackgroundProviderId")
  })
})
