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

  async function list(filters: AuditLogFilters, limit = 50, offset = 0) {
    let query = db.select().from(auditLog)

    const conditions: Array<(eb: any) => any> = []
    if (filters.userId) {
      conditions.push((eb: any) => eb.eq(auditLog.userId, filters.userId))
    }
    if (filters.action) {
      conditions.push((eb: any) => eb.eq(auditLog.action, filters.action))
    }
    if (filters.resourceType) {
      conditions.push((eb: any) => eb.eq(auditLog.resourceType, filters.resourceType))
    }
    if (filters.startDate) {
      conditions.push((eb: any) => eb.gte(auditLog.createdAt, filters.startDate))
    }
    if (filters.endDate) {
      conditions.push((eb: any) => eb.lte(auditLog.createdAt, filters.endDate))
    }

    if (conditions.length > 0) {
      query = query.where((eb: any) => eb.and(...conditions.map((fn) => fn(eb))))
    }

    const rows = await query
      .orderBy((eb: any) => eb.desc(auditLog.createdAt))
      .limit(limit)
      .offset(offset)

    let countQuery = db.select({ count: (eb: any) => eb.count() }).from(auditLog)
    if (conditions.length > 0) {
      countQuery = countQuery.where((eb: any) => eb.and(...conditions.map((fn) => fn(eb))))
    }
    const total = await countQuery.then((rows: any[]) => Number(rows[0].count))

    return { rows, total }
  }

  async function getById(id: number): Promise<AuditLogRecord | null> {
    const rows = await db
      .select()
      .from(auditLog)
      .where((eb: any) => eb.eq(auditLog.id, id))
      .limit(1)

    return rows[0] || null
  }

  async function deleteOld(daysToKeep = 90): Promise<number> {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - daysToKeep)

    const result = await db
      .delete(auditLog)
      .where((eb: any) => eb.lt(auditLog.createdAt, cutoff))
      .returning({ id: auditLog.id })

    return result.length
  }

  async function getRecentActions(limit = 10): Promise<AuditLogRecord[]> {
    return db
      .select()
      .from(auditLog)
      .orderBy((eb: any) => eb.desc(auditLog.createdAt))
      .limit(limit)
  }

  return {
    create,
    list,
    getById,
    deleteOld,
    getRecentActions,
  }
}
