import type { TaboraDatabase, WorkspaceSnapshot } from "./database"

export type WorkspaceSnapshotRepository = {
  save(snapshot: WorkspaceSnapshot): Promise<void>
  getLast(workspaceId: string): Promise<WorkspaceSnapshot | undefined>
}

export function createWorkspaceSnapshotRepository(
  database: TaboraDatabase,
): WorkspaceSnapshotRepository {
  return {
    async save(snapshot) {
      await database.workspaceSnapshots.put(snapshot)
    },
    async getLast(workspaceId) {
      const snapshots = await database.workspaceSnapshots
        .where("workspaceId")
        .equals(workspaceId)
        .toArray()
      return snapshots.sort((left, right) => left.createdAt.localeCompare(right.createdAt)).at(-1)
    },
  }
}
