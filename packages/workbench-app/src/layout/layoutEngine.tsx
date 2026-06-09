import type { JSX } from "solid-js"
import type { LayoutHostAPI, PluginInstance, RegionSlot } from "@tabora/plugin-api"
import type { PluginCatalog } from "@tabora/orchestrator"

export type InstanceRenderer = {
  renderWidget: (instance: PluginInstance, callbacks?: unknown) => JSX.Element
  renderSearch: (instance: PluginInstance) => JSX.Element
  renderSettings?: (instance: PluginInstance) => JSX.Element
}

export type HostActionsSource = LayoutHostAPI

export type LayoutEngineDeps = {
  catalog: Pick<PluginCatalog, "findLayoutContribution">
  instanceRenderer: InstanceRenderer
  hostActions: HostActionsSource
}

function byGrid(a: PluginInstance, b: PluginInstance): number {
  return (a.grid?.y ?? 0) - (b.grid?.y ?? 0) || (a.grid?.x ?? 0) - (b.grid?.x ?? 0)
}

export function createLayoutEngine(deps: LayoutEngineDeps) {
  function renderOne(instance: PluginInstance): JSX.Element {
    if (instance.extensionPoint === "search") {
      return deps.instanceRenderer.renderSearch(instance)
    }
    if (instance.extensionPoint === "settings-panel" && deps.instanceRenderer.renderSettings) {
      return deps.instanceRenderer.renderSettings(instance)
    }
    return deps.instanceRenderer.renderWidget(instance)
  }

  function buildRegionSlots(
    layoutId: string,
    instances: PluginInstance[],
  ): Record<string, RegionSlot<JSX.Element>> {
    const layout = deps.catalog.findLayoutContribution(layoutId)
    const slots: Record<string, RegionSlot<JSX.Element>> = {}
    for (const region of layout?.regions ?? []) {
      const regionInstances = instances
        .filter(
          (inst) =>
            inst.regionId === region.id &&
            inst.enabled !== false &&
            region.accepts.includes(inst.extensionPoint),
        )
        .sort(byGrid)
      slots[region.id] = {
        regionId: region.id,
        title: region.title,
        accepts: region.accepts,
        instances: regionInstances,
        isEmpty: regionInstances.length === 0,
        render: () => regionInstances.map((inst) => renderOne(inst)),
        renderInstance: (inst) => renderOne(inst),
      }
    }
    return slots
  }

  function buildHostAPI(): LayoutHostAPI {
    return deps.hostActions
  }

  return { buildRegionSlots, buildHostAPI }
}
