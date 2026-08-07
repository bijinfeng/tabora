import { and, asc, count, desc, eq, gt, like, type SQL } from "drizzle-orm"

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

    async getById(id: string): Promise<SyncedRecordRow | null> {
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
        .where(eq(r.id, id))
        .limit(1)) as SyncedRecordRow[]
      return rows[0] ?? null
    },

    async remove(id: string): Promise<void> {
      await db.delete(r).where(eq(r.id, id))
    },

    // —— 客户端同步（owner scoped）——

    async findOwned(
      ownerId: string,
      recordType: string,
      recordId: string,
    ): Promise<OwnedRow | null> {
      const rows = (await db
        .select()
        .from(r)
        .where(and(eq(r.ownerId, ownerId), eq(r.recordType, recordType), eq(r.recordId, recordId)))
        .limit(1)) as OwnedRow[]
      return rows[0] ?? null
    },

    async upsertOwned(input: {
      id: string
      ownerId: string
      recordType: string
      recordId: string
      data: unknown
      version: number
      deviceId: string
      deleted: boolean
      recordUpdatedAt: Date
    }): Promise<void> {
      const existing = await db
        .select({ id: r.id })
        .from(r)
        .where(
          and(
            eq(r.ownerId, input.ownerId),
            eq(r.recordType, input.recordType),
            eq(r.recordId, input.recordId),
          ),
        )
        .limit(1)
      const values = {
        ownerId: input.ownerId,
        recordType: input.recordType,
        recordId: input.recordId,
        data: input.deleted ? null : input.data,
        version: input.version,
        deviceId: input.deviceId,
        deleted: input.deleted,
        recordUpdatedAt: input.recordUpdatedAt,
      }
      if (existing[0]) {
        await db.update(r).set(values).where(eq(r.id, existing[0].id))
      } else {
        await db.insert(r).values({ id: input.id, ...values })
      }
    },

    async pullOwnedSince(
      ownerId: string,
      sinceMs: number | null,
      limit: number,
    ): Promise<OwnedRow[]> {
      const conds: SQL[] = [eq(r.ownerId, ownerId)]
      if (sinceMs !== null) conds.push(gt(r.recordUpdatedAt, new Date(sinceMs)))
      return (await db
        .select()
        .from(r)
        .where(and(...conds))
        .orderBy(asc(r.recordUpdatedAt))
        .limit(limit)) as OwnedRow[]
    },
  }
}

export type OwnedRow = {
  id: string
  ownerId: string
  recordType: string
  recordId: string
  data: unknown
  version: number
  deviceId: string
  deleted: boolean
  recordUpdatedAt: string | Date
}

export type SyncedRecordQueries = ReturnType<typeof createSyncedRecordQueries>
