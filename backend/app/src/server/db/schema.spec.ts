// 单一事实源：所有表与列在此定义一次，派生出 sqlite/postgres 的 drizzle 表与建表 DDL。
// 改列只改这里。better-auth 依赖 user/session/account/verification 的字段名，勿改键名。

export type ColumnKind = "textPk" | "autoPk" | "text" | "bool" | "int" | "timestamp" | "json"

export type ColumnSpec = {
  kind: ColumnKind
  notNull?: boolean
  unique?: boolean
  default?: boolean | number
  references?: { table: string; column: string; onDelete?: "cascade" }
}

export type TableSpec = {
  /** camelCase 键；DB 名自动转 snake_case。 */
  columns: Record<string, ColumnSpec>
  indexes?: Array<{ columns: string[] }>
}

const userRef = (onDelete: "cascade" = "cascade") => ({
  references: { table: "user", column: "id", onDelete },
})

export const schemaSpec: Record<string, TableSpec> = {
  user: {
    columns: {
      id: { kind: "textPk" },
      name: { kind: "text", notNull: true },
      email: { kind: "text", notNull: true, unique: true },
      emailVerified: { kind: "bool", notNull: true, default: false },
      image: { kind: "text" },
      createdAt: { kind: "timestamp", notNull: true },
      updatedAt: { kind: "timestamp", notNull: true },
      role: { kind: "text" },
      banned: { kind: "bool" },
      banReason: { kind: "text" },
      banExpires: { kind: "timestamp" },
    },
  },
  session: {
    columns: {
      id: { kind: "textPk" },
      userId: { kind: "text", notNull: true, ...userRef() },
      token: { kind: "text", notNull: true, unique: true },
      expiresAt: { kind: "timestamp", notNull: true },
      ipAddress: { kind: "text" },
      userAgent: { kind: "text" },
      createdAt: { kind: "timestamp", notNull: true },
      updatedAt: { kind: "timestamp", notNull: true },
      impersonatedBy: { kind: "text" },
    },
  },
  account: {
    columns: {
      id: { kind: "textPk" },
      userId: { kind: "text", notNull: true, ...userRef() },
      accountId: { kind: "text", notNull: true },
      providerId: { kind: "text", notNull: true },
      accessToken: { kind: "text" },
      refreshToken: { kind: "text" },
      accessTokenExpiresAt: { kind: "timestamp" },
      refreshTokenExpiresAt: { kind: "timestamp" },
      scope: { kind: "text" },
      idToken: { kind: "text" },
      password: { kind: "text" },
      createdAt: { kind: "timestamp", notNull: true },
      updatedAt: { kind: "timestamp", notNull: true },
    },
  },
  verification: {
    columns: {
      id: { kind: "textPk" },
      identifier: { kind: "text", notNull: true },
      value: { kind: "text", notNull: true },
      expiresAt: { kind: "timestamp", notNull: true },
      createdAt: { kind: "timestamp" },
      updatedAt: { kind: "timestamp" },
    },
  },
  syncedRecord: {
    columns: {
      id: { kind: "textPk" },
      ownerId: { kind: "text", notNull: true, ...userRef() },
      recordType: { kind: "text", notNull: true },
      recordId: { kind: "text", notNull: true },
      data: { kind: "json" },
      version: { kind: "int", notNull: true, default: 1 },
      deviceId: { kind: "text", notNull: true },
      deleted: { kind: "bool", notNull: true, default: false },
      recordUpdatedAt: { kind: "timestamp", notNull: true },
    },
    indexes: [{ columns: ["ownerId"] }, { columns: ["recordType"] }],
  },
  attachmentPolicy: {
    columns: {
      id: { kind: "autoPk" },
      entityType: { kind: "text", notNull: true, unique: true },
      mimeWhitelist: { kind: "json" },
      maxSizeBytes: { kind: "int" },
    },
  },
  attachmentFile: {
    columns: {
      id: { kind: "autoPk" },
      filename: { kind: "text", notNull: true },
      mime: { kind: "text", notNull: true },
      sizeBytes: { kind: "int", notNull: true },
      storageKey: { kind: "text", notNull: true },
      createdAt: { kind: "timestamp", notNull: true },
    },
  },
  attachmentRef: {
    columns: {
      id: { kind: "autoPk" },
      fileId: {
        kind: "int",
        notNull: true,
        references: { table: "attachmentFile", column: "id", onDelete: "cascade" },
      },
      uploadedBy: { kind: "text", notNull: true, ...userRef() },
      entityType: { kind: "text", notNull: true },
      entityId: { kind: "text", notNull: true },
    },
    indexes: [{ columns: ["fileId"] }],
  },
  setting: {
    columns: {
      key: { kind: "textPk" },
      value: { kind: "json" },
      updatedAt: { kind: "timestamp", notNull: true },
    },
  },
  emailQueue: {
    columns: {
      id: { kind: "autoPk" },
      to: { kind: "text", notNull: true },
      subject: { kind: "text", notNull: true },
      html: { kind: "text", notNull: true },
      text: { kind: "text" },
      status: { kind: "text", notNull: true },
      attempts: { kind: "int", notNull: true, default: 0 },
      maxAttempts: { kind: "int", notNull: true, default: 3 },
      lastError: { kind: "text" },
      sentAt: { kind: "timestamp" },
      createdAt: { kind: "timestamp", notNull: true },
      scheduledFor: { kind: "timestamp" },
    },
    indexes: [{ columns: ["status"] }, { columns: ["scheduledFor"] }],
  },

  auditLog: {
    columns: {
      id: { kind: "autoPk" },
      userId: { kind: "text" },
      action: { kind: "text", notNull: true },
      resourceType: { kind: "text" },
      resourceId: { kind: "text" },
      details: { kind: "text" },
      ipAddress: { kind: "text" },
      userAgent: { kind: "text" },
      createdAt: { kind: "timestamp", notNull: true },
    },
    indexes: [{ columns: ["userId"] }, { columns: ["action"] }, { columns: ["createdAt"] }],
  },
}

/** camelCase → snake_case。 */
export function toSnake(name: string): string {
  return name.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`)
}
