import { describe, expect, it } from "vitest"
import { createDefaultWorkspaceSeed, OFFICIAL_DEFAULT_WORKSPACE_SEED } from "./defaultWorkspaceSeed"

describe("createDefaultWorkspaceSeed", () => {
  it("creates workspace and instances from seed config", () => {
    const { workspace } = createDefaultWorkspaceSeed(OFFICIAL_DEFAULT_WORKSPACE_SEED)

    expect(workspace.id).toBe("default")
    expect(workspace.name).toBe("默认工作区")
    expect(workspace.activeLayoutId).toBe("official.layout.workbench-dashboard")
    expect(workspace.activeThemeId).toBe("official.theme.light")
    expect(workspace.activeBackgroundProviderId).toBe("background.gradient-green")

    const rail = workspace.regions["rail"]
    expect(rail).toBeDefined()
    expect(rail!.accepts).toContain("layout")
    expect(rail!.instances).toEqual([])

    const topbar = workspace.regions["topbar"]
    expect(topbar).toBeDefined()
    expect(topbar!.instances).toHaveLength(1)
    expect(topbar!.instances[0]!.instanceId).toBe("search-main")

    const mainGrid = workspace.regions["mainGrid"]
    expect(mainGrid).toBeDefined()
    expect(mainGrid!.instances).toHaveLength(4)
  })

  it("assigns correct extension points and region IDs to instances", () => {
    const { instances } = createDefaultWorkspaceSeed(OFFICIAL_DEFAULT_WORKSPACE_SEED)

    const searchInstance = instances.find((i) => i.regionId === "topbar")
    expect(searchInstance).toBeDefined()
    expect(searchInstance!.extensionPoint).toBe("search")
    expect(searchInstance!.pluginId).toBe("official.search.command-bar")

    const widgetInstances = instances.filter((i) => i.regionId === "mainGrid")
    expect(widgetInstances).toHaveLength(4)
    for (const inst of widgetInstances) {
      expect(inst.extensionPoint).toBe("widget")
      expect(inst.pluginId).toBe("official.widgets.productivity")
      expect(inst.enabled).toBe(true)
      expect(inst.size).toBe("M")
    }
  })

  it("each instance has createdAt and updatedAt timestamps", () => {
    const { instances, workspace } = createDefaultWorkspaceSeed(OFFICIAL_DEFAULT_WORKSPACE_SEED)

    expect(workspace.createdAt).toBeTruthy()
    expect(workspace.updatedAt).toBeTruthy()

    for (const inst of instances) {
      expect(inst.createdAt).toBeTruthy()
      expect(inst.updatedAt).toBeTruthy()
    }
  })

  it("seed does not hardcode token values or background styles", () => {
    const { workspace } = createDefaultWorkspaceSeed(OFFICIAL_DEFAULT_WORKSPACE_SEED)

    expect(workspace.config).toBeUndefined()
    expect(workspace).not.toHaveProperty("tokens")
    expect(workspace).not.toHaveProperty("backgrounds")
  })
})
