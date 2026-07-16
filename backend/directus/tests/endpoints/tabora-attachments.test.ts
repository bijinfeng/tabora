import { describe, expect, it, vi } from "vitest"
import {
  createContext,
  createDatabase,
  createResponse,
  createRouter,
  findRoute,
  firstForwardedError,
  registerExtension,
} from "./tabora-test-kit"

const FILE_ONE = "11111111-1111-4111-8111-111111111111"
const FILE_TWO = "22222222-2222-4222-8222-222222222222"

describe("tabora attachment endpoints", () => {
  it("注册完整的附件路由", async () => {
    const router = createRouter()
    const { context } = createContext()
    await registerExtension(router, context)

    expect(router.routes.map(({ method, path }) => `${method}:${path}`)).toEqual(
      expect.arrayContaining([
        "post:/attachments/prepare",
        "post:/attachments/commit",
        "get:/attachments/:id/access",
        "post:/attachments/:id/bind",
        "post:/attachments/:id/unbind",
        "delete:/attachments/:id",
        "get:/attachments/:id/meta",
      ]),
    )
  })

  it("prepare 使用结构化校验并返回匹配的上传 policy", async () => {
    const database = createDatabase({
      attachment_policies: [
        {
          entity_type: "note",
          mime_whitelist: ["image/png"],
          max_size_bytes: 2048,
          internal_note: "must-not-leak",
        },
      ],
    })
    const router = createRouter()
    const { context } = createContext({ database })
    await registerExtension(router, context)

    const response = createResponse()
    await findRoute(router.routes, "post", "/attachments/prepare").handler(
      {
        accountability: { user: "user-1" },
        body: {
          entity_type: "note",
          mime_type: "image/png",
          size_bytes: 1024,
          filename: "cover.png",
        },
      },
      response,
      vi.fn(),
    )

    expect(response.body).toEqual({
      data: {
        entity_type: "note",
        filename: "cover.png",
        visibility: "private",
        upload: {
          method: "directus-files",
          endpoint: "/files",
        },
        policy: {
          entity_type: "note",
          mime_whitelist: ["image/png"],
          max_size_bytes: 2048,
        },
      },
    })
    expect(JSON.stringify(response.body)).not.toContain("internal_note")
  })

  it("prepare 拒绝无效字段、MIME 和超限文件", async () => {
    const database = createDatabase({
      attachment_policies: [
        {
          entity_type: "note",
          mime_whitelist: ["image/png"],
          max_size_bytes: 2048,
        },
      ],
    })
    const router = createRouter()
    const { context } = createContext({ database })
    await registerExtension(router, context)
    const route = findRoute(router.routes, "post", "/attachments/prepare")

    const invalidNext = vi.fn()
    await route.handler(
      {
        accountability: { user: "user-1" },
        body: { entity_type: "", mime_type: "image/png", size_bytes: 0, filename: "" },
      },
      createResponse(),
      invalidNext,
    )
    expect(firstForwardedError(invalidNext).code).toBe("INVALID_PAYLOAD")

    const mimeNext = vi.fn()
    await route.handler(
      {
        accountability: { user: "user-1" },
        body: {
          entity_type: "note",
          mime_type: "image/jpeg",
          size_bytes: 1024,
          filename: "cover.jpg",
        },
      },
      createResponse(),
      mimeNext,
    )
    expect(firstForwardedError(mimeNext).code).toBe("INVALID_PAYLOAD")

    const sizeNext = vi.fn()
    await route.handler(
      {
        accountability: { user: "user-1" },
        body: {
          entity_type: "note",
          mime_type: "image/png",
          size_bytes: 4096,
          filename: "cover.png",
        },
      },
      createResponse(),
      sizeNext,
    )
    expect(firstForwardedError(sizeNext).code).toBe("INVALID_PAYLOAD")
  })

  it.each([
    {
      field: "mime_whitelist",
      policy: {
        entity_type: "note",
        mime_whitelist: { unexpected: "shape" },
        max_size_bytes: 2048,
      },
    },
    {
      field: "max_size_bytes",
      policy: {
        entity_type: "note",
        mime_whitelist: ["image/png"],
        max_size_bytes: "not-a-number",
      },
    },
  ])("prepare 对损坏的 policy 字段 $field fail closed", async ({ policy }) => {
    const database = createDatabase({
      attachment_policies: [policy],
    })
    const router = createRouter()
    const { context } = createContext({ database })
    await registerExtension(router, context)

    const next = vi.fn()
    await findRoute(router.routes, "post", "/attachments/prepare").handler(
      {
        accountability: { user: "user-1" },
        body: {
          entity_type: "note",
          mime_type: "image/png",
          size_bytes: 1024,
          filename: "cover.png",
        },
      },
      createResponse(),
      next,
    )

    expect(firstForwardedError(next).code).toBe("INTERNAL_SERVER_ERROR")
  })

  it("commit 拒绝绑定其他用户上传的文件", async () => {
    const database = createDatabase({
      directus_files: [{ id: FILE_ONE, uploaded_by: "user-2" }],
      attachment_refs: [],
    })
    const router = createRouter()
    const { context } = createContext({ database })
    await registerExtension(router, context)

    const next = vi.fn()
    await findRoute(router.routes, "post", "/attachments/commit").handler(
      {
        accountability: { user: "user-1" },
        body: { file_id: FILE_ONE, entity_type: "note", entity_id: "note-1" },
      },
      createResponse(),
      next,
    )

    expect(firstForwardedError(next).code).toBe("ATTACHMENT_NOT_FOUND")
    expect(database.__state.attachment_refs).toEqual([])
  })

  it("commit 会按真实文件元数据再次强制执行 policy", async () => {
    const database = createDatabase({
      directus_files: [
        {
          id: FILE_ONE,
          uploaded_by: "user-1",
          type: "image/jpeg",
          filesize: 4096,
        },
      ],
      attachment_policies: [
        {
          entity_type: "note",
          mime_whitelist: ["image/png"],
          max_size_bytes: 2048,
        },
      ],
      attachment_refs: [],
    })
    const router = createRouter()
    const { context } = createContext({ database })
    await registerExtension(router, context)

    const next = vi.fn()
    await findRoute(router.routes, "post", "/attachments/commit").handler(
      {
        accountability: { user: "user-1" },
        body: { file_id: FILE_ONE, entity_type: "note", entity_id: "note-1" },
      },
      createResponse(),
      next,
    )

    expect(firstForwardedError(next).code).toBe("INVALID_PAYLOAD")
    expect(database.__state.attachment_refs).toEqual([])
  })

  it("commit 在 policy 限制大小时拒绝缺失的真实 filesize", async () => {
    const database = createDatabase({
      directus_files: [
        {
          id: FILE_ONE,
          uploaded_by: "user-1",
          type: "image/png",
          filesize: null,
        },
      ],
      attachment_policies: [
        {
          entity_type: "note",
          mime_whitelist: ["image/png"],
          max_size_bytes: 2048,
        },
      ],
      attachment_refs: [],
    })
    const router = createRouter()
    const { context } = createContext({ database })
    await registerExtension(router, context)

    const next = vi.fn()
    await findRoute(router.routes, "post", "/attachments/commit").handler(
      {
        accountability: { user: "user-1" },
        body: { file_id: FILE_ONE, entity_type: "note", entity_id: "note-1" },
      },
      createResponse(),
      next,
    )

    expect(firstForwardedError(next).code).toBe("INVALID_PAYLOAD")
    expect(database.__state.attachment_refs).toEqual([])
  })

  it("commit 不会把 FilesService 内部故障伪装成附件不存在", async () => {
    const failure = new Error("database connection lost")
    const database = createDatabase({
      directus_files: [{ id: FILE_ONE, uploaded_by: "user-1" }],
      attachment_refs: [],
    })
    const router = createRouter()
    const { context } = createContext({
      database,
      serviceOverrides: {
        readFile: async () => {
          throw failure
        },
      },
    })
    await registerExtension(router, context)

    const next = vi.fn()
    await findRoute(router.routes, "post", "/attachments/commit").handler(
      {
        accountability: { user: "user-1" },
        body: { file_id: FILE_ONE, entity_type: "note", entity_id: "note-1" },
      },
      createResponse(),
      next,
    )

    expect(next).toHaveBeenCalledWith(failure)
    expect(database.__state.attachment_refs).toEqual([])
  })

  it("commit 对同一 owner ref 幂等并按当前用户计数", async () => {
    const database = createDatabase({
      directus_files: [{ id: FILE_ONE, uploaded_by: "user-1" }],
      attachment_refs: [
        {
          id: 1,
          file_id: FILE_ONE,
          owner_user_id: "user-2",
          entity_type: "note",
          entity_id: "other-note",
        },
      ],
    })
    const router = createRouter()
    const { context } = createContext({ database })
    await registerExtension(router, context)
    const route = findRoute(router.routes, "post", "/attachments/commit")
    const request = {
      accountability: { user: "user-1" },
      body: { file_id: FILE_ONE, entity_type: "note", entity_id: "note-1" },
    }

    const firstResponse = createResponse()
    await route.handler(request, firstResponse, vi.fn())
    const secondResponse = createResponse()
    await route.handler(request, secondResponse, vi.fn())

    expect(firstResponse.body).toEqual({
      data: {
        file_id: FILE_ONE,
        entity_type: "note",
        entity_id: "note-1",
        visibility: "private",
        refs_count: 1,
      },
    })
    expect(secondResponse.body).toEqual(firstResponse.body)
    expect(database.__state.attachment_refs).toHaveLength(2)
    expect(database.transaction).toHaveBeenCalledTimes(2)
    expect(database.__transactions).toHaveLength(2)
    for (const trx of database.__transactions) {
      expect(trx.__forUpdate).toHaveBeenCalled()
    }
  })

  it("access 仅允许拥有 ref 的用户访问", async () => {
    const database = createDatabase({
      directus_files: [{ id: FILE_ONE, uploaded_by: "user-1" }],
      attachment_refs: [
        {
          id: 1,
          file_id: FILE_ONE,
          owner_user_id: "user-1",
          entity_type: "note",
          entity_id: "note-1",
        },
      ],
    })
    const router = createRouter()
    const { context } = createContext({ database })
    await registerExtension(router, context)
    const route = findRoute(router.routes, "get", "/attachments/:id/access")

    const deniedNext = vi.fn()
    await route.handler(
      { accountability: { user: "user-2" }, params: { id: FILE_ONE } },
      createResponse(),
      deniedNext,
    )
    expect(firstForwardedError(deniedNext).code).toBe("ATTACHMENT_NOT_FOUND")

    const response = createResponse()
    await route.handler(
      { accountability: { user: "user-1" }, params: { id: FILE_ONE } },
      response,
      vi.fn(),
    )
    expect(response.body).toEqual({
      data: {
        file_id: FILE_ONE,
        visibility: "private",
        asset_url: `/assets/${FILE_ONE}`,
      },
    })
  })

  it("access 不信任指向缺失或已转移文件的陈旧 ref", async () => {
    const database = createDatabase({
      directus_files: [{ id: FILE_ONE, uploaded_by: "user-2" }],
      attachment_refs: [
        {
          id: 1,
          file_id: FILE_ONE,
          owner_user_id: "user-1",
          entity_type: "note",
          entity_id: "note-1",
        },
      ],
    })
    const router = createRouter()
    const { context } = createContext({ database })
    await registerExtension(router, context)

    const next = vi.fn()
    await findRoute(router.routes, "get", "/attachments/:id/access").handler(
      { accountability: { user: "user-1" }, params: { id: FILE_ONE } },
      createResponse(),
      next,
    )

    expect(firstForwardedError(next).code).toBe("ATTACHMENT_NOT_FOUND")
  })

  it("bind 与 unbind 只维护当前用户的引用和计数", async () => {
    const database = createDatabase({
      directus_files: [{ id: FILE_ONE, uploaded_by: "user-1" }],
      attachment_refs: [
        {
          id: 1,
          file_id: FILE_ONE,
          owner_user_id: "user-1",
          entity_type: "note",
          entity_id: "note-1",
        },
        {
          id: 2,
          file_id: FILE_ONE,
          owner_user_id: "user-2",
          entity_type: "note",
          entity_id: "note-2",
        },
      ],
    })
    const router = createRouter()
    const { context } = createContext({ database })
    await registerExtension(router, context)

    const bindResponse = createResponse()
    await findRoute(router.routes, "post", "/attachments/:id/bind").handler(
      {
        accountability: { user: "user-1" },
        params: { id: FILE_ONE },
        body: { entity_type: "todo", entity_id: "todo-1" },
      },
      bindResponse,
      vi.fn(),
    )
    expect(bindResponse.body).toEqual({
      data: {
        file_id: FILE_ONE,
        refs_count: 2,
      },
    })

    const unbindResponse = createResponse()
    await findRoute(router.routes, "post", "/attachments/:id/unbind").handler(
      {
        accountability: { user: "user-1" },
        params: { id: FILE_ONE },
        body: { entity_type: "todo", entity_id: "todo-1" },
      },
      unbindResponse,
      vi.fn(),
    )
    expect(unbindResponse.body).toEqual({
      data: {
        file_id: FILE_ONE,
        refs_count: 1,
      },
    })
    expect(database.__state.attachment_refs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ owner_user_id: "user-1", entity_id: "note-1" }),
        expect.objectContaining({ owner_user_id: "user-2", entity_id: "note-2" }),
      ]),
    )
    expect(database.transaction).toHaveBeenCalledTimes(2)
    expect(database.__transactions).toHaveLength(2)
    for (const trx of database.__transactions) {
      expect(trx.__forUpdate).toHaveBeenCalled()
    }
  })

  it("meta 只返回文件白名单字段和当前用户 refs_count", async () => {
    const database = createDatabase({
      directus_files: [
        {
          id: FILE_ONE,
          uploaded_by: "user-1",
          title: "Cover",
          filename_download: "cover.png",
          type: "image/png",
          filesize: 123,
          storage: "secret-storage",
          filename_disk: "secret-name",
        },
      ],
      attachment_refs: [
        {
          id: 1,
          file_id: FILE_ONE,
          owner_user_id: "user-1",
          entity_type: "note",
          entity_id: "note-1",
        },
        {
          id: 2,
          file_id: FILE_ONE,
          owner_user_id: "user-2",
          entity_type: "note",
          entity_id: "note-2",
        },
      ],
    })
    const router = createRouter()
    const { context } = createContext({ database })
    await registerExtension(router, context)

    const response = createResponse()
    await findRoute(router.routes, "get", "/attachments/:id/meta").handler(
      { accountability: { user: "user-1" }, params: { id: FILE_ONE } },
      response,
      vi.fn(),
    )

    expect(response.body).toEqual({
      data: {
        file: {
          id: FILE_ONE,
          title: "Cover",
          filename_download: "cover.png",
          type: "image/png",
          filesize: 123,
        },
        visibility: "private",
        refs_count: 1,
      },
    })
    expect(JSON.stringify(response.body)).not.toContain("secret-storage")
    expect(JSON.stringify(response.body)).not.toContain("secret-name")
  })

  it("delete 阻止有引用文件并通过 FilesService 删除无引用自有文件", async () => {
    const database = createDatabase({
      directus_files: [
        { id: FILE_ONE, uploaded_by: "user-1" },
        { id: FILE_TWO, uploaded_by: "user-2" },
      ],
      attachment_refs: [
        {
          id: 1,
          file_id: FILE_ONE,
          owner_user_id: "user-1",
          entity_type: "note",
          entity_id: "note-1",
        },
      ],
    })
    const router = createRouter()
    const { context, constructors, methods, schema } = createContext({ database })
    await registerExtension(router, context)
    const deleteRoute = findRoute(router.routes, "delete", "/attachments/:id")

    const inUseNext = vi.fn()
    await deleteRoute.handler(
      { accountability: { user: "user-1" }, params: { id: FILE_ONE } },
      createResponse(),
      inUseNext,
    )
    expect(firstForwardedError(inUseNext).code).toBe("ATTACHMENT_IN_USE")

    database.__state.attachment_refs = []
    const response = createResponse()
    await deleteRoute.handler(
      { accountability: { user: "user-1" }, params: { id: FILE_ONE } },
      response,
      vi.fn(),
    )

    expect(constructors.files).toHaveBeenCalledWith({
      accountability: { user: "user-1" },
      knex: database.__lastTransaction,
      schema,
    })
    expect(methods.deleteFile).toHaveBeenCalledWith(FILE_ONE)
    expect(response.statusCode).toBe(204)
    expect(database.__state.directus_files).toEqual([{ id: FILE_TWO, uploaded_by: "user-2" }])

    const foreignNext = vi.fn()
    await deleteRoute.handler(
      { accountability: { user: "user-1" }, params: { id: FILE_TWO } },
      createResponse(),
      foreignNext,
    )
    expect(firstForwardedError(foreignNext).code).toBe("ATTACHMENT_NOT_FOUND")
  })
})
