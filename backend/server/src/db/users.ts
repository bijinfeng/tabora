import { eq } from "drizzle-orm"

/**
 * 用户管理查询层
 */
export function createUserQueries(db: any, schema: { user: any; account: any }) {
  const { user, account } = schema

  async function getAll(limit = 100, offset = 0) {
    const rows = await db.select().from(user).orderBy(user.createdAt).limit(limit).offset(offset)

    const total = await db
      .select({ count: (eb: any) => eb.count() })
      .from(user)
      .then((rows: any[]) => Number(rows[0].count))

    return { rows, total }
  }

  async function getById(id: string) {
    const rows = await db.select().from(user).where(eq(user.id, id)).limit(1)
    return rows[0] || null
  }

  async function getByEmail(email: string) {
    const rows = await db.select().from(user).where(eq(user.email, email)).limit(1)
    return rows[0] || null
  }

  async function updateUser(id: string, data: { name?: string; email?: string; role?: string }) {
    await db.update(user).set(data).where(eq(user.id, id))
  }

  async function banUser(id: string, reason?: string, expiresAt?: Date) {
    await db
      .update(user)
      .set({
        banned: true,
        banReason: reason || null,
        banExpires: expiresAt || null,
      })
      .where(eq(user.id, id))
  }

  async function unbanUser(id: string) {
    await db
      .update(user)
      .set({
        banned: false,
        banReason: null,
        banExpires: null,
      })
      .where(eq(user.id, id))
  }

  async function deleteUser(id: string) {
    // 删除用户的所有 account 记录
    await db.delete(account).where(eq(account.userId, id))
    // 删除用户
    await db.delete(user).where(eq(user.id, id))
  }

  return {
    getAll,
    getById,
    getByEmail,
    updateUser,
    banUser,
    unbanUser,
    deleteUser,
  }
}
