import type { Workspace } from "@tabora/plugin-api"
import type { TaboraDatabase } from "./database"

export type WorkspaceRepository = {
  get(id: string): Promise<Workspace | undefined>
  getAll(): Promise<Workspace[]>
  save(workspace: Workspace): Promise<void>
  remove(id: string): Promise<void>
}

export function createWorkspaceRepository(database: TaboraDatabase): WorkspaceRepository {
  return {
    get(id) {
      return database.workspaces.get(id)
    },
    getAll() {
      return database.workspaces.toArray()
    },
    async save(workspace) {
      await database.workspaces.put(workspace)
    },
    async remove(id) {
      await database.workspaces.delete(id)
    },
  }
}
