import type { LayoutContribution, PluginInstance, Workspace } from "@tabora/plugin-api"
import type { LayoutSwitchPlan } from "@tabora/orchestrator"
import { describe, expect, it, vi } from "vitest"

import {
  reconcileWorkbenchLayoutInstances,
  switchWorkbenchLayout,
} from "./WorkbenchShellLayoutState"

const baseDate = "2026-06-07T00:00:00.000Z"

function workspace(overrides: Partial<Workspace> = {}): Workspace {
  return {
    id: "workspace-1",
    name: "Main",
    activeLayout: { pluginId: "official.layout", kind: "layout", id: "layout.previous" },
    activeTheme: { pluginId: "official.theme", kind: "theme", id: "theme.light" },
    activeBackgroundProvider: {
      pluginId: "official.background",
      kind: "background-provider",
      id: "background.gradient-green",
    },
    config: {},
    regions: {
      old: { regionId: "old", accepts: ["widget"], instances: [{ instanceId: "widget-1" }] },
    },
    createdAt: baseDate,
    updatedAt: baseDate,
    ...overrides,
  }
}

function instance(overrides: Partial<PluginInstance> = {}): PluginInstance {
  return {
    id: "widget-1",
    workspaceId: "workspace-1",
    contribution: { pluginId: "plugin.widgets", kind: "widget", id: "widget.notes" },
    regionId: "old",
    enabled: true,
    size: "M",
    config: {},
    createdAt: baseDate,
    updatedAt: baseDate,
    ...overrides,
  }
}

function layout(regions: LayoutContribution["regions"]): LayoutContribution {
  return {
    id: "layout.next",
    title: "Next",
    view: "layout.next.view",
    regions,
    defaultRegions: {},
    supportsResponsive: true,
  }
}

function plan(): LayoutSwitchPlan {
  return {
    snapshot: {
      id: "workspace-1:snapshot:layout.previous:layout.next",
      workspaceId: "workspace-1",
      layoutId: "layout.previous",
      regions: workspace().regions,
      instances: [instance()],
      createdAt: baseDate,
    },
    placedInstances: [instance({ regionId: "grid", updatedAt: "2026-06-07T01:00:00.000Z" })],
    unplacedInstances: [],
    nextRegions: {
      grid: {
        regionId: "grid",
        accepts: ["widget"],
        instances: [{ instanceId: "widget-1" }],
      },
    },
  }
}

describe("reconcileWorkbenchLayoutInstances", () => {
  it("persists changed instances after layout reassignment and returns the plan", async () => {
    const currentInstances = [instance(), instance({ id: "widget-2", regionId: "grid" })]
    const migratedInstances = [
      { ...currentInstances[0]!, regionId: "grid", updatedAt: "2026-06-07T01:00:00.000Z" },
      currentInstances[1]!,
    ]
    const saveInstance = vi.fn(async () => {})

    const result = await reconcileWorkbenchLayoutInstances({
      layoutId: "layout.next",
      currentInstances,
      activeWorkspace: workspace(),
      findLayout: () => layout([{ id: "grid", title: "Grid", accepts: ["widget"] }]),
      executeLayoutSwitch: () => ({ instances: migratedInstances, plan: plan() }),
      assignGridOrder: (instances) => instances,
      saveInstance,
    })

    expect(saveInstance).toHaveBeenCalledOnce()
    expect(saveInstance).toHaveBeenCalledWith(migratedInstances[0])
    expect(result.instances).toEqual(migratedInstances)
    expect(result.plan).toEqual(plan())
  })

  it("returns assigned instances without a plan when the execution stays in-place", async () => {
    const currentInstances = [instance()]

    const result = await reconcileWorkbenchLayoutInstances({
      layoutId: "layout.next",
      currentInstances,
      activeWorkspace: workspace(),
      findLayout: () => layout([{ id: "grid", title: "Grid", accepts: ["widget"] }]),
      executeLayoutSwitch: () => currentInstances,
      assignGridOrder: (instances) => instances,
      saveInstance: vi.fn(async () => {}),
    })

    expect(result.instances).toEqual(currentInstances)
    expect(result.plan).toBeNull()
  })
})

describe("switchWorkbenchLayout", () => {
  it("clears transient state, persists snapshot/layout state, and updates shell signals", async () => {
    const currentWorkspace = workspace()
    const currentInstances = [instance()]
    const nextInstances = [{ ...currentInstances[0]!, regionId: "grid" }]
    const reconcileInstances = vi.fn(async () => ({
      instances: nextInstances,
      plan: plan(),
    }))
    const saveSnapshot = vi.fn(async () => {})
    const persistWorkspaceLayout = vi.fn(
      async (): Promise<Workspace> => ({
        ...currentWorkspace,
        activeLayout: { pluginId: "official.layout", kind: "layout", id: "layout.next" },
        regions: plan().nextRegions,
      }),
    )
    const setCtxMenu = vi.fn()
    const setExpandState = vi.fn()
    const setInstances = vi.fn()
    const setActiveLayoutId = vi.fn()
    const setWorkspaceState = vi.fn()

    await switchWorkbenchLayout({
      layoutId: "layout.next",
      activeWorkspace: currentWorkspace,
      currentInstances,
      findLayout: () => layout([{ id: "grid", title: "Grid", accepts: ["widget"] }]),
      reconcileInstances,
      clearContextMenu: () => setCtxMenu(null),
      clearExpandState: () => setExpandState(null),
      setInstances,
      setActiveLayoutId,
      saveSnapshot,
      persistWorkspaceLayout,
      setWorkspaceState,
    })

    expect(setCtxMenu).toHaveBeenCalledWith(null)
    expect(setExpandState).toHaveBeenCalledWith(null)
    expect(reconcileInstances).toHaveBeenCalledWith("layout.next", currentInstances)
    expect(setInstances).toHaveBeenCalledWith(nextInstances)
    expect(setActiveLayoutId).toHaveBeenCalledWith("layout.next")
    expect(saveSnapshot).toHaveBeenCalledWith(plan().snapshot)
    expect(persistWorkspaceLayout).toHaveBeenCalledWith(
      "workspace-1",
      "layout.next",
      plan().nextRegions,
    )
    expect(setWorkspaceState).toHaveBeenCalledWith(
      expect.objectContaining({
        activeLayout: { pluginId: "official.layout", kind: "layout", id: "layout.next" },
        regions: plan().nextRegions,
      }),
    )
  })

  it("returns early when the target layout does not exist", async () => {
    const setInstances = vi.fn()

    await switchWorkbenchLayout({
      layoutId: "layout.missing",
      activeWorkspace: workspace(),
      currentInstances: [instance()],
      findLayout: () => undefined,
      reconcileInstances: vi.fn(),
      clearContextMenu: vi.fn(),
      clearExpandState: vi.fn(),
      setInstances,
      setActiveLayoutId: vi.fn(),
      saveSnapshot: vi.fn(async () => {}),
      persistWorkspaceLayout: vi.fn(async () => null),
      setWorkspaceState: vi.fn(),
    })

    expect(setInstances).not.toHaveBeenCalled()
  })
})
