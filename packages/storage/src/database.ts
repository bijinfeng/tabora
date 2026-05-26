import Dexie, { type Table } from "dexie"
import type { PluginInstance, PluginRecord, Workspace } from "@tabora/plugin-api"

export type PluginDataRow = {
  id: string
  pluginId: string
  instanceId?: string
  key: string
  value: unknown
  updatedAt: string
}

export class TaboraDatabase extends Dexie {
  plugins!: Table<PluginRecord, string>
  workspaces!: Table<Workspace, string>
  pluginInstances!: Table<PluginInstance, string>
  pluginData!: Table<PluginDataRow, string>

  constructor(name: string) {
    super(name)
    this.version(1).stores({
      plugins: "id, enabled, source",
      workspaces: "id, activeLayoutId, activeThemeId",
      pluginInstances: "id, pluginId, contributionId, regionId, enabled",
      pluginData: "id, pluginId, instanceId, key",
    })
  }
}

export function createTaboraDatabase(name = "tabora"): TaboraDatabase {
  return new TaboraDatabase(name)
}
