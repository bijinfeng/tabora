import { describe, expect, it } from "vitest"
import { builtinDefaultWorkspacePreset } from "@tabora/builtin-plugin-registry"
import { createDefaultWorkspaceFromPreset } from "@tabora/workbench-app"

describe("createDefaultWorkspaceFromPreset", () => {
  it("creates workspace and instances from the official preset", () => {
    const { workspace } = createDefaultWorkspaceFromPreset({
      preset: builtinDefaultWorkspacePreset,
    })

    expect(workspace.id).toBe("default")
    expect(workspace.name).toBe("默认工作区")
    expect(workspace.activeLayoutId).toBe("official.layout.workbench-dashboard")
    expect(workspace.activeThemeId).toBe("official.theme.light")
    expect(workspace.activeBackgroundProviderId).toBe("background.gradient-green")

    expect(workspace.regions["rail"]).toBeUndefined()
    expect(Object.values(workspace.regions).flatMap((region) => region.accepts)).not.toContain(
      "layout",
    )

    const topbar = workspace.regions["topbar"]
    expect(topbar).toBeDefined()
    expect(topbar!.instances).toHaveLength(1)
    expect(topbar!.instances[0]!.instanceId).toBe("search-main")

    const mainGrid = workspace.regions["mainGrid"]
    expect(mainGrid).toBeDefined()
    expect(mainGrid!.instances).toHaveLength(6)
    expect(mainGrid!.instances.map((instance) => instance.instanceId)).toEqual([
      "today-focus-1",
      "quick-links-1",
      "todo-1",
      "notes-1",
      "weather-1",
      "plugin-status-1",
    ])
  })

  it("assigns correct extension points and region IDs to instances", () => {
    const { instances } = createDefaultWorkspaceFromPreset({
      preset: builtinDefaultWorkspacePreset,
    })

    const searchInstance = instances.find((i) => i.regionId === "topbar")
    expect(searchInstance).toBeDefined()
    expect(searchInstance!.extensionPoint).toBe("search")
    expect(searchInstance!.pluginId).toBe("official.search.command-bar")

    const widgetInstances = instances.filter((i) => i.regionId === "mainGrid")
    expect(widgetInstances).toHaveLength(6)
    for (const inst of widgetInstances) {
      expect(inst.extensionPoint).toBe("widget")
      expect(inst.enabled).toBe(true)
    }
    expect(instances.find((i) => i.id === "weather-1")?.size).toBe("S")
    expect(instances.find((i) => i.id === "todo-1")?.size).toBe("S")
    expect(instances.find((i) => i.id === "notes-1")?.size).toBe("L")
    expect(instances.find((i) => i.id === "plugin-status-1")?.pluginId).toBe(
      "official.plugin-manager",
    )
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
