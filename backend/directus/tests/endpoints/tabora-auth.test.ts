import { createHash } from "node:crypto"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  createContext,
  createDatabase,
  createResponse,
  createRouter,
  findRoute,
  firstForwardedError,
  registerExtension,
} from "./tabora-test-kit"

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex")
}

function onlyTransaction(database: any) {
  expect(database.__transactions).toHaveLength(1)

  const transaction = database.__transactions[0]
  expect(database.__lastTransaction).toBe(transaction)
  expect(transaction).not.toBe(database)

  return transaction
}

describe("tabora auth endpoints", () => {
  const STABLE_SESSION_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
  const OTHER_SESSION_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
  const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("注册完整的认证与会话路由", async () => {
    const router = createRouter()
    const { context } = createContext()

    await registerExtension(router, context)

    expect(router.routes.map(({ method, path }) => `${method}:${path}`)).toEqual(
      expect.arrayContaining([
        "post:/auth/register",
        "post:/auth/login",
        "post:/auth/refresh",
        "post:/auth/logout",
        "get:/auth/session",
        "post:/auth/send-code",
        "post:/auth/verify-code",
        "get:/auth/devices",
        "post:/auth/revoke",
      ]),
    )
  })

  it("test database transaction 使用独立 facade 并与根 database 共享 state", async () => {
    const database = createDatabase({ user_refresh_tokens: [] })

    await database.transaction(async (transaction: any) => {
      expect(transaction).not.toBe(database)
      expect(transaction.__state).toBe(database.__state)
      await transaction("user_refresh_tokens").insert({
        user_id: "user-1",
        session_id: STABLE_SESSION_ID,
        token_hash: sha256("refresh-token"),
      })
    })

    const transaction = onlyTransaction(database)
    expect(database).not.toHaveBeenCalled()
    expect(database.select).not.toHaveBeenCalled()
    expect(database.__forUpdate).not.toHaveBeenCalled()
    expect(database.__writes).not.toHaveBeenCalled()
    expect(transaction).toHaveBeenCalledWith("user_refresh_tokens")
    expect(transaction.__writes).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: "insert",
        table: "user_refresh_tokens",
      }),
    )
    expect(database.__state.user_refresh_tokens).toHaveLength(1)
  })

  it("AuthenticationService login/refresh/logout 使用 options.knex transaction facade", async () => {
    const database = createDatabase({
      directus_sessions: [{ token: "legacy-token", user: "user-1", oauth_client: null }],
    })
    const { context, methods } = createContext({ database })

    await database.transaction(async (transaction: any) => {
      const authenticationService = new context.services.AuthenticationService({
        knex: transaction,
      })

      await authenticationService.refresh("legacy-token")
      await authenticationService.logout("next-refresh-token")
      await authenticationService.login("default", {
        email: "a@example.com",
        password: "secret",
      })
    })

    const transaction = onlyTransaction(database)
    expect(methods.refresh).toHaveBeenCalledWith("legacy-token")
    expect(methods.logout).toHaveBeenCalledWith("next-refresh-token")
    expect(methods.login).toHaveBeenCalledWith("default", {
      email: "a@example.com",
      password: "secret",
    })
    expect(database).not.toHaveBeenCalled()
    expect(database.select).not.toHaveBeenCalled()
    expect(database.__writes).not.toHaveBeenCalled()
    expect(transaction.__writes).toHaveBeenCalledWith({
      operation: "update",
      table: "directus_sessions",
      where: [{ token: "legacy-token" }],
      payload: { token: "next-refresh-token" },
    })
    expect(transaction.__writes).toHaveBeenCalledWith({
      operation: "delete",
      table: "directus_sessions",
      where: [{ token: "next-refresh-token" }],
    })
    expect(transaction.__writes).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: "insert",
        table: "directus_sessions",
      }),
    )
    expect(database.__state.directus_sessions).toEqual([
      {
        token: "refresh-token",
        user: "user-1",
        oauth_client: null,
        created_at: "2099-01-01T00:00:00.000Z",
        expires: "2099-01-02T00:00:00.000Z",
      },
    ])
  })

  it("register 与 Directus 官方路由一致，使用无 accountability 的 UsersService", async () => {
    const router = createRouter()
    const { context, getSchema, methods, constructors, schema } = createContext()
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)
    await registerExtension(router, context)

    const response = createResponse()
    const next = vi.fn()
    await findRoute(router.routes, "post", "/auth/register").handler(
      {
        body: { email: "  A@Example.com ", password: "secret" },
        accountability: null,
        ip: "127.0.0.1",
        get(name: string) {
          return {
            "user-agent": "Tabora Test",
            origin: "chrome-extension://tabora",
          }[name]
        },
      },
      response,
      next,
    )

    expect(getSchema).toHaveBeenCalledOnce()
    expect(constructors.users).toHaveBeenCalledWith({
      accountability: null,
      schema,
    })
    expect(methods.registerUser).toHaveBeenCalledWith({
      email: "a@example.com",
      password: "secret",
    })
    expect(fetchMock).not.toHaveBeenCalled()
    expect(response.statusCode).toBe(204)
    expect(next).not.toHaveBeenCalled()
  })

  it("无效 register payload 交给 Directus INVALID_PAYLOAD 错误处理", async () => {
    const router = createRouter()
    const { context, methods } = createContext()
    await registerExtension(router, context)

    const next = vi.fn()
    await findRoute(router.routes, "post", "/auth/register").handler(
      { body: { email: "not-an-email", password: "" }, accountability: null },
      createResponse(),
      next,
    )

    expect(firstForwardedError(next).code).toBe("INVALID_PAYLOAD")
    expect(methods.registerUser).not.toHaveBeenCalled()
  })

  it("login 创建 hash-backed stable UUID mapping 并返回该 UUID", async () => {
    const router = createRouter()
    const database = createDatabase()
    const { context, methods, constructors, schema } = createContext({ database })
    await registerExtension(router, context)

    const loginResponse = createResponse()
    await findRoute(router.routes, "post", "/auth/login").handler(
      {
        body: { email: "a@example.com", password: "secret" },
        accountability: null,
        ip: "127.0.0.1",
        get: () => undefined,
      },
      loginResponse,
      vi.fn(),
    )

    // login 不再包一层跨 Directus auth 的事务（SQLite 单连接下会与
    // AuthenticationService 内部的连接请求死锁），Directus 登录调用与
    // identity 写入都直接使用 context.database。
    expect(database.__transactions).toHaveLength(0)

    expect(methods.login).toHaveBeenCalledWith(
      "default",
      { email: "a@example.com", password: "secret" },
      { session: false },
    )
    expect(loginResponse.body).toEqual({
      data: {
        access_token: "access-token",
        refresh_token: "refresh-token",
        expires: 900,
        session_id: expect.stringMatching(UUID_V4_PATTERN),
      },
    })
    const sessionId = (loginResponse.body as { data: { session_id: string } }).data.session_id
    expect(database.__state.directus_sessions).toEqual([
      {
        token: "refresh-token",
        user: "user-1",
        oauth_client: null,
        created_at: "2099-01-01T00:00:00.000Z",
        expires: "2099-01-02T00:00:00.000Z",
      },
    ])
    expect(database.__state.user_refresh_tokens).toEqual([
      {
        id: 1,
        user_id: "user-1",
        session_id: sessionId,
        token_hash: sha256("refresh-token"),
      },
    ])
    expect(database.select).not.toHaveBeenCalled()
    expect(database.__writes).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: "insert",
        table: "user_refresh_tokens",
        payload: expect.objectContaining({
          user_id: "user-1",
          session_id: sessionId,
          token_hash: sha256("refresh-token"),
        }),
      }),
    )
    expect(constructors.authentication).toHaveBeenCalledWith({
      accountability: {
        role: null,
        roles: [],
        user: null,
        admin: false,
        app: false,
        ip: "127.0.0.1",
      },
      schema,
    })
  })

  it("refresh 只旋转 identity token hash 并保留 stable UUID", async () => {
    const database = createDatabase({
      directus_sessions: [
        {
          token: "refresh-token",
          user: "user-1",
          oauth_client: null,
          created_at: "2099-01-01T00:00:00.000Z",
          expires: "2099-01-02T00:00:00.000Z",
        },
      ],
      user_refresh_tokens: [
        {
          id: 7,
          user_id: "user-1",
          session_id: STABLE_SESSION_ID,
          token_hash: sha256("refresh-token"),
        },
      ],
    })
    const router = createRouter()
    const { context, methods, constructors, schema } = createContext({ database })
    await registerExtension(router, context)

    const refreshResponse = createResponse()
    await findRoute(router.routes, "post", "/auth/refresh").handler(
      {
        body: { refresh_token: "refresh-token" },
        accountability: null,
        ip: "127.0.0.1",
        get: () => undefined,
      },
      refreshResponse,
      vi.fn(),
    )

    // authenticationService.refresh 直接用 context.database（不传事务，避免
    // 与 Directus auth driver 的全局连接池死锁）；identity 的 rotate 用一个
    // 只包含 user_refresh_tokens 操作的独立短事务。
    const transaction = onlyTransaction(database)

    expect(methods.refresh).toHaveBeenCalledWith("refresh-token", { session: false })
    expect(refreshResponse.body).toEqual({
      data: {
        access_token: "next-access-token",
        refresh_token: "next-refresh-token",
        expires: 900,
        session_id: STABLE_SESSION_ID,
      },
    })
    expect(database.__state.directus_sessions).toEqual([
      {
        token: "next-refresh-token",
        user: "user-1",
        oauth_client: null,
        created_at: "2099-01-01T00:00:00.000Z",
        expires: "2099-01-02T00:00:00.000Z",
      },
    ])
    expect(database.__state.user_refresh_tokens).toEqual([
      {
        id: 7,
        user_id: "user-1",
        session_id: STABLE_SESSION_ID,
        token_hash: sha256("next-refresh-token"),
      },
    ])
    expect(database.select).not.toHaveBeenCalled()
    // directus_sessions 的更新（AuthenticationService.refresh 内部）发生在
    // context.database 上，不进短事务；短事务只应看到 user_refresh_tokens 的写入。
    expect(database.__writes).toHaveBeenCalledWith({
      operation: "update",
      table: "directus_sessions",
      where: [{ token: "refresh-token" }],
      payload: { token: "next-refresh-token" },
    })
    expect(
      transaction.__writes.mock.calls
        .map(([write]: [{ table: string }]) => write.table)
        .every((table: string) => table === "user_refresh_tokens"),
    ).toBe(true)
    expect(transaction.__forUpdate).toHaveBeenCalledWith("user_refresh_tokens")
    expect(transaction.select.mock.calls.flat()).not.toContain("data")
    expect(transaction.__writes).toHaveBeenCalledWith({
      operation: "update",
      table: "user_refresh_tokens",
      where: [{ id: 7, user_id: "user-1" }],
      payload: {
        token_hash: sha256("next-refresh-token"),
      },
    })
    expect(constructors.authentication).toHaveBeenCalledWith({
      accountability: {
        role: null,
        roles: [],
        user: null,
        admin: false,
        app: false,
        ip: "127.0.0.1",
      },
      schema,
    })
  })

  it("legacy session 成功 refresh 后创建 stable UUID/hash mapping", async () => {
    const database = createDatabase({
      directus_sessions: [
        {
          token: "refresh-token",
          user: "user-1",
          oauth_client: null,
          created_at: "2099-01-01T00:00:00.000Z",
          expires: "2099-01-02T00:00:00.000Z",
        },
      ],
      user_refresh_tokens: [],
    })
    const router = createRouter()
    const { context } = createContext({ database })
    await registerExtension(router, context)

    const response = createResponse()
    await findRoute(router.routes, "post", "/auth/refresh").handler(
      {
        body: { refresh_token: "refresh-token" },
        accountability: null,
        ip: "127.0.0.1",
        get: () => undefined,
      },
      response,
      vi.fn(),
    )
    const transaction = onlyTransaction(database)

    expect(response.body).toEqual({
      data: {
        access_token: "next-access-token",
        refresh_token: "next-refresh-token",
        expires: 900,
        session_id: expect.stringMatching(UUID_V4_PATTERN),
      },
    })
    const sessionId = (response.body as { data: { session_id: string } }).data.session_id
    expect(database.__state.user_refresh_tokens).toEqual([
      {
        id: 1,
        user_id: "user-1",
        session_id: sessionId,
        token_hash: sha256("next-refresh-token"),
      },
    ])
    expect(database.__state.directus_sessions).toEqual([
      {
        token: "next-refresh-token",
        user: "user-1",
        oauth_client: null,
        created_at: "2099-01-01T00:00:00.000Z",
        expires: "2099-01-02T00:00:00.000Z",
      },
    ])
    expect(database.select).not.toHaveBeenCalled()
    // AuthenticationService.refresh 内部对 directus_sessions 的更新走
    // context.database（无事务）；identity 的 create 走独立短事务。
    expect(database.__writes).toHaveBeenCalledWith({
      operation: "update",
      table: "directus_sessions",
      where: [{ token: "refresh-token" }],
      payload: { token: "next-refresh-token" },
    })
    expect(transaction.select.mock.calls.flat()).not.toContain("data")
    expect(transaction.__writes).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: "insert",
        table: "user_refresh_tokens",
        payload: expect.objectContaining({
          user_id: "user-1",
          session_id: sessionId,
          token_hash: sha256("next-refresh-token"),
        }),
      }),
    )
  })

  it("login 不复用请求中已有的用户 accountability", async () => {
    const router = createRouter()
    const { context, constructors, database, schema } = createContext()
    await registerExtension(router, context)

    await findRoute(router.routes, "post", "/auth/login").handler(
      {
        body: { email: "a@example.com", password: "secret" },
        accountability: {
          user: "already-signed-in",
          role: "role-1",
          roles: ["role-1"],
          admin: true,
          app: true,
          ip: "stale-ip",
        },
        ip: "127.0.0.1",
        get: () => undefined,
      },
      createResponse(),
      vi.fn(),
    )
    // login 不再传事务给 AuthenticationService（避免与全局连接池死锁）。
    expect(database.__transactions).toHaveLength(0)

    expect(constructors.authentication).toHaveBeenCalledWith({
      accountability: {
        role: null,
        roles: [],
        user: null,
        admin: false,
        app: false,
        ip: "127.0.0.1",
      },
      schema,
    })
    expect(database.select).not.toHaveBeenCalled()
  })

  it("logout 删除 Directus session 与 hash mapping", async () => {
    const database = createDatabase({
      directus_sessions: [
        {
          token: "refresh-token",
          user: "user-1",
          oauth_client: null,
          created_at: "2099-01-01T00:00:00.000Z",
          expires: "2099-01-02T00:00:00.000Z",
        },
      ],
      user_refresh_tokens: [
        {
          id: 1,
          user_id: "user-1",
          session_id: STABLE_SESSION_ID,
          token_hash: sha256("refresh-token"),
        },
      ],
    })
    const router = createRouter()
    const { context, methods, constructors, schema } = createContext({ database })
    await registerExtension(router, context)

    const response = createResponse()
    await findRoute(router.routes, "post", "/auth/logout").handler(
      { body: { refresh_token: "refresh-token" }, accountability: null },
      response,
      vi.fn(),
    )
    // authenticationService.logout 用 context.database 独立执行（不传事务）；
    // identity 删除用一个只含 user_refresh_tokens 操作的独立短事务。
    const transaction = onlyTransaction(database)

    expect(methods.logout).toHaveBeenCalledWith("refresh-token")
    expect(constructors.authentication).toHaveBeenCalledWith({
      accountability: {
        role: null,
        roles: [],
        user: null,
        admin: false,
        app: false,
        ip: null,
      },
      schema,
    })
    expect(database.select).not.toHaveBeenCalled()
    expect(database.__writes).toHaveBeenCalledWith({
      operation: "delete",
      table: "directus_sessions",
      where: [{ token: "refresh-token" }],
    })
    expect(transaction.__writes).toHaveBeenCalledWith({
      operation: "delete",
      table: "user_refresh_tokens",
      where: [
        {
          user_id: "user-1",
          token_hash: sha256("refresh-token"),
        },
      ],
    })
    expect(
      transaction.__writes.mock.calls
        .map(([write]: [{ table: string }]) => write.table)
        .every((table: string) => table === "user_refresh_tokens"),
    ).toBe(true)
    expect(database.__state.directus_sessions).toEqual([])
    expect(database.__state.user_refresh_tokens).toEqual([])
    expect(response.statusCode).toBe(204)
  })

  it("session 用当前 user id 读取白名单字段", async () => {
    const router = createRouter()
    const { context, methods, constructors, schema } = createContext({
      serviceOverrides: {
        readUser: async () => ({
          id: "user-1",
          email: "a@example.com",
          first_name: "A",
        }),
      },
    })
    await registerExtension(router, context)

    const response = createResponse()
    await findRoute(router.routes, "get", "/auth/session").handler(
      { accountability: { user: "user-1" } },
      response,
      vi.fn(),
    )

    expect(constructors.users).toHaveBeenCalledWith({
      accountability: { user: "user-1" },
      schema,
    })
    expect(methods.readUser).toHaveBeenCalledWith("user-1", {
      fields: ["id", "email", "first_name", "last_name", "avatar", "status"],
    })
    expect(response.body).toEqual({
      data: {
        id: "user-1",
        email: "a@example.com",
        first_name: "A",
      },
    })
  })

  it("受保护路由未登录时转交 INVALID_CREDENTIALS", async () => {
    const router = createRouter()
    const { context } = createContext()
    await registerExtension(router, context)

    const next = vi.fn()
    await findRoute(router.routes, "get", "/auth/session").handler(
      { accountability: null },
      createResponse(),
      next,
    )

    expect(firstForwardedError(next).code).toBe("INVALID_CREDENTIALS")
  })

  it("send-code 通过 UsersService 请求重置并保持防枚举 204", async () => {
    const router = createRouter()
    const { context, methods } = createContext()
    await registerExtension(router, context)

    const response = createResponse()
    await findRoute(router.routes, "post", "/auth/send-code").handler(
      { body: { email: "a@example.com" }, accountability: null },
      response,
      vi.fn(),
    )

    expect(methods.requestPasswordReset).toHaveBeenCalledWith("a@example.com", null)
    expect(response.statusCode).toBe(204)
  })

  it("send-code 使用匿名 request accountability 而非已登录身份", async () => {
    const router = createRouter()
    const { context, constructors, schema } = createContext()
    await registerExtension(router, context)

    await findRoute(router.routes, "post", "/auth/send-code").handler(
      {
        body: { email: "a@example.com" },
        accountability: {
          user: "already-signed-in",
          role: "role-1",
          roles: ["role-1"],
          admin: true,
          app: true,
          ip: "stale-ip",
        },
        ip: "127.0.0.1",
        get: () => undefined,
      },
      createResponse(),
      vi.fn(),
    )

    expect(constructors.users).toHaveBeenCalledWith({
      accountability: {
        role: null,
        roles: [],
        user: null,
        admin: false,
        app: false,
        ip: "127.0.0.1",
      },
      schema,
    })
  })

  it("send-code 对内部失败记录 warning 但不泄露账号状态", async () => {
    const failure = new Error("mail transport leaked details")
    const router = createRouter()
    const { context, logger } = createContext({
      serviceOverrides: {
        requestPasswordReset: async () => {
          throw failure
        },
      },
    })
    await registerExtension(router, context)

    const response = createResponse()
    const next = vi.fn()
    await findRoute(router.routes, "post", "/auth/send-code").handler(
      { body: { email: "a@example.com" }, accountability: null },
      response,
      next,
    )

    expect(logger.warn).toHaveBeenCalledWith(failure, "Password reset request failed")
    expect(response.statusCode).toBe(204)
    expect(next).not.toHaveBeenCalled()
  })

  it("verify-code 将 code 映射为 Directus reset token", async () => {
    const router = createRouter()
    const { context, methods } = createContext()
    await registerExtension(router, context)

    const response = createResponse()
    await findRoute(router.routes, "post", "/auth/verify-code").handler(
      { body: { code: "reset-token", password: "next-secret" }, accountability: null },
      response,
      vi.fn(),
    )

    expect(methods.resetPassword).toHaveBeenCalledWith("reset-token", "next-secret")
    expect(response.statusCode).toBe(204)
  })

  it("devices 用 session token hash 匹配 stable UUID，并省略 legacy session", async () => {
    const token = "raw-session-token"
    const database = createDatabase({
      directus_sessions: [
        {
          token,
          user: "user-1",
          oauth_client: null,
          created_at: "2099-01-01T08:00:00.000Z",
          expires: "2099-01-02T08:00:00.000Z",
          ip: "127.0.0.1",
          user_agent: "Tabora Test",
          origin: "chrome-extension://tabora",
          next_token: "must-not-leak",
        },
        {
          token: "legacy-session-token",
          user: "user-1",
          oauth_client: null,
          created_at: "2099-01-01T07:00:00.000Z",
          expires: "2099-01-02T07:00:00.000Z",
          ip: "127.0.0.2",
          user_agent: "Legacy Tabora",
          origin: "chrome-extension://tabora",
        },
        {
          token: "oauth-session-token",
          user: "user-1",
          oauth_client: "oauth-client-1",
          created_at: "2099-01-01T09:00:00.000Z",
          expires: "2099-01-02T09:00:00.000Z",
        },
        {
          token: "expired-session-token",
          user: "user-1",
          oauth_client: null,
          created_at: "2020-01-01T00:00:00.000Z",
          expires: "2020-01-02T00:00:00.000Z",
        },
      ],
      user_refresh_tokens: [
        {
          id: 1,
          user_id: "user-1",
          session_id: STABLE_SESSION_ID,
          token_hash: sha256(token),
        },
      ],
    })
    const router = createRouter()
    const { context } = createContext({ database })
    await registerExtension(router, context)

    const response = createResponse()
    await findRoute(router.routes, "get", "/auth/devices").handler(
      { accountability: { user: "user-1", session: token } },
      response,
      vi.fn(),
    )

    expect(response.body).toEqual({
      data: {
        devices: [
          {
            id: STABLE_SESSION_ID,
            created_at: "2099-01-01T08:00:00.000Z",
            expires: "2099-01-02T08:00:00.000Z",
            ip: "127.0.0.1",
            user_agent: "Tabora Test",
            origin: "chrome-extension://tabora",
            current: true,
          },
        ],
      },
    })
    expect(JSON.stringify(response.body)).not.toContain(token)
    expect(JSON.stringify(response.body)).not.toContain("legacy-session-token")
    expect(JSON.stringify(response.body)).not.toContain("next_token")
    expect(database.select.mock.calls.flat()).not.toContain("data")
  })

  it("devices 在 JSON token mode 无法识别当前 session 时不返回误导标记", async () => {
    const token = "json-refresh-token"
    const database = createDatabase({
      directus_sessions: [
        {
          token,
          user: "user-1",
          oauth_client: null,
          created_at: "2099-01-01T08:00:00.000Z",
          expires: "2099-01-02T08:00:00.000Z",
          ip: "127.0.0.1",
          user_agent: "Tabora Test",
          origin: "chrome-extension://tabora",
        },
      ],
      user_refresh_tokens: [
        {
          id: 1,
          user_id: "user-1",
          session_id: STABLE_SESSION_ID,
          token_hash: sha256(token),
        },
      ],
    })
    const router = createRouter()
    const { context } = createContext({ database })
    await registerExtension(router, context)

    const response = createResponse()
    await findRoute(router.routes, "get", "/auth/devices").handler(
      { accountability: { user: "user-1" } },
      response,
      vi.fn(),
    )

    expect(response.body).toEqual({
      data: {
        devices: [
          {
            id: STABLE_SESSION_ID,
            created_at: "2099-01-01T08:00:00.000Z",
            expires: "2099-01-02T08:00:00.000Z",
            ip: "127.0.0.1",
            user_agent: "Tabora Test",
            origin: "chrome-extension://tabora",
          },
        ],
      },
    })
  })

  it("revoke 按当前用户 stable UUID 锁表、撤销 Directus session 并删除 mapping", async () => {
    const ownToken = "own-session-token"
    const otherToken = "other-session-token"
    const database = createDatabase({
      directus_sessions: [
        {
          token: ownToken,
          user: "user-1",
          oauth_client: null,
        },
        { token: "own-oauth-token", user: "user-1", oauth_client: "oauth-client-1" },
        { token: otherToken, user: "user-2", oauth_client: null },
      ],
      user_refresh_tokens: [
        {
          id: 1,
          user_id: "user-1",
          session_id: STABLE_SESSION_ID,
          token_hash: sha256(ownToken),
        },
        {
          id: 2,
          user_id: "user-2",
          session_id: OTHER_SESSION_ID,
          token_hash: sha256(otherToken),
        },
      ],
    })
    const router = createRouter()
    const { context, constructors, methods, schema } = createContext({ database })
    await registerExtension(router, context)

    const response = createResponse()
    const next = vi.fn()
    await findRoute(router.routes, "post", "/auth/revoke").handler(
      {
        accountability: { user: "user-1" },
        body: {
          session_id: STABLE_SESSION_ID,
        },
      },
      response,
      next,
    )
    const transaction = onlyTransaction(database)

    expect(next).not.toHaveBeenCalled()
    expect(response.statusCode).toBe(204)
    expect(constructors.authentication).toHaveBeenCalledWith({
      accountability: { user: "user-1" },
      knex: transaction,
      schema,
    })
    expect(methods.logout).toHaveBeenCalledWith(ownToken)
    expect(database).not.toHaveBeenCalled()
    expect(database.select).not.toHaveBeenCalled()
    expect(database.__forUpdate).not.toHaveBeenCalled()
    expect(database.__writes).not.toHaveBeenCalled()
    expect(transaction.__forUpdate.mock.calls.map(([tableName]: [string]) => tableName)).toEqual([
      "user_refresh_tokens",
      "directus_sessions",
    ])
    expect(transaction.select.mock.calls.flat()).not.toContain("data")
    expect(transaction.__writes).toHaveBeenCalledWith({
      operation: "delete",
      table: "directus_sessions",
      where: [{ token: ownToken }],
    })
    expect(transaction.__writes).toHaveBeenCalledWith({
      operation: "delete",
      table: "user_refresh_tokens",
      where: [{ id: 1, user_id: "user-1" }],
    })
    expect(database.__state.directus_sessions).toEqual([
      { token: "own-oauth-token", user: "user-1", oauth_client: "oauth-client-1" },
      { token: otherToken, user: "user-2", oauth_client: null },
    ])
    expect(database.__state.user_refresh_tokens).toEqual([
      {
        id: 2,
        user_id: "user-2",
        session_id: OTHER_SESSION_ID,
        token_hash: sha256(otherToken),
      },
    ])
  })
})
