import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { accessAttachment, bindAttachment, uploadAttachment } from "./attachmentRoutes"
import { createLocalAttachmentStorage } from "./attachments/storage"
import { buildTables } from "./db/schemaFactory"
import { createSqliteDb } from "./db/sqlite"

type Handle = ReturnType<typeof createSqliteDb>

const userTable = (buildTables("sqlite") as { user: unknown }).user

/** 直接写入 user 行以满足 attachmentRef.uploadedBy 外键约束（生产由 better-auth 创建）。 */
async function seedUser(handle: Handle, id: string): Promise<void> {
  const now = new Date()
  await handle.db.insert(userTable as never).values({
    id,
    name: id,
    email: `${id}@example.com`,
    emailVerified: false,
    createdAt: now,
    updatedAt: now,
  } as never)
}

function makeFile(name: string, mime: string, bytes: number): File {
  return new File([new Uint8Array(bytes)], name, { type: mime })
}

describe("attachment handlers", () => {
  let handle: Handle
  let storageDir: string
  let storage: ReturnType<typeof createLocalAttachmentStorage>

  beforeEach(async () => {
    handle = createSqliteDb(":memory:")
    handle.migrate()
    await seedUser(handle, "user-1")
    await seedUser(handle, "intruder")
    storageDir = mkdtempSync(join(tmpdir(), "tabora-att-"))
    storage = createLocalAttachmentStorage(storageDir)
  })

  afterEach(() => {
    rmSync(storageDir, { recursive: true, force: true })
  })

  it("缺少 file 或 entity_type 返回 400", async () => {
    const res = await uploadAttachment(handle, storage, { file: null, entityType: "" })
    expect(res.status).toBe(400)
  })

  it("上传成功返回 file_id 并可绑定后访问", async () => {
    const uploaded = await uploadAttachment(handle, storage, {
      file: makeFile("a.png", "image/png", 16),
      entityType: "note",
    })
    expect(uploaded.status).toBe(201)
    const fileId = (uploaded.body as { data: { file_id: number } }).data.file_id

    const bound = await bindAttachment(handle, "user-1", fileId, {
      entity_type: "note",
      entity_id: "note-1",
    })
    expect(bound.status).toBe(200)

    const access = await accessAttachment(handle, storage, "user-1", fileId)
    expect(access.status).toBe(200)
    expect((access.body as { data: { asset_url: string | null } }).data.asset_url).toBeTruthy()
  })

  it("未绑定引用的用户不能访问（404）", async () => {
    const uploaded = await uploadAttachment(handle, storage, {
      file: makeFile("a.png", "image/png", 16),
      entityType: "note",
    })
    const fileId = (uploaded.body as { data: { file_id: number } }).data.file_id
    await bindAttachment(handle, "user-1", fileId, { entity_type: "note", entity_id: "note-1" })

    const access = await accessAttachment(handle, storage, "intruder", fileId)
    expect(access.status).toBe(404)
  })

  it("超出 entity 策略大小上限时拒绝上传", async () => {
    await handle.attachments.createPolicy("note", null, 8)
    const res = await uploadAttachment(handle, storage, {
      file: makeFile("big.png", "image/png", 32),
      entityType: "note",
    })
    expect(res.status).toBe(400)
  })
})
