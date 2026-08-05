import { describe, expect, it } from "vitest"
import type { WorkspacePresetContribution } from "@tabora/plugin-api"
import { applyWorkspacePreset } from "./workspace-preset"

const preset: WorkspacePresetContribution = {
  id: "official.workspace.default",
  title: "默认工作区",
  plugins: ["official.search.command-bar", "official.widgets.notes"],
  layout: {
    pluginId: "official.layout.workbench-dashboard",
    kind: "layout",
    id: "official.layout.workbench-dashboard",
  },
  theme: { pluginId: "official.theme", kind: "theme", id: "official.theme.light" },
  backgroundProvider: {
    pluginId: "official.background",
    kind: "background-provider",
    id: "background.gradient-green",
  },
  search: {
    defaultProvider: {
      pluginId: "official.search",
      kind: "search-provider",
      id: "official.search.google",
    },
    enabledProviders: [
      { pluginId: "official.search", kind: "search-provider", id: "official.search.google" },
    ],
  },
  regions: [
    { regionId: "topbar", accepts: ["search"] },
    { regionId: "mainGrid", accepts: ["widget"] },
  ],
  instances: [
    {
      contribution: {
        pluginId: "official.search.command-bar",
        kind: "search",
        id: "official.search.command-bar",
      },
      instanceId: "search-main",
      regionId: "topbar",
    },
    {
      contribution: { pluginId: "official.widgets.notes", kind: "widget", id: "notes" },
      instanceId: "notes-1",
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
      activeLayout: preset.layout,
      activeTheme: preset.theme,
      activeBackgroundProvider: preset.backgroundProvider,
      config: { search: preset.search },
    })
    expect(result.workspace.regions["topbar"]?.instances).toEqual([{ instanceId: "search-main" }])
    expect(result.workspace.regions["mainGrid"]?.instances).toEqual([{ instanceId: "notes-1" }])
    expect(result.instances).toHaveLength(2)
    expect(result.instances[0]).not.toHaveProperty("size")
    expect(result.instances[1]).toMatchObject({
      id: "notes-1",
      workspaceId: "default",
      contribution: { pluginId: "official.widgets.notes", kind: "widget", id: "notes" },
      regionId: "mainGrid",
      size: "L",
      config: { color: "green", nested: { enabled: true }, tags: ["daily"] },
    })
  })

  it("namespaces preset instance ids for non-default workspaces", () => {
    const result = applyWorkspacePreset({
      preset,
      workspaceId: "ws-1",
      workspaceName: "Workspace 1",
      now: "2026-06-05T00:00:00.000Z",
    })

    expect(result.workspace.regions["topbar"]?.instances).toEqual([
      { instanceId: "ws-1:search-main" },
    ])
    expect(result.workspace.regions["mainGrid"]?.instances).toEqual([
      { instanceId: "ws-1:notes-1" },
    ])
    expect(result.instances.map((instance) => instance.id)).toEqual([
      "ws-1:search-main",
      "ws-1:notes-1",
    ])
  })

  it("fails when a widget preset instance omits explicit size", () => {
    expect(() =>
      applyWorkspacePreset({
        preset: {
          ...preset,
          instances: [
            {
              contribution: { pluginId: "official.widgets.todo", kind: "widget", id: "todo" },
              instanceId: "todo-1",
              regionId: "mainGrid",
            },
          ],
        } as WorkspacePresetContribution,
        workspaceId: "default",
        workspaceName: "默认工作区",
        now: "2026-06-05T00:00:00.000Z",
      }),
    ).toThrow(
      'Workspace preset "official.workspace.default" widget instance "todo-1" must declare size',
    )
  })

  it("fails when a preset instance targets an unknown region", () => {
    expect(() =>
      applyWorkspacePreset({
        preset: {
          ...preset,
          instances: [
            ...preset.instances,
            {
              contribution: { pluginId: "official.widgets.todo", kind: "widget", id: "todo" },
              instanceId: "todo-1",
              regionId: "missing",
              size: "S",
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
              contribution: { pluginId: "official.widgets.todo", kind: "widget", id: "todo" },
              instanceId: "todo-1",
              regionId: "topbar",
              size: "S",
            },
          ],
        },
        workspaceId: "default",
        workspaceName: "默认工作区",
        now: "2026-06-05T00:00:00.000Z",
      }),
    ).toThrow(
      'Workspace preset "official.workspace.default" instance "todo-1" uses contribution kind "widget" incompatible with region "topbar"',
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
    ;(
      result.workspace.config!.search as { enabledProviders: Array<{ id: string }> }
    ).enabledProviders.push({
      id: "official.search.github",
    })
    result.instances[1]!.config.color = "blue"
    ;(result.instances[1]!.config.nested as { enabled: boolean }).enabled = false
    ;(result.instances[1]!.config.tags as string[]).push("mutated")

    expect(preset.regions[0]!.accepts).toEqual(["search"])
    expect(preset.search.enabledProviders.map((provider) => provider.id)).toEqual([
      "official.search.google",
    ])
    expect(preset.instances[1]!.config).toEqual({
      color: "green",
      nested: { enabled: true },
      tags: ["daily"],
    })
  })
})
