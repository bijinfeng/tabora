import { workspaceSchema, type Workspace } from "@tabora/plugin-api"
import type { TaboraDatabase } from "./database"
import { migrateWorkspaceContributionRefs } from "./workspaceIdentityMigration"

export type WorkspaceRepository = {
  get(id: string): Promise<Workspace | undefined>
  getAll(): Promise<Workspace[]>
  save(workspace: Workspace): Promise<void>
  remove(id: string): Promise<void>
}

export function createWorkspaceRepository(database: TaboraDatabase): WorkspaceRepository {
  async function normalize(value: unknown): Promise<Workspace | undefined> {
    if (!value) return undefined
    const alreadyCanonical = workspaceSchema.safeParse(value).success
    const migrated = migrateWorkspaceContributionRefs(
      value,
      (await database.plugins.toArray()).map((record) => record.manifest),
    )
    if (!alreadyCanonical) await database.workspaces.put(migrated)
    return migrated
  }

  return {
    async get(id) {
      return normalize(await database.workspaces.get(id))
    },
    async getAll() {
      const rows = await database.workspaces.toArray()
      return Promise.all(rows.map(normalize)).then((workspaces) =>
        workspaces.filter((workspace): workspace is Workspace => Boolean(workspace)),
      )
    },
    async save(workspace) {
      await database.workspaces.put(workspace)
    },
    async remove(id) {
      await database.workspaces.delete(id)
    },
  }
}
