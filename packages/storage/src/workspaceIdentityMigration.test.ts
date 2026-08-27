import { describe, expect, it } from "vitest"
import type { PluginManifest, Workspace } from "@tabora/plugin-api"
import { migrateWorkspaceContributionRefs } from "./workspaceIdentityMigration"

function manifest(id: string, contributes: PluginManifest["contributes"]): PluginManifest {
  return {
    id,
    name: id,
    version: "1.0.0",
    apiVersion: "1.0.0",
    entry: `builtin:${id}`,
    engine: { platform: "tabora" },
    contributes,
  }
}

const themePlugin = manifest("official.theme", {
  themes: [{ id: "official.theme.light", title: "Light", tokens: {} }],
})

const searchPlugin = manifest("official.search", {
  searchProviders: [
    {
      id: "official.search.google",
      title: "Google",
      urlTemplate: "https://search.test/?q={query}",
    },
  ],
})

const backgroundPlugin = manifest("official.background", {
  backgroundProviders: [
    { id: "background.gradient-green", title: "Green", sourceType: "generated" },
  ],
})

const installed = [themePlugin, searchPlugin, backgroundPlugin]

function legacyWorkspace(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
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
    ...overrides,
  }
}

describe("migrateWorkspaceContributionRefs", () => {
  it("returns an already canonical workspace untouched", () => {
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

    expect(migrateWorkspaceContributionRefs(workspace, installed)).toBe(workspace)
  })

  it("resolves legacy scalar ids to owning-plugin refs and drops the legacy fields", () => {
    const migrated = migrateWorkspaceContributionRefs(legacyWorkspace(), installed)

    expect(migrated.activeTheme).toEqual({
      pluginId: "official.theme",
      kind: "theme",
      id: "official.theme.light",
    })
    expect(migrated.activeBackgroundProvider).toEqual({
      pluginId: "official.background",
      kind: "background-provider",
      id: "background.gradient-green",
    })
    expect(migrated.config?.search).toEqual({
      defaultProvider: {
        pluginId: "official.search",
        kind: "search-provider",
        id: "official.search.google",
      },
      enabledProviders: [
        { pluginId: "official.search", kind: "search-provider", id: "official.search.google" },
      ],
    })
    expect(migrated).not.toHaveProperty("activeThemeId")
    expect(migrated).not.toHaveProperty("activeBackgroundProviderId")
    expect(migrated).not.toHaveProperty("activeLayoutId")
  })

  it("migrates any legacy layout id to the single supported dashboard layout", () => {
    const migrated = migrateWorkspaceContributionRefs(
      legacyWorkspace({ activeLayoutId: "some.removed.layout" }),
      installed,
    )

    expect(migrated.activeLayout).toEqual({
      pluginId: "official.layout.workbench-dashboard",
      kind: "layout",
      id: "official.layout.workbench-dashboard",
    })
  })

  it("refuses a legacy id no installed manifest declares", () => {
    expect(() =>
      migrateWorkspaceContributionRefs(
        legacyWorkspace({ activeThemeId: "official.theme.missing" }),
        installed,
      ),
    ).toThrow('Cannot migrate workspace "default" theme "official.theme.missing": not found')
  })

  it("refuses a legacy id two plugins both declare instead of guessing an owner", () => {
    const rivalThemePlugin = manifest("community.theme", {
      themes: [{ id: "official.theme.light", title: "Light copy", tokens: {} }],
    })

    expect(() =>
      migrateWorkspaceContributionRefs(legacyWorkspace(), [...installed, rivalThemePlugin]),
    ).toThrow('Cannot migrate workspace "default" theme "official.theme.light": ambiguous')
  })

  it("refuses legacy search settings that are missing required fields", () => {
    expect(() =>
      migrateWorkspaceContributionRefs(
        legacyWorkspace({ config: { search: { enabledProviderIds: [] } } }),
        installed,
      ),
    ).toThrow('Cannot migrate workspace "default" search settings')
  })

  it("rejects a record that is neither canonical nor a migratable legacy shape", () => {
    expect(() => migrateWorkspaceContributionRefs({ id: "default" }, installed)).toThrow(
      'Invalid workspace record "default"',
    )
  })
})
