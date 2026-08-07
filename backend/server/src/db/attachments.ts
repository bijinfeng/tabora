import { and, count, desc, eq, sql } from "drizzle-orm"

export type PolicyRow = {
  id: number
  entityType: string
  mimeWhitelist: string[] | null
  maxSizeBytes: number | null
}

export type FileRow = {
  id: number
  filename: string
  mime: string
  sizeBytes: number
  storageKey: string
  createdAt: string | Date
}

export type NewFile = { filename: string; mime: string; sizeBytes: number; storageKey: string }

/** 附件查询（dialect 无关）：policy / file / ref。 */
export function createAttachmentQueries(
  db: any,
  tables: { attachmentPolicy: any; attachmentFile: any; attachmentRef: any },
) {
  const { attachmentPolicy: p, attachmentFile: f, attachmentRef: ref } = tables

  return {
    async getPolicy(entityType: string): Promise<PolicyRow | null> {
      const rows = (await db
        .select()
        .from(p)
        .where(eq(p.entityType, entityType))
        .limit(1)) as PolicyRow[]
      return rows[0] ?? null
    },

    async getAllPolicies(): Promise<PolicyRow[]> {
      return (await db.select().from(p).orderBy(p.entityType)) as PolicyRow[]
    },

    async listPolicies(): Promise<PolicyRow[]> {
      return (await db.select().from(p).orderBy(p.entityType)) as PolicyRow[]
    },

    async createPolicy(
      entityType: string,
      mimeWhitelist: string[] | null,
      maxSizeBytes: number | null,
    ): Promise<void> {
      await db.insert(p).values({ entityType, mimeWhitelist, maxSizeBytes })
    },

    async updatePolicy(
      entityType: string,
      updates: { mimeWhitelist?: string[] | null; maxSizeBytes?: number | null },
    ): Promise<void> {
      await db.update(p).set(updates).where(eq(p.entityType, entityType))
    },

    async deletePolicy(entityType: string): Promise<void> {
      await db.delete(p).where(eq(p.entityType, entityType))
    },

    async upsertPolicy(input: PolicyRow): Promise<void> {
      const existing = await db
        .select({ id: p.id })
        .from(p)
        .where(eq(p.entityType, input.entityType))
        .limit(1)
      const values = {
        entityType: input.entityType,
        mimeWhitelist: input.mimeWhitelist,
        maxSizeBytes: input.maxSizeBytes,
      }
      if (existing[0]) {
        await db.update(p).set(values).where(eq(p.id, existing[0].id))
      } else {
        await db.insert(p).values(values)
      }
    },

    async createFile(input: NewFile): Promise<number> {
      const rows = await db
        .insert(f)
        .values({ ...input, createdAt: new Date() })
        .returning({ id: f.id })
      return Number(rows[0].id)
    },

    async getFile(id: number): Promise<FileRow | null> {
      const rows = (await db.select().from(f).where(eq(f.id, id)).limit(1)) as FileRow[]
      return rows[0] ?? null
    },

    async refsCount(fileId: number): Promise<number> {
      const rows = await db.select({ value: count() }).from(ref).where(eq(ref.fileId, fileId))
      return Number(rows[0]?.value ?? 0)
    },

    async ownsRef(fileId: number, userId: string): Promise<boolean> {
      const rows = await db
        .select({ id: ref.id })
        .from(ref)
        .where(and(eq(ref.fileId, fileId), eq(ref.uploadedBy, userId)))
        .limit(1)
      return Boolean(rows[0])
    },

    async addRefIfMissing(input: {
      fileId: number
      uploadedBy: string
      entityType: string
      entityId: string
    }): Promise<void> {
      const existing = await db
        .select({ id: ref.id })
        .from(ref)
        .where(
          and(
            eq(ref.fileId, input.fileId),
            eq(ref.uploadedBy, input.uploadedBy),
            eq(ref.entityType, input.entityType),
            eq(ref.entityId, input.entityId),
          ),
        )
        .limit(1)
      if (!existing[0]) await db.insert(ref).values(input)
    },

    async removeRef(input: {
      fileId: number
      uploadedBy: string
      entityType: string
      entityId: string
    }): Promise<void> {
      await db
        .delete(ref)
        .where(
          and(
            eq(ref.fileId, input.fileId),
            eq(ref.uploadedBy, input.uploadedBy),
            eq(ref.entityType, input.entityType),
            eq(ref.entityId, input.entityId),
          ),
        )
    },

    async listFilesWithRefCount(
      limit: number,
      offset: number,
    ): Promise<{ rows: Array<FileRow & { refsCount: number }>; total: number }> {
      const rows = (await db
        .select({
          id: f.id,
          filename: f.filename,
          mime: f.mime,
          sizeBytes: f.sizeBytes,
          storageKey: f.storageKey,
          createdAt: f.createdAt,
          refsCount: sql<number>`count(${ref.id})`,
        })
        .from(f)
        .leftJoin(ref, eq(ref.fileId, f.id))
        .groupBy(f.id)
        .orderBy(desc(f.createdAt))
        .limit(limit)
        .offset(offset)) as Array<FileRow & { refsCount: number }>
      const totalRows = await db.select({ value: count() }).from(f)
      return {
        rows: rows.map((r) => ({ ...r, refsCount: Number(r.refsCount) })),
        total: Number(totalRows[0]?.value ?? 0),
      }
    },

    async deleteFile(id: number): Promise<void> {
      await db.delete(f).where(eq(f.id, id))
    },
  }
}

export type AttachmentQueries = ReturnType<typeof createAttachmentQueries>
