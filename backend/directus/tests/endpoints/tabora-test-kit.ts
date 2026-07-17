import { vi } from "vitest"

vi.mock("@directus/extensions-sdk", () => ({
  defineEndpoint: (factory: unknown) => factory,
}))

export type RouteMethod = "get" | "post" | "delete"

export type Route = {
  method: RouteMethod
  path: string
  handler: (request: any, response: any, next: any) => unknown
}

type Row = Record<string, unknown>
type DatabaseState = Record<string, Row[]>
type DatabaseWrite = {
  operation: "insert" | "update" | "delete"
  table: string
  where: Row[]
  payload?: Row
}

export function createRouter() {
  const routes: Route[] = []

  return {
    routes,
    get(path: string, handler: Route["handler"]) {
      routes.push({ method: "get", path, handler })
    },
    post(path: string, handler: Route["handler"]) {
      routes.push({ method: "post", path, handler })
    },
    delete(path: string, handler: Route["handler"]) {
      routes.push({ method: "delete", path, handler })
    },
  }
}

export function findRoute(routes: Route[], method: RouteMethod, path: string) {
  const route = routes.find((candidate) => candidate.method === method && candidate.path === path)
  if (!route) {
    throw new Error(`Route ${method.toUpperCase()} ${path} was not registered`)
  }

  return route
}

export function createResponse() {
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

function matchesWhere(row: Row, clauses: Row[]) {
  return clauses.every((clause) =>
    Object.entries(clause).every(([key, value]) => row[key] === value),
  )
}

function projectRow(row: Row, columns: string[]) {
  if (columns.length === 0 || columns.includes("*")) {
    return { ...row }
  }

  return Object.fromEntries(columns.map((column) => [column, row[column]]))
}

function createDirectusError(code: string, message: string, status: number) {
  return Object.assign(new Error(message), {
    name: "DirectusError",
    code,
    status,
  })
}

function sortableValue(value: unknown): string {
  if (typeof value === "string" || typeof value === "number" || typeof value === "bigint") {
    return String(value)
  }

  return ""
}

function createSelectQuery(
  state: DatabaseState,
  initialColumns: unknown[],
  onForUpdate: (tableName: string) => void,
) {
  const clauses: Row[] = []
  const columns = initialColumns
    .flat()
    .filter((value): value is string => typeof value === "string")
  let tableName = ""
  let order: { column: string; direction: "asc" | "desc" } | null = null

  const readRows = () => {
    const rows = (state[tableName] ?? []).filter((row) => matchesWhere(row, clauses))
    const sorted = [...rows]

    if (order) {
      sorted.sort((left, right) => {
        const leftValue = sortableValue(left[order!.column])
        const rightValue = sortableValue(right[order!.column])
        const result = leftValue.localeCompare(rightValue)
        return order!.direction === "desc" ? -result : result
      })
    }

    return sorted.map((row) => projectRow(row, columns))
  }

  const query: any = {}
  query.from = vi.fn((name: string) => {
    tableName = name
    return query
  })
  query.where = vi.fn((arg1: string | Row, arg2?: unknown) => {
    clauses.push(typeof arg1 === "string" ? { [arg1]: arg2 } : arg1)
    return query
  })
  query.orderBy = vi.fn((column: string, direction: "asc" | "desc" = "asc") => {
    order = { column, direction }
    return query
  })
  query.forUpdate = vi.fn(() => {
    onForUpdate(tableName)
    return query
  })
  query.first = vi.fn(async () => readRows()[0])
  query.then = (resolve: (value: Row[]) => unknown, reject: (reason: unknown) => unknown) =>
    Promise.resolve(readRows()).then(resolve, reject)

  return query
}

function createTableQuery(
  state: DatabaseState,
  tableName: string,
  snapshots: DatabaseState[],
  onForUpdate: (tableName: string) => void,
  onWrite: (write: DatabaseWrite) => void,
) {
  const clauses: Row[] = []
  let columns = ["*"]
  const query: any = {}

  const readRows = () =>
    (state[tableName] ?? [])
      .filter((row) => matchesWhere(row, clauses))
      .map((row) => projectRow(row, columns))

  query.select = vi.fn((...selectedColumns: unknown[]) => {
    columns = selectedColumns.flat().filter((value): value is string => typeof value === "string")
    return query
  })
  query.where = vi.fn((arg1: string | Row, arg2?: unknown) => {
    clauses.push(typeof arg1 === "string" ? { [arg1]: arg2 } : arg1)
    return query
  })
  query.forUpdate = vi.fn(() => {
    onForUpdate(tableName)
    return query
  })
  query.first = vi.fn(async () => readRows()[0])
  query.insert = vi.fn(async (payload: Row) => {
    const table = state[tableName] ?? (state[tableName] = [])
    const row =
      tableName === "directus_sessions" ? { ...payload } : { id: table.length + 1, ...payload }
    table.push(row)
    onWrite({
      operation: "insert",
      table: tableName,
      where: [],
      payload: structuredClone(payload),
    })
    snapshots.push(structuredClone(state))
    return [row.id]
  })
  query.update = vi.fn(async (payload: Row) => {
    const table = state[tableName] ?? (state[tableName] = [])
    let updated = 0

    for (const row of table) {
      if (matchesWhere(row, clauses)) {
        Object.assign(row, payload)
        updated += 1
      }
    }

    onWrite({
      operation: "update",
      table: tableName,
      where: structuredClone(clauses),
      payload: structuredClone(payload),
    })
    snapshots.push(structuredClone(state))
    return updated
  })
  query.del = vi.fn(async () => {
    const table = state[tableName] ?? (state[tableName] = [])
    const before = table.length
    state[tableName] = table.filter((row) => !matchesWhere(row, clauses))
    onWrite({
      operation: "delete",
      table: tableName,
      where: structuredClone(clauses),
    })
    snapshots.push(structuredClone(state))
    return before - state[tableName].length
  })
  query.then = (resolve: (value: Row[]) => unknown, reject: (reason: unknown) => unknown) =>
    Promise.resolve(readRows()).then(resolve, reject)

  return query
}

function createDatabaseFacade(state: DatabaseState) {
  const snapshots = [structuredClone(state)]
  const forUpdate = vi.fn()
  const writes = vi.fn()
  const database: any = vi.fn((tableName: string) =>
    createTableQuery(state, tableName, snapshots, forUpdate, writes),
  )

  database.select = vi.fn((...columns: unknown[]) => createSelectQuery(state, columns, forUpdate))
  database.__state = state
  database.__snapshots = snapshots
  database.__forUpdate = forUpdate
  database.__writes = writes

  return database
}

export function createDatabase(initialState: DatabaseState = {}) {
  const state = structuredClone(initialState)
  const database = createDatabaseFacade(state)
  const transactions: any[] = []

  database.transaction = vi.fn(async (callback: (transaction: any) => unknown) => {
    const transaction = createDatabaseFacade(state)
    transactions.push(transaction)
    database.__lastTransaction = transaction

    return callback(transaction)
  })
  database.__transactions = transactions
  database.__lastTransaction = null

  return database
}

type ServiceOverrides = Partial<{
  login: (...args: any[]) => unknown
  refresh: (...args: any[]) => unknown
  logout: (...args: any[]) => unknown
  registerUser: (...args: any[]) => unknown
  requestPasswordReset: (...args: any[]) => unknown
  resetPassword: (...args: any[]) => unknown
  readUser: (...args: any[]) => unknown
  readFile: (...args: any[]) => unknown
  deleteFile: (...args: any[]) => unknown
}>

export function createServiceHarness(
  database: ReturnType<typeof createDatabase>,
  overrides: ServiceOverrides = {},
) {
  const loginWithDatabase = async (serviceDatabase: ReturnType<typeof createDatabase>) => {
    const sessions =
      serviceDatabase.__state.directus_sessions ?? (serviceDatabase.__state.directus_sessions = [])

    if (!sessions.some((session: Row) => session.token === "refresh-token")) {
      await serviceDatabase("directus_sessions").insert({
        token: "refresh-token",
        user: "user-1",
        oauth_client: null,
        created_at: "2099-01-01T00:00:00.000Z",
        expires: "2099-01-02T00:00:00.000Z",
      })
    }

    return {
      accessToken: "access-token",
      refreshToken: "refresh-token",
      expires: 900,
      id: "user-1",
    }
  }

  const refreshWithDatabase = async (
    serviceDatabase: ReturnType<typeof createDatabase>,
    refreshToken: string,
  ) => {
    await serviceDatabase("directus_sessions")
      .where({ token: refreshToken })
      .update({ token: "next-refresh-token" })

    return {
      accessToken: "next-access-token",
      refreshToken: "next-refresh-token",
      expires: 900,
      id: "user-1",
    }
  }

  const logoutWithDatabase = async (
    serviceDatabase: ReturnType<typeof createDatabase>,
    refreshToken: string,
  ) => {
    await serviceDatabase("directus_sessions").where({ token: refreshToken }).del()
  }

  const methods = {
    login: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn(),
    registerUser: vi.fn(overrides.registerUser ?? (async () => undefined)),
    requestPasswordReset: vi.fn(overrides.requestPasswordReset ?? (async () => undefined)),
    resetPassword: vi.fn(overrides.resetPassword ?? (async () => undefined)),
    readUser: vi.fn(overrides.readUser ?? (async (id: string) => ({ id, email: "a@example.com" }))),
    readFile: vi.fn(
      overrides.readFile ??
        (async (id: string) => {
          const file = database.__state.directus_files?.find((row: Row) => row.id === id)
          if (!file) {
            throw createDirectusError("FORBIDDEN", "You don't have permission to access this.", 403)
          }

          return { ...file }
        }),
    ),
    deleteFile: vi.fn(
      overrides.deleteFile ??
        (async (id: string) => {
          database.__state.directus_files = (database.__state.directus_files ?? []).filter(
            (row: Row) => row.id !== id,
          )
        }),
    ),
  }

  const constructors = {
    authentication: vi.fn(),
    users: vi.fn(),
    files: vi.fn(),
  }

  function getServiceDatabase(options: unknown) {
    if (typeof options === "object" && options !== null && "knex" in options) {
      const knex = (options as { knex?: unknown }).knex
      if (typeof knex === "function") {
        return knex as ReturnType<typeof createDatabase>
      }
    }

    return database
  }

  class AuthenticationService {
    private readonly database: ReturnType<typeof createDatabase>

    constructor(options: unknown) {
      constructors.authentication(options)
      this.database = getServiceDatabase(options)
    }

    login(...args: any[]) {
      methods.login(...args)
      return overrides.login ? overrides.login(...args) : loginWithDatabase(this.database)
    }

    refresh(...args: any[]) {
      methods.refresh(...args)
      return overrides.refresh
        ? overrides.refresh(...args)
        : refreshWithDatabase(this.database, args[0])
    }

    logout(...args: any[]) {
      methods.logout(...args)
      return overrides.logout
        ? overrides.logout(...args)
        : logoutWithDatabase(this.database, args[0])
    }
  }

  class UsersService {
    constructor(options: unknown) {
      constructors.users(options)
    }

    registerUser(...args: any[]) {
      return methods.registerUser(...args)
    }

    requestPasswordReset(...args: any[]) {
      return methods.requestPasswordReset(...args)
    }

    resetPassword(...args: any[]) {
      return methods.resetPassword(...args)
    }

    readOne(...args: any[]) {
      return methods.readUser(...args)
    }
  }

  class FilesService {
    constructor(options: unknown) {
      constructors.files(options)
    }

    readOne(...args: any[]) {
      return methods.readFile(...args)
    }

    deleteOne(...args: any[]) {
      return methods.deleteFile(...args)
    }
  }

  return {
    services: {
      AuthenticationService,
      UsersService,
      FilesService,
    },
    methods,
    constructors,
  }
}

export function createContext(options?: {
  database?: ReturnType<typeof createDatabase>
  serviceOverrides?: ServiceOverrides
}) {
  const database = options?.database ?? createDatabase()
  const harness = createServiceHarness(database, options?.serviceOverrides)
  const schema = { collections: {} }
  const getSchema = vi.fn(async () => schema)
  const logger = {
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    child: vi.fn(),
  }

  return {
    context: {
      services: harness.services,
      database,
      env: {},
      logger,
      emitter: {},
      getSchema,
    },
    database,
    getSchema,
    logger,
    schema,
    ...harness,
  }
}

export async function registerExtension(router: ReturnType<typeof createRouter>, context: unknown) {
  const extensionModule = await import("../../extensions/directus-extension-tabora/src/index")
  const extension = extensionModule.default as unknown

  const handler =
    typeof extension === "function"
      ? extension
      : (extension as { handler?: unknown } | null)?.handler

  if (typeof handler !== "function") {
    throw new TypeError("Expected defineEndpoint to provide a registration function")
  }

  handler(router as never, context as never)
}

export function firstForwardedError(next: ReturnType<typeof vi.fn>) {
  const error = next.mock.calls[0]?.[0]
  if (!(error instanceof Error)) {
    throw new TypeError("Expected route to forward an Error to next()")
  }

  return error as Error & { code?: string; status?: number }
}
