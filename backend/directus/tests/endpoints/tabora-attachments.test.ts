import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("@directus/extensions-sdk", () => ({
  defineEndpoint: (factory: any) => factory,
}))

type Route = {
  method: "get" | "post" | "delete"
  path: string
  handler: any
}

type AttachmentPolicy = {
  entity_type: string
  mime_whitelist?: string[] | null
  max_size_bytes?: number | null
}

type AttachmentRef = {
  id?: number
  file_id: string
  owner_user_id: string
  entity_type: string
  entity_id: string
}

type DirectusFile = {
  id: string
  title: string
  filename_download: string
  type: string
  filesize?: number
  uploaded_by?: string | null
}

function createRouter() {
  const routes: Route[] = []

  return {
    routes,
    get(path: string, handler: any) {
      routes.push({ method: "get", path, handler })
    },
    post(path: string, handler: any) {
      routes.push({ method: "post", path, handler })
    },
    delete(path: string, handler: any) {
      routes.push({ method: "delete", path, handler })
    },
  }
}

function createRes() {
  return {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code
      return this
    },
    json(payload: unknown) {
      this.body = payload
      return this
    },
    sendStatus(code: number) {
      this.statusCode = code
      return this
    },
  }
}

function matchesWhere(row: Record<string, unknown>, clauses: Array<Record<string, unknown>>) {
  return clauses.every((clause) =>
    Object.entries(clause).every(([key, value]) => row[key] === value),
  )
}

function createSelectQuery(
  state: Record<string, Array<Record<string, unknown>>>,
  result?: unknown[],
) {
  const clauses: Array<Record<string, unknown>> = []
  let tableName = ""
  let selected = result

  const qb: any = {}
  qb.from = vi.fn((table: string) => {
    tableName = table
    return qb
  })
  qb.where = vi.fn((arg1: string | Record<string, unknown>, arg2?: unknown) => {
    if (typeof arg1 === "string") {
      clauses.push({ [arg1]: arg2 })
    } else {
      clauses.push(arg1)
    }

    return qb
  })
  qb.orderBy = vi.fn(() => qb)
  qb.then = (resolve: any, reject: any) => {
    const rows =
      selected ??
      (state[tableName] ?? [])
        .filter((row) => matchesWhere(row, clauses))
        .map((row) => ({ ...row }))

    return Promise.resolve(rows).then(resolve, reject)
  }
  return qb
}

function createTableQuery(
  state: Record<string, Array<Record<string, unknown>>>,
  tableName: string,
  snapshots: Array<Record<string, Array<Record<string, unknown>>>>,
) {
  const clauses: Array<Record<string, unknown>> = []
  const qb: any = {}

  qb.where = vi.fn((arg1: string | Record<string, unknown>, arg2?: unknown) => {
    if (typeof arg1 === "string") {
      clauses.push({ [arg1]: arg2 })
    } else {
      clauses.push(arg1)
    }

    return qb
  })
  qb.insert = vi.fn(async (payload: Record<string, unknown>) => {
    const table = state[tableName] ?? (state[tableName] = [])
    const row = { id: table.length + 1, ...payload }
    table.push(row)
    snapshots.push(structuredClone(state))
    return [row.id]
  })
  qb.del = vi.fn(async () => {
    const table = state[tableName] ?? (state[tableName] = [])
    const before = table.length
    state[tableName] = table.filter((row) => !matchesWhere(row, clauses))
    snapshots.push(structuredClone(state))
    return before - state[tableName].length
  })

  return qb
}

function createDatabase(options?: {
  policies?: AttachmentPolicy[]
  refs?: AttachmentRef[]
  files?: DirectusFile[]
}) {
  const state: Record<string, Array<Record<string, unknown>>> = {
    attachment_policies: (options?.policies ?? []).map((item) => ({ ...item })),
    attachment_refs: (options?.refs ?? []).map((item) => ({ ...item })),
    directus_files: (options?.files ?? []).map((item) => ({ ...item })),
  }

  const snapshots: Array<Record<string, Array<Record<string, unknown>>>> = [structuredClone(state)]
  const db: any = vi.fn((tableName: string) => createTableQuery(state, tableName, snapshots))
  db.select = vi.fn((columns?: string[]) => {
    const result = columns && columns.length > 0 ? undefined : undefined
    return createSelectQuery(state, result)
  })
  db.__state = state
  db.__snapshots = snapshots
  return db
}

async function loadExtension() {
  vi.resetModules()
  // @ts-expect-error - dynamic import of extension
  const mod = (await import("../../extensions/directus-extension-tabora/dist/index")) as any
  const ext = mod.default
  // Adapt defineEndpoint format to test format
  if (typeof ext === "function") {
    return {
      id: "tabora",
      handler: ext,
    }
  }
  return ext as any
}

function findRoute(routes: Route[], method: Route["method"], path: string) {
  return routes.find((route) => route.method === method && route.path === path)
}

describe("tabora-attachments endpoint extension", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("注册 /attachments/* 路由", async () => {
    const router = createRouter()
    const database = createDatabase()
    const extension = await loadExtension()

    extension.handler(router as any, { services: {}, database })

    expect(findRoute(router.routes, "post", "/attachments/prepare")).toBeTruthy()
    expect(findRoute(router.routes, "post", "/attachments/commit")).toBeTruthy()
    expect(findRoute(router.routes, "get", "/attachments/:id/access")).toBeTruthy()
    expect(findRoute(router.routes, "post", "/attachments/:id/bind")).toBeTruthy()
    expect(findRoute(router.routes, "post", "/attachments/:id/unbind")).toBeTruthy()
    expect(findRoute(router.routes, "delete", "/attachments/:id")).toBeTruthy()
    expect(findRoute(router.routes, "get", "/attachments/:id/meta")).toBeTruthy()
  })

  it("prepare 按 policy 校验并默认返回 private 访问", async () => {
    const router = createRouter()
    const database = createDatabase({
      policies: [
        {
          entity_type: "note",
          mime_whitelist: ["image/png"],
          max_size_bytes: 2048,
        },
      ],
    })
    const extension = await loadExtension()
    extension.handler(router as any, { services: {}, database })

    const route = findRoute(router.routes, "post", "/attachments/prepare")
    expect(route).toBeTruthy()

    const res = createRes()
    await route!.handler(
      {
        accountability: { user: "user-1" },
        body: {
          entity_type: "note",
          mime_type: "image/png",
          size_bytes: 1024,
          filename: "cover.png",
        },
      },
      res,
      vi.fn(),
    )

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({
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
          max_size_bytes: 2048,
          mime_whitelist: ["image/png"],
        },
      },
    })
  })

  it("commit 会为上传者创建 owner ref", async () => {
    const router = createRouter()
    const database = createDatabase({
      files: [
        {
          id: "file-1",
          title: "Cover",
          filename_download: "cover.png",
          type: "image/png",
          filesize: 123,
          uploaded_by: "user-1",
        },
      ],
    })
    const extension = await loadExtension()
    extension.handler(router as any, { services: {}, database })

    const route = findRoute(router.routes, "post", "/attachments/commit")
    expect(route).toBeTruthy()

    const res = createRes()
    await route!.handler(
      {
        accountability: { user: "user-1" },
        body: { file_id: "file-1", entity_type: "note", entity_id: "n1" },
      },
      res,
      vi.fn(),
    )

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({
      data: {
        file_id: "file-1",
        entity_type: "note",
        entity_id: "n1",
        visibility: "private",
        refs_count: 1,
      },
    })
    expect(database.__state.attachment_refs).toEqual([
      {
        id: 1,
        file_id: "file-1",
        owner_user_id: "user-1",
        entity_type: "note",
        entity_id: "n1",
      },
    ])
  })

  it("access 仅允许 owner 访问私有附件", async () => {
    const router = createRouter()
    const database = createDatabase({
      files: [
        {
          id: "file-1",
          title: "Cover",
          filename_download: "cover.png",
          type: "image/png",
          filesize: 123,
          uploaded_by: "user-1",
        },
      ],
      refs: [
        {
          id: 1,
          file_id: "file-1",
          owner_user_id: "user-1",
          entity_type: "note",
          entity_id: "n1",
        },
      ],
    })
    const extension = await loadExtension()
    extension.handler(router as any, { services: {}, database })

    const route = findRoute(router.routes, "get", "/attachments/:id/access")
    expect(route).toBeTruthy()

    const denied = createRes()
    await route!.handler(
      { accountability: { user: "user-2" }, params: { id: "file-1" } },
      denied,
      vi.fn(),
    )
    expect(denied.statusCode).toBe(403)

    const granted = createRes()
    await route!.handler(
      { accountability: { user: "user-1" }, params: { id: "file-1" } },
      granted,
      vi.fn(),
    )
    expect(granted.statusCode).toBe(200)
    expect(granted.body).toEqual({
      data: {
        file_id: "file-1",
        visibility: "private",
        asset_url: "/assets/file-1",
      },
    })
  })

  it("bind 与 unbind 会维护 attachment_refs", async () => {
    const router = createRouter()
    const database = createDatabase({
      files: [
        {
          id: "file-1",
          title: "Cover",
          filename_download: "cover.png",
          type: "image/png",
          uploaded_by: "user-1",
        },
      ],
      refs: [
        {
          id: 1,
          file_id: "file-1",
          owner_user_id: "user-1",
          entity_type: "note",
          entity_id: "n1",
        },
      ],
    })
    const extension = await loadExtension()
    extension.handler(router as any, { services: {}, database })

    const bindRoute = findRoute(router.routes, "post", "/attachments/:id/bind")
    const unbindRoute = findRoute(router.routes, "post", "/attachments/:id/unbind")
    expect(bindRoute).toBeTruthy()
    expect(unbindRoute).toBeTruthy()

    const bindRes = createRes()
    await bindRoute!.handler(
      {
        accountability: { user: "user-1" },
        params: { id: "file-1" },
        body: { entity_type: "todo", entity_id: "t1" },
      },
      bindRes,
      vi.fn(),
    )

    expect(bindRes.body).toEqual({
      data: {
        file_id: "file-1",
        refs_count: 2,
      },
    })

    const unbindRes = createRes()
    await unbindRoute!.handler(
      {
        accountability: { user: "user-1" },
        params: { id: "file-1" },
        body: { entity_type: "todo", entity_id: "t1" },
      },
      unbindRes,
      vi.fn(),
    )

    expect(unbindRes.body).toEqual({
      data: {
        file_id: "file-1",
        refs_count: 1,
      },
    })
  })

  it("delete 仅在无引用时删除，meta 返回私有元信息", async () => {
    const router = createRouter()
    const database = createDatabase({
      files: [
        {
          id: "file-1",
          title: "Cover",
          filename_download: "cover.png",
          type: "image/png",
          filesize: 123,
          uploaded_by: "user-1",
        },
      ],
      refs: [
        {
          id: 1,
          file_id: "file-1",
          owner_user_id: "user-1",
          entity_type: "note",
          entity_id: "n1",
        },
      ],
    })
    const extension = await loadExtension()
    extension.handler(router as any, { services: {}, database })

    const metaRoute = findRoute(router.routes, "get", "/attachments/:id/meta")
    const deleteRoute = findRoute(router.routes, "delete", "/attachments/:id")
    const unbindRoute = findRoute(router.routes, "post", "/attachments/:id/unbind")
    expect(metaRoute).toBeTruthy()
    expect(deleteRoute).toBeTruthy()
    expect(unbindRoute).toBeTruthy()

    const metaRes = createRes()
    await metaRoute!.handler(
      { accountability: { user: "user-1" }, params: { id: "file-1" } },
      metaRes,
      vi.fn(),
    )
    expect(metaRes.body).toEqual({
      data: {
        file: {
          id: "file-1",
          title: "Cover",
          filename_download: "cover.png",
          type: "image/png",
          filesize: 123,
        },
        visibility: "private",
        refs_count: 1,
      },
    })

    const blockedDelete = createRes()
    await deleteRoute!.handler(
      { accountability: { user: "user-1" }, params: { id: "file-1" } },
      blockedDelete,
      vi.fn(),
    )
    expect(blockedDelete.statusCode).toBe(409)

    await unbindRoute!.handler(
      {
        accountability: { user: "user-1" },
        params: { id: "file-1" },
        body: { entity_type: "note", entity_id: "n1" },
      },
      createRes(),
      vi.fn(),
    )

    const deleteRes = createRes()
    await deleteRoute!.handler(
      { accountability: { user: "user-1" }, params: { id: "file-1" } },
      deleteRes,
      vi.fn(),
    )
    expect(deleteRes.statusCode).toBe(204)
    expect(database.__state.directus_files).toEqual([])
  })
})
