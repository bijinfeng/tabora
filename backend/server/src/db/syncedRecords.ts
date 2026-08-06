import { and, count, desc, eq, like, type SQL } from "drizzle-orm"

export type SyncedRecordRow = {
  id: string
  ownerId: string
  ownerEmail: string | null
  recordType: string
  recordId: string
  data: unknown
  version: number
  deviceId: string
  deleted: boolean
  recordUpdatedAt: string | Date
}

export type ListParams = {
  type?: string | undefined
  deleted?: boolean | undefined
  search?: string | undefined
  limit: number
  offset: number
}

/**
 * 同步记录查询（dialect 无关）。drizzle 操作符对 sqlite/pg 通用，
 * 两个 dialect 传入各自的 db 与表对象即可复用同一套查询逻辑。
 */
export function createSyncedRecordQueries(db: any, tables: { syncedRecord: any; user: any }) {
  const { syncedRecord: r, user: u } = tables

  const buildWhere = (p: ListParams): SQL | undefined => {
    const conds: SQL[] = []
    if (p.type) conds.push(eq(r.recordType, p.type))
    if (p.deleted !== undefined) conds.push(eq(r.deleted, p.deleted))
    if (p.search) conds.push(like(r.recordId, `%${p.search}%`))
    return conds.length > 0 ? and(...conds) : undefined
  }

  return {
    async list(p: ListParams): Promise<{ rows: SyncedRecordRow[]; total: number }> {
      const where = buildWhere(p)
      const rows = (await db
        .select({
          id: r.id,
          ownerId: r.ownerId,
          ownerEmail: u.email,
          recordType: r.recordType,
          recordId: r.recordId,
          data: r.data,
          version: r.version,
          deviceId: r.deviceId,
          deleted: r.deleted,
          recordUpdatedAt: r.recordUpdatedAt,
        })
        .from(r)
        .leftJoin(u, eq(r.ownerId, u.id))
        .where(where)
        .orderBy(desc(r.recordUpdatedAt))
        .limit(p.limit)
        .offset(p.offset)) as SyncedRecordRow[]
      const totalRows = await db.select({ value: count() }).from(r).where(where)
      return { rows, total: Number(totalRows[0]?.value ?? 0) }
    },

    async countsByType(): Promise<Record<string, number>> {
      const rows = (await db
        .select({ type: r.recordType, value: count() })
        .from(r)
        .groupBy(r.recordType)) as Array<{ type: string; value: number }>
      return Object.fromEntries(rows.map((row) => [row.type, Number(row.value)]))
    },

    async countTombstones(): Promise<number> {
      const rows = await db.select({ value: count() }).from(r).where(eq(r.deleted, true))
      return Number(rows[0]?.value ?? 0)
    },

    async remove(id: string): Promise<void> {
      await db.delete(r).where(eq(r.id, id))
    },
  }
}

export type SyncedRecordQueries = ReturnType<typeof createSyncedRecordQueries>
