import type { Workspace } from "@tabora/plugin-api"
import type { TaboraDatabase } from "./database"

export type WorkspaceRepository = {
  get(id: string): Promise<Workspace | undefined>
  save(workspace: Workspace): Promise<void>
}

export function createWorkspaceRepository(database: TaboraDatabase): WorkspaceRepository {
  return {
    get(id) {
      return database.workspaces.get(id)
    },
    async save(workspace) {
      await database.workspaces.put(workspace)
    },
  }
}
