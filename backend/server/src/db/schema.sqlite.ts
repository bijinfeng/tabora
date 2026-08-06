import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

// better-auth 四表（SQLite dialect）+ admin 插件列。
// 字段与 @better-auth/cli 为 sqlite provider 生成的结构一致：
// id 为 text，时间为 integer(timestamp)，布尔为 integer(boolean)。

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  // admin 插件
  role: text("role"),
  banned: integer("banned", { mode: "boolean" }),
  banReason: text("ban_reason"),
  banExpires: integer("ban_expires", { mode: "timestamp" }),
})

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  // admin 插件
  impersonatedBy: text("impersonated_by"),
})

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
  scope: text("scope"),
  idToken: text("id_token"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
})

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
})

export const syncedRecord = sqliteTable("synced_record", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  recordType: text("record_type").notNull(),
  recordId: text("record_id").notNull(),
  data: text("data", { mode: "json" }),
  version: integer("version").notNull().default(1),
  deviceId: text("device_id").notNull(),
  deleted: integer("deleted", { mode: "boolean" }).notNull().default(false),
  recordUpdatedAt: integer("record_updated_at", { mode: "timestamp" }).notNull(),
})

export const attachmentPolicy = sqliteTable("attachment_policy", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  entityType: text("entity_type").notNull().unique(),
  mimeWhitelist: text("mime_whitelist", { mode: "json" }),
  maxSizeBytes: integer("max_size_bytes"),
})

export const attachmentFile = sqliteTable("attachment_file", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  filename: text("filename").notNull(),
  mime: text("mime").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  storageKey: text("storage_key").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
})

export const attachmentRef = sqliteTable("attachment_ref", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fileId: integer("file_id")
    .notNull()
    .references(() => attachmentFile.id, { onDelete: "cascade" }),
  uploadedBy: text("uploaded_by")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
})
