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
      defaultProviderId: "official.search.google",
    })

    expect(result.success).toBe(false)
  })

  it("rejects default providers that are not enabled", () => {
    const result = workbenchSearchSettingsSchema.safeParse({
      defaultProviderId: "official.search.google",
      enabledProviderIds: ["official.search.bing"],
    })

    expect(result.success).toBe(false)
  })
})

describe("workspaceSchema", () => {
  it("rejects workspaces without explicit current search settings", () => {
    const result = workspaceSchema.safeParse({
      id: "workspace-1",
      name: "Default",
      activeLayoutId: "official.layout.workbench-dashboard",
      activeThemeId: "official.theme.light",
      activeBackgroundProviderId: "official.background.default",
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
      pluginId: "official.widgets.notes",
      contributionId: "notes",
      extensionPoint: "widget",
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
        activeLayoutId: "official.layout.workbench-dashboard",
        activeThemeId: "official.theme.light",
        activeBackgroundProviderId: "official.background.default",
        config: {
          search: {
            defaultProviderId: "official.search.google",
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
