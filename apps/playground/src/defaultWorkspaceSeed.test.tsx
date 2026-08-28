import { describe, expect, it } from "vitest"
import { builtinDefaultWorkspacePreset } from "@tabora/builtin-plugin-registry/workspace"
import { createDefaultWorkspaceFromPreset } from "@tabora/workbench-app/default-workspace-seed"

describe("createDefaultWorkspaceFromPreset", () => {
  it("creates workspace and instances from the official preset", () => {
    const { workspace, instances } = createDefaultWorkspaceFromPreset({
      preset: builtinDefaultWorkspacePreset,
    })

    expect(workspace.id).toBe("default")
    expect(workspace.name).toBe("默认工作区")
    expect(workspace.activeLayout.id).toBe("official.layout.workbench-dashboard")
    expect(workspace.activeTheme.id).toBe("official.theme.light")
    expect(workspace.activeBackgroundProvider.id).toBe("background.gradient-green")

    const searchInstances = instances.filter((i) => i.contribution.kind === "search")
    expect(searchInstances).toHaveLength(1)
    expect(searchInstances[0]!.id).toBe("search-main")

    const widgetInstances = instances.filter((i) => i.contribution.kind === "widget")
    expect(widgetInstances).toHaveLength(4)
    expect(widgetInstances.map((i) => i.id)).toEqual([
      "quick-links-1",
      "todo-1",
      "notes-1",
      "weather-1",
    ])
  })

  it("assigns correct extension points and region IDs to instances", () => {
    const { instances } = createDefaultWorkspaceFromPreset({
      preset: builtinDefaultWorkspacePreset,
    })

    const searchInstance = instances.find((i) => i.regionId === "topbar")
    expect(searchInstance).toBeDefined()
    expect(searchInstance!.contribution.kind).toBe("search")
    expect(searchInstance!.contribution.pluginId).toBe("official.search.command-bar")

    const widgetInstances = instances.filter((i) => i.regionId === "mainGrid")
    expect(widgetInstances).toHaveLength(4)
    for (const inst of widgetInstances) {
      expect(inst.contribution.kind).toBe("widget")
      expect(inst.enabled).toBe(true)
    }
    expect(instances.find((i) => i.id === "weather-1")?.size).toBe("S")
    expect(instances.find((i) => i.id === "todo-1")?.size).toBe("S")
    expect(instances.find((i) => i.id === "notes-1")?.size).toBe("M")
  })

  it("each instance has createdAt and updatedAt timestamps", () => {
    const { instances, workspace } = createDefaultWorkspaceFromPreset({
      preset: builtinDefaultWorkspacePreset,
    })

    expect(workspace.createdAt).toBeTruthy()
    expect(workspace.updatedAt).toBeTruthy()

    for (const inst of instances) {
      expect(inst.createdAt).toBeTruthy()
      expect(inst.updatedAt).toBeTruthy()
    }
  })

  it("seed does not hardcode token values or background styles", () => {
    const { workspace } = createDefaultWorkspaceFromPreset({
      preset: builtinDefaultWorkspacePreset,
    })

    expect(workspace.config).toEqual({ search: builtinDefaultWorkspacePreset.search })
    expect(workspace).not.toHaveProperty("tokens")
    expect(workspace).not.toHaveProperty("backgrounds")
  })
})
