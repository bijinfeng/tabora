import { and, count, desc, eq, gte, lt, lte, type SQL } from "drizzle-orm"

export interface AuditLogRecord {
  id: number
  userId: string | null
  action: string
  resourceType: string | null
  resourceId: string | null
  details: string | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: Date
}

export interface CreateAuditLogInput {
  userId?: string | null
  action: string
  resourceType?: string | null
  resourceId?: string | null
  details?: string | null
  ipAddress?: string | null
  userAgent?: string | null
}

export interface AuditLogFilters {
  userId?: string | null
  action?: string | null
  resourceType?: string | null
  startDate?: Date | null
  endDate?: Date | null
}

/**
 * 审计日志查询层
 */
export function createAuditLogQueries(db: any, schema: { auditLog: any }) {
  const { auditLog } = schema

  async function create(input: CreateAuditLogInput): Promise<number> {
    const result = await db
      .insert(auditLog)
      .values({
        userId: input.userId || null,
        action: input.action,
        resourceType: input.resourceType || null,
        resourceId: input.resourceId || null,
        details: input.details || null,
        ipAddress: input.ipAddress || null,
        userAgent: input.userAgent || null,
        createdAt: new Date(),
      })
      .returning({ id: auditLog.id })

    return result[0].id
  }

  function buildWhere(filters: AuditLogFilters): SQL | undefined {
    const conds: SQL[] = []
    if (filters.userId) conds.push(eq(auditLog.userId, filters.userId))
    if (filters.action) conds.push(eq(auditLog.action, filters.action))
    if (filters.resourceType) conds.push(eq(auditLog.resourceType, filters.resourceType))
    if (filters.startDate) conds.push(gte(auditLog.createdAt, filters.startDate))
    if (filters.endDate) conds.push(lte(auditLog.createdAt, filters.endDate))
    return conds.length > 0 ? and(...conds) : undefined
  }

  async function list(filters: AuditLogFilters, limit = 50, offset = 0) {
    const where = buildWhere(filters)

    const rows = (await db
      .select()
      .from(auditLog)
      .where(where)
      .orderBy(desc(auditLog.createdAt))
      .limit(limit)
      .offset(offset)) as AuditLogRecord[]

    const totalRows = await db.select({ value: count() }).from(auditLog).where(where)

    return { rows, total: Number(totalRows[0]?.value ?? 0) }
  }

  async function getById(id: number): Promise<AuditLogRecord | null> {
    const rows = (await db
      .select()
      .from(auditLog)
      .where(eq(auditLog.id, id))
      .limit(1)) as AuditLogRecord[]

    return rows[0] ?? null
  }

  async function deleteOld(daysToKeep = 90): Promise<number> {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - daysToKeep)

    const result = await db
      .delete(auditLog)
      .where(lt(auditLog.createdAt, cutoff))
      .returning({ id: auditLog.id })

    return result.length
  }

  async function getRecentActions(limit = 10): Promise<AuditLogRecord[]> {
    return (await db
      .select()
      .from(auditLog)
      .orderBy(desc(auditLog.createdAt))
      .limit(limit)) as AuditLogRecord[]
  }

  return {
    create,
    list,
    getById,
    deleteOld,
    getRecentActions,
  }
}
