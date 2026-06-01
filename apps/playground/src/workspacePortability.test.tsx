import { describe, expect, it } from "vitest"
import type { WorkspaceExport } from "./workspacePortability"
import { prepareImport } from "./workspacePortability"

describe("prepareImport", () => {
  it("rebinds imported instances and plugin data rows to the target workspace", () => {
    const data: WorkspaceExport = {
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
      instances: [
        {
          id: "notes-1",
          workspaceId: "legacy-workspace",
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
          workspaceId: "legacy-workspace",
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
})
