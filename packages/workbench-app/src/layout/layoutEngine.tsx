import type { JSX } from "solid-js"
import type { LayoutHostAPI, LayoutInstance, PluginInstance, RegionSlot } from "@tabora/plugin-api"
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
  function renderOne(instance: LayoutInstance, persisted: PluginInstance): JSX.Element {
    const renderable: PluginInstance = { ...persisted, ...instance }
    if (renderable.contribution.kind === "search") {
      return deps.instanceRenderer.renderSearch(renderable)
    }
    return deps.instanceRenderer.renderWidget(renderable)
  }

  function buildRegionSlots(
    layoutId: string,
    instances: PluginInstance[],
  ): Record<string, RegionSlot<JSX.Element>> {
    const layout = deps.catalog.findLayoutContribution(layoutId)
    const persistedInstancesById = new Map(instances.map((instance) => [instance.id, instance]))
    const slots: Record<string, RegionSlot<JSX.Element>> = {}
    for (const region of layout?.regions ?? []) {
      const regionInstances = instances
        .filter(
          (inst) =>
            inst.regionId === region.id &&
            inst.enabled !== false &&
            region.accepts.includes(inst.contribution.kind),
        )
        .sort(byGrid)
      slots[region.id] = {
        regionId: region.id,
        title: region.title,
        accepts: region.accepts,
        instances: regionInstances,
        isEmpty: regionInstances.length === 0,
        render: () => regionInstances.map((inst) => renderOne(inst, inst)),
        renderInstance: (inst) => {
          const persisted = persistedInstancesById.get(inst.id)
          if (!persisted) {
            throw new Error(
              `Layout requested an instance outside the current workspace: ${inst.id}`,
            )
          }
          return renderOne(inst, persisted)
        },
      }
    }
    return slots
  }

  function buildHostAPI(): LayoutHostAPI {
    return deps.hostActions
  }

  return { buildRegionSlots, buildHostAPI }
}
