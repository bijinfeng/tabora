import { describe, expect, it } from "vitest"

import {
  pluginInstanceSchema,
  workbenchSearchSettingsSchema,
  workspaceExportSchema,
  workspaceSchema,
} from "./workspaceSchema"

describe("workbenchSearchSettingsSchema", () => {
  it("rejects search settings without explicit enabled provider ids", () => {
    const result = workbenchSearchSettingsSchema.safeParse({
      defaultProvider: {
        pluginId: "official.search",
        kind: "search-provider",
        id: "official.search.google",
      },
    })

    expect(result.success).toBe(false)
  })

  it("rejects default providers that are not enabled", () => {
    const result = workbenchSearchSettingsSchema.safeParse({
      defaultProvider: {
        pluginId: "official.search",
        kind: "search-provider",
        id: "official.search.google",
      },
      enabledProviders: [
        { pluginId: "official.search", kind: "search-provider", id: "official.search.bing" },
      ],
    })

    expect(result.success).toBe(false)
  })
})

describe("workspaceSchema", () => {
  it("rejects workspaces without explicit current search settings", () => {
    const result = workspaceSchema.safeParse({
      id: "workspace-1",
      name: "Default",
      activeLayout: { pluginId: "official.layout", kind: "layout", id: "dashboard" },
      activeTheme: { pluginId: "official.theme", kind: "theme", id: "light" },
      activeBackgroundProvider: {
        pluginId: "official.background",
        kind: "background-provider",
        id: "default",
      },
      config: {},
      regions: {},
      createdAt: "2026-06-07T00:00:00.000Z",
      updatedAt: "2026-06-07T00:00:00.000Z",
    })

    expect(result.success).toBe(false)
  })
})

describe("pluginInstanceSchema", () => {
  it("rejects widget instances without explicit size", () => {
    const result = pluginInstanceSchema.safeParse({
      id: "notes-1",
      workspaceId: "workspace-1",
      contribution: { pluginId: "official.widgets.notes", kind: "widget", id: "notes" },
      regionId: "mainGrid",
      enabled: true,
      config: {},
      createdAt: "2026-06-07T00:00:00.000Z",
      updatedAt: "2026-06-07T00:00:00.000Z",
    })

    expect(result.success).toBe(false)
  })
})

describe("workspaceExportSchema", () => {
  it("rejects exports whose workspace search settings are incomplete", () => {
    const result = workspaceExportSchema.safeParse({
      schemaVersion: 1,
      exportedAt: "2026-06-07T00:00:00.000Z",
      workspace: {
        id: "workspace-1",
        name: "Default",
        activeLayout: { pluginId: "official.layout", kind: "layout", id: "dashboard" },
        activeTheme: { pluginId: "official.theme", kind: "theme", id: "light" },
        activeBackgroundProvider: {
          pluginId: "official.background",
          kind: "background-provider",
          id: "default",
        },
        config: {
          search: {
            defaultProvider: {
              pluginId: "official.search",
              kind: "search-provider",
              id: "official.search.google",
            },
          },
        },
        regions: {},
        createdAt: "2026-06-07T00:00:00.000Z",
        updatedAt: "2026-06-07T00:00:00.000Z",
      },
      instances: [],
      pluginData: [],
    })

    expect(result.success).toBe(false)
  })
})
