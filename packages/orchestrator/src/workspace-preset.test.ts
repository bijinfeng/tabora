import { describe, expect, it } from "vitest"
import type { WorkspacePresetContribution } from "@tabora/plugin-api"
import { applyWorkspacePreset } from "./workspace-preset"

const preset: WorkspacePresetContribution = {
  id: "official.workspace.default",
  title: "默认工作区",
  plugins: ["official.search.command-bar", "official.widgets.notes"],
  layoutId: "official.layout.workbench-dashboard",
  themeId: "official.theme.light",
  backgroundProviderId: "background.gradient-green",
  search: {
    defaultProviderId: "official.search.google",
    enabledProviderIds: ["official.search.google"],
  },
  regions: [
    { regionId: "topbar", accepts: ["search"] },
    { regionId: "mainGrid", accepts: ["widget"] },
  ],
  instances: [
    {
      pluginId: "official.search.command-bar",
      contributionId: "official.search.command-bar",
      instanceId: "search-main",
      extensionPoint: "search",
      regionId: "topbar",
    },
    {
      pluginId: "official.widgets.notes",
      contributionId: "notes",
      instanceId: "notes-1",
      extensionPoint: "widget",
      regionId: "mainGrid",
      size: "L",
      config: { color: "green", nested: { enabled: true }, tags: ["daily"] },
    },
  ],
}

describe("applyWorkspacePreset", () => {
  it("generates a workspace and plugin instances from a preset", () => {
    const result = applyWorkspacePreset({
      preset,
      workspaceId: "default",
      workspaceName: "默认工作区",
      now: "2026-06-05T00:00:00.000Z",
    })

    expect(result.workspace).toMatchObject({
      id: "default",
      name: "默认工作区",
      activeLayoutId: "official.layout.workbench-dashboard",
      activeThemeId: "official.theme.light",
      activeBackgroundProviderId: "background.gradient-green",
      config: { search: preset.search },
    })
    expect(result.workspace.regions["topbar"]?.instances).toEqual([{ instanceId: "search-main" }])
    expect(result.workspace.regions["mainGrid"]?.instances).toEqual([{ instanceId: "notes-1" }])
    expect(result.instances).toHaveLength(2)
    expect(result.instances[1]).toMatchObject({
      id: "notes-1",
      workspaceId: "default",
      pluginId: "official.widgets.notes",
      contributionId: "notes",
      extensionPoint: "widget",
      regionId: "mainGrid",
      size: "L",
      config: { color: "green", nested: { enabled: true }, tags: ["daily"] },
    })
  })

  it("fails when a preset instance targets an unknown region", () => {
    expect(() =>
      applyWorkspacePreset({
        preset: {
          ...preset,
          instances: [
            ...preset.instances,
            {
              pluginId: "official.widgets.todo",
              contributionId: "todo",
              instanceId: "todo-1",
              extensionPoint: "widget",
              regionId: "missing",
            },
          ],
        },
        workspaceId: "default",
        workspaceName: "默认工作区",
        now: "2026-06-05T00:00:00.000Z",
      }),
    ).toThrow(
      'Workspace preset "official.workspace.default" instance "todo-1" targets unknown region "missing"',
    )
  })

  it("fails when a preset instance targets an incompatible region", () => {
    expect(() =>
      applyWorkspacePreset({
        preset: {
          ...preset,
          instances: [
            ...preset.instances,
            {
              pluginId: "official.widgets.todo",
              contributionId: "todo",
              instanceId: "todo-1",
              extensionPoint: "widget",
              regionId: "topbar",
            },
          ],
        },
        workspaceId: "default",
        workspaceName: "默认工作区",
        now: "2026-06-05T00:00:00.000Z",
      }),
    ).toThrow(
      'Workspace preset "official.workspace.default" instance "todo-1" uses extension point "widget" incompatible with region "topbar"',
    )
  })

  it("does not share mutable nested preset values with output", () => {
    const result = applyWorkspacePreset({
      preset: {
        ...preset,
      },
      workspaceId: "default",
      workspaceName: "默认工作区",
      now: "2026-06-05T00:00:00.000Z",
    })

    result.workspace.regions["topbar"]!.accepts.push("widget")
    ;(result.workspace.config!.search as { enabledProviderIds: string[] }).enabledProviderIds.push(
      "official.search.github",
    )
    result.instances[1]!.config.color = "blue"
    ;(result.instances[1]!.config.nested as { enabled: boolean }).enabled = false
    ;(result.instances[1]!.config.tags as string[]).push("mutated")

    expect(preset.regions[0]!.accepts).toEqual(["search"])
    expect(preset.search.enabledProviderIds).toEqual(["official.search.google"])
    expect(preset.instances[1]!.config).toEqual({
      color: "green",
      nested: { enabled: true },
      tags: ["daily"],
    })
  })
})
