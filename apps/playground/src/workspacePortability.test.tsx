import { describe, expect, it } from "vitest"
import type { WorkspaceExport } from "@tabora/workbench-app"
import { parseExport, prepareImport } from "@tabora/workbench-app"

describe("prepareImport", () => {
  it("rejects current schema exports without an explicit active background provider", () => {
    const data = {
      schemaVersion: 1,
      exportedAt: "2026-06-01T00:00:00.000Z",
      workspace: {
        id: "workspace-imported",
        name: "导入工作区",
        activeLayoutId: "official.layout.workbench-dashboard",
        activeThemeId: "official.theme.light",
        regions: {},
        createdAt: "2026-06-01T00:00:00.000Z",
        updatedAt: "2026-06-01T00:00:00.000Z",
      },
      instances: [],
      pluginData: [],
    }

    expect(parseExport(JSON.stringify(data))).toBeNull()
  })

  it("rejects current schema exports without explicit enabled search providers", () => {
    const data = {
      schemaVersion: 1,
      exportedAt: "2026-06-01T00:00:00.000Z",
      workspace: {
        id: "workspace-imported",
        name: "导入工作区",
        activeLayoutId: "official.layout.workbench-dashboard",
        activeThemeId: "official.theme.light",
        activeBackgroundProviderId: "background.gradient-green",
        config: {
          search: {
            defaultProviderId: "official.search.google",
          },
        },
        regions: {},
        createdAt: "2026-06-01T00:00:00.000Z",
        updatedAt: "2026-06-01T00:00:00.000Z",
      },
      instances: [],
      pluginData: [],
    }

    expect(parseExport(JSON.stringify(data))).toBeNull()
  })

  it("rebinds imported instances and plugin data rows to the target workspace", () => {
    const data: WorkspaceExport = {
      schemaVersion: 1,
      exportedAt: "2026-06-01T00:00:00.000Z",
      workspace: {
        id: "workspace-imported",
        name: "导入工作区",
        activeLayoutId: "official.layout.workbench-dashboard",
        activeThemeId: "official.theme.light",
        activeBackgroundProviderId: "background.gradient-green",
        config: {
          search: {
            defaultProviderId: "official.search.google",
            enabledProviderIds: ["official.search.google"],
          },
        },
        regions: {},
        createdAt: "2026-06-01T00:00:00.000Z",
        updatedAt: "2026-06-01T00:00:00.000Z",
      },
      instances: [
        {
          id: "notes-1",
          workspaceId: "source-workspace",
          pluginId: "official.widgets.notes",
          contributionId: "notes",
          extensionPoint: "widget",
          regionId: "mainGrid",
          enabled: true,
          size: "M",
          config: {},
          createdAt: "2026-06-01T00:00:00.000Z",
          updatedAt: "2026-06-01T00:00:00.000Z",
        },
      ],
      pluginData: [
        {
          id: "official.widgets.notes:content:notes-1",
          pluginId: "official.widgets.notes",
          workspaceId: "source-workspace",
          instanceId: "notes-1",
          key: "content",
          value: "hello",
          updatedAt: "2026-06-01T00:00:00.000Z",
        },
      ],
    }

    const result = prepareImport(data, ["official.widgets.notes"])

    expect(result.instances).toMatchObject([{ workspaceId: "workspace-imported" }])
    expect(result.pluginDataRows).toMatchObject([{ workspaceId: "workspace-imported" }])
    expect(result.warnings).toEqual([])
  })

  it("drops instances and plugin data for unavailable plugins while preserving valid rows", () => {
    const data: WorkspaceExport = {
      schemaVersion: 1,
      exportedAt: "2026-06-01T00:00:00.000Z",
      workspace: {
        id: "workspace-imported",
        name: "导入工作区",
        activeLayoutId: "official.layout.workbench-dashboard",
        activeThemeId: "official.theme.light",
        activeBackgroundProviderId: "background.gradient-green",
        config: {
          search: {
            defaultProviderId: "official.search.google",
            enabledProviderIds: ["official.search.google"],
          },
        },
        regions: {},
        createdAt: "2026-06-01T00:00:00.000Z",
        updatedAt: "2026-06-01T00:00:00.000Z",
      },
      instances: [
        {
          id: "notes-1",
          workspaceId: "source-workspace",
          pluginId: "official.widgets.notes",
          contributionId: "notes",
          extensionPoint: "widget",
          regionId: "mainGrid",
          enabled: true,
          size: "M",
          config: {},
          createdAt: "2026-06-01T00:00:00.000Z",
          updatedAt: "2026-06-01T00:00:00.000Z",
        },
        {
          id: "ghost-1",
          workspaceId: "source-workspace",
          pluginId: "missing.plugin",
          contributionId: "ghost",
          extensionPoint: "widget",
          regionId: "mainGrid",
          enabled: true,
          size: "S",
          config: {},
          createdAt: "2026-06-01T00:00:00.000Z",
          updatedAt: "2026-06-01T00:00:00.000Z",
        },
      ],
      pluginData: [
        {
          id: "official.widgets.notes:content:notes-1",
          pluginId: "official.widgets.notes",
          workspaceId: "source-workspace",
          instanceId: "notes-1",
          key: "content",
          value: "hello",
          updatedAt: "2026-06-01T00:00:00.000Z",
        },
        {
          id: "missing.plugin:content:ghost-1",
          pluginId: "missing.plugin",
          workspaceId: "source-workspace",
          instanceId: "ghost-1",
          key: "content",
          value: "ghost",
          updatedAt: "2026-06-01T00:00:00.000Z",
        },
      ],
    }

    const result = prepareImport(data, ["official.widgets.notes"])

    expect(result.instances).toHaveLength(1)
    expect(result.instances[0]?.pluginId).toBe("official.widgets.notes")
    expect(result.pluginDataRows).toHaveLength(1)
    expect(result.pluginDataRows[0]?.pluginId).toBe("official.widgets.notes")
    expect(result.warnings).toEqual([
      '插件 "missing.plugin" 不存在 (实例: ghost-1)',
      '插件 "missing.plugin" 数据已跳过',
    ])
  })
})
