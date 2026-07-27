# Directus → Strapi 后端迁移 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 将 `backend/directus`（Directus 12 自定义扩展）完整重写为 Strapi 5 后端，客户端 `packages/auth`、`packages/sync` 重命名重指向，同步文档。

**架构：** 官方 CLI 生成 Strapi 5 骨架；认证走 users-permissions 原生纯 JWT；同步与附件用自定义 controller/service 移植（契约保持）；SQLite dev + pg 生产；客户端 `Directus*` 符号彻底重命名为 `Strapi*`；`backend/directus` 全绿后删除。

**技术栈：** Strapi 5 (TypeScript)、users-permissions 插件、upload 插件、zod、vitest、pnpm、SQLite/PostgreSQL。

**设计源：** `docs/superpowers/specs/2026-07-27-directus-to-strapi-migration-design.md`

---

## 文件结构与职责

**新建（Strapi 后端，CLI 生成骨架 + 增量）：**

- `backend/strapi/config/database.ts` — SQLite dev / pg prod，env 驱动
- `backend/strapi/config/plugins.ts` — users-permissions JWT expiresIn；upload provider
- `backend/strapi/config/server.ts`、`middlewares.ts` — APP_KEYS、CORS
- `backend/strapi/src/api/sync/` — content-type `synced-record` + push/pull controller/service/routes
- `backend/strapi/src/api/attachment-policy/`、`attachment-ref/` — content-types
- `backend/strapi/src/api/attachment/` — prepare/commit/bind controller/service/routes
- `backend/strapi/src/utils/sensitiveFilter.ts` — 从 directus 原样移植
- `backend/strapi/tests/` — vitest 契约测试
- `backend/strapi/docker/`、`Dockerfile` — 从 directus 迁移改写

**修改（客户端 + 接线）：**

- `packages/auth/src/strapiAuthClient.ts`（重命名自 `directusAuthClient.ts`）— 纯 JWT
- `packages/auth/src/errors.ts` — `mapDirectusError` → `mapStrapiError`
- `packages/auth/src/index.ts` — 导出改名
- `packages/sync/src/strapiGatewayClient.ts`（重命名自 `directusGatewayClient.ts`）
- `packages/sync/src/syncEngine.ts`、`index.ts` — 类型改名
- `packages/workbench-app/src/runtime/bootstrap.ts:2,405`、`syncManager.ts:1,5,36` — 消费方改名
- `package.json`、`pnpm-workspace.yaml`、`vitest.config.ts` — 脚本/workspace/入口
- `infra/docker/compose.directus.yml` → `compose.strapi.yml`

**删除（最后阶段）：**

- 整个 `backend/directus/`

---

## 阶段 A：生成 Strapi 骨架并接入 pnpm 工作区

### 任务 A1：用官方 CLI 生成 Strapi 5 项目

**文件：**

- 创建：`backend/strapi/**`（CLI 生成）

- [ ] **步骤 1：运行官方 CLI 生成骨架**

在仓库根目录运行（`--no-run` 不自动启动，dbclient sqlite）：

```bash
cd backend
npx create-strapi-app@latest strapi --typescript --no-run --skip-cloud --dbclient=sqlite --use-yarn=false
```

若 CLI 交互仍要求选包管理器/示例数据，选择：包管理器 pnpm、不装示例数据、跳过 cloud 登录。

- [ ] **步骤 2：确认骨架生成**

运行：`ls backend/strapi/config backend/strapi/src`
预期：出现 `config/{database,server,admin,middlewares,plugins}.ts` 与 `src/index.ts`、`src/api/`。

- [ ] **步骤 3：改包名，纳入工作区**

修改 `backend/strapi/package.json` 的 `name` 字段为 `@tabora/strapi-backend`，`private: true`。

- [ ] **步骤 4：删除 CLI 可能生成的 lockfile / node_modules（用仓库 pnpm 统一装）**

```bash
rm -rf backend/strapi/node_modules backend/strapi/package-lock.json backend/strapi/yarn.lock
```

- [ ] **步骤 5：Commit**

```bash
git add backend/strapi
git commit -m "feat(strapi): 用官方 CLI 生成 Strapi 5 骨架"
```

### 任务 A2：接入 pnpm 工作区并安装依赖

**文件：**

- 修改：`pnpm-workspace.yaml:6-7`

- [ ] **步骤 1：把 strapi 加入工作区，暂保留 directus**

将 `pnpm-workspace.yaml` 中：

```yaml
- backend/directus
- backend/directus/extensions/*
```

改为（新增 strapi 行，directus 行暂留到阶段 F 删除）：

```yaml
- backend/directus
- backend/directus/extensions/*
- backend/strapi
```

- [ ] **步骤 2：安装依赖**

运行：`pnpm install`
预期：`@tabora/strapi-backend` 被识别，安装成功无 workspace 错误。

- [ ] **步骤 3：确认 Strapi 可构建**

运行：`pnpm --dir backend/strapi build`
预期：Strapi admin 构建成功（首次较慢）。

- [ ] **步骤 4：Commit**

```bash
git add pnpm-workspace.yaml pnpm-lock.yaml
git commit -m "chore(strapi): 接入 pnpm 工作区"
```

### 任务 A3：配置数据库（SQLite dev + pg 生产）

**文件：**

- 修改：`backend/strapi/config/database.ts`

- [ ] **步骤 1：写 env 驱动的 database 配置**

将 `backend/strapi/config/database.ts` 内容改为：

```typescript
import path from "path"

export default ({ env }) => {
  const client = env("DATABASE_CLIENT", "sqlite")

  const connections = {
    sqlite: {
      connection: {
        filename: path.join(__dirname, "..", "..", env("DATABASE_FILENAME", ".tmp/data.db")),
      },
      useNullAsDefault: true,
    },
    postgres: {
      connection: {
        host: env("DATABASE_HOST", "localhost"),
        port: env.int("DATABASE_PORT", 5432),
        database: env("DATABASE_NAME", "tabora"),
        user: env("DATABASE_USERNAME", "tabora"),
        password: env("DATABASE_PASSWORD", ""),
        ssl: env.bool("DATABASE_SSL", false),
      },
      pool: { min: env.int("DATABASE_POOL_MIN", 2), max: env.int("DATABASE_POOL_MAX", 10) },
    },
  }

  return {
    connection: {
      client,
      ...connections[client],
      acquireConnectionTimeout: env.int("DATABASE_CONNECTION_TIMEOUT", 60000),
    },
  }
}
```

- [ ] **步骤 2：确认 dev 用 sqlite 能启动**

运行：`pnpm --dir backend/strapi develop` （启动后 Ctrl+C）
预期：Strapi 在 `http://localhost:1337` 启动，SQLite 库文件生成于 `backend/strapi/.tmp/data.db`。

- [ ] **步骤 3：记录必需 env**

在 `backend/strapi/.env.example` 追加（若不存在则创建）：

```env
DATABASE_CLIENT=sqlite
DATABASE_FILENAME=.tmp/data.db
# 生产：DATABASE_CLIENT=postgres 并配置 DATABASE_HOST/PORT/NAME/USERNAME/PASSWORD/SSL
```

- [ ] **步骤 4：Commit**

```bash
git add backend/strapi/config/database.ts backend/strapi/.env.example
git commit -m "feat(strapi): 配置 sqlite dev + pg 生产数据库"
```

## 阶段 B：认证 — Strapi 原生纯 JWT + 客户端重写

后端认证零自定义逻辑，仅配置。主要工作在客户端 `packages/auth` 重写。

### 任务 B1：配置 users-permissions JWT 与注册

**文件：**

- 修改：`backend/strapi/config/plugins.ts`（不存在则创建）

- [ ] **步骤 1：配置 JWT 过期**

将 `backend/strapi/config/plugins.ts` 设为：

```typescript
export default ({ env }) => ({
  "users-permissions": {
    config: {
      jwt: {
        expiresIn: env("JWT_EXPIRES_IN", "30d"),
      },
    },
  },
})
```

- [ ] **步骤 2：确认原生认证端点可用**

启动 `pnpm --dir backend/strapi develop`，另开终端：

```bash
curl -s -X POST http://localhost:1337/api/auth/local/register \
  -H 'Content-Type: application/json' \
  -d '{"username":"t1","email":"t1@example.com","password":"secret123"}'
```

预期：返回 `{ jwt, user }`（首次需在 admin 里对 Public/Authenticated 角色允许 auth 权限，若 403 则在 admin `Settings > Roles` 开启 register/callback；记录此手动步骤到 `backend/strapi/README.md`）。

- [ ] **步骤 3：Commit**

```bash
git add backend/strapi/config/plugins.ts
git commit -m "feat(strapi): 配置纯 JWT 认证过期"
```

### 任务 B2：重写 auth 错误映射（`mapDirectusError` → `mapStrapiError`）

**文件：**

- 修改：`packages/auth/src/errors.ts`
- 测试：`packages/auth/src/errors.test.ts`

- [ ] **步骤 1：改写测试为 Strapi 错误体**

将 `packages/auth/src/errors.test.ts` 中针对 `mapDirectusError` 的用例改为 `mapStrapiError`，断言 Strapi 错误体结构。Strapi 错误体形如 `{ error: { status, name, message } }`，`name` 常见 `ValidationError`（邮箱占用/无效凭证）。核心用例：

```typescript
import { describe, it, expect } from "vitest"
import { mapStrapiError } from "./errors"

describe("mapStrapiError", () => {
  it("401 → INVALID_CREDENTIALS", () => {
    expect(mapStrapiError(401, { error: { name: "UnauthorizedError" } }).code).toBe(
      "INVALID_CREDENTIALS",
    )
  })
  it("邮箱已占用 → EMAIL_IN_USE", () => {
    const body = { error: { name: "ApplicationError", message: "Email is already taken" } }
    expect(mapStrapiError(400, body).code).toBe("EMAIL_IN_USE")
  })
  it("400 校验错误 → INVALID_PAYLOAD", () => {
    expect(mapStrapiError(400, { error: { name: "ValidationError" } }).code).toBe("INVALID_PAYLOAD")
  })
  it("其余 → UNKNOWN", () => {
    expect(mapStrapiError(500, {}).code).toBe("UNKNOWN")
  })
})
```

- [ ] **步骤 2：运行测试验证失败**

运行：`pnpm --dir packages/auth test -- errors`
预期：FAIL，`mapStrapiError is not defined`。

- [ ] **步骤 3：实现 `mapStrapiError`**

将 `packages/auth/src/errors.ts` 中 `mapDirectusError` 替换为（`AuthError`/`AuthErrorCode`/`AUTH_ERROR_MESSAGES` 保持不变）：

```typescript
type StrapiErrorBody = {
  error?: { name?: string; message?: string }
}

/**
 * 将 Strapi API 的错误响应归一化为统一的 AuthError。
 * Strapi 错误体形如 { error: { status, name, message } }。
 */
export function mapStrapiError(status: number, body: unknown): AuthError {
  const error = (body as StrapiErrorBody)?.error
  const message = error?.message ?? ""
  let code: AuthErrorCode = "UNKNOWN"

  if (/already taken|already exists/i.test(message)) {
    code = "EMAIL_IN_USE"
  } else if (error?.name === "ValidationError") {
    code = "INVALID_PAYLOAD"
  } else if (status === 400 || status === 401) {
    code = "INVALID_CREDENTIALS"
  }

  return { code, message: AUTH_ERROR_MESSAGES[code] }
}
```

- [ ] **步骤 4：运行测试验证通过**

运行：`pnpm --dir packages/auth test -- errors`
预期：PASS。

- [ ] **步骤 5：Commit**

```bash
git add packages/auth/src/errors.ts packages/auth/src/errors.test.ts
git commit -m "refactor(auth): 错误映射改为 mapStrapiError"
```

### 任务 B3：重写 auth 客户端为纯 JWT（`directusAuthClient.ts` → `strapiAuthClient.ts`）

**文件：**

- 创建：`packages/auth/src/strapiAuthClient.ts`（重命名自 `directusAuthClient.ts`）
- 删除：`packages/auth/src/directusAuthClient.ts`
- 测试：`packages/auth/src/strapiAuthClient.test.ts`（重命名自 `directusAuthClient.test.ts`）

- [ ] **步骤 1：改写测试为纯 JWT 契约**

将 `packages/auth/src/directusAuthClient.test.ts` 重命名为 `strapiAuthClient.test.ts`，改写核心用例（用 `vi.stubGlobal('fetch', ...)` mock）：

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest"
import { createStrapiAuthClient, type StrapiSession } from "./strapiAuthClient"

function memoryStorage() {
  const map = new Map<string, string>()
  return {
    getItem: async (k: string) => map.get(k) ?? null,
    setItem: async (k: string, v: string) => void map.set(k, v),
    removeItem: async (k: string) => void map.delete(k),
  }
}

describe("createStrapiAuthClient", () => {
  beforeEach(() => vi.restoreAllMocks())

  it("login 存储 jwt 会话", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ jwt: "jwt-1", user: { id: 1 } }), { status: 200 }),
      ),
    )
    const client = createStrapiAuthClient({ apiBaseUrl: "http://x", storage: memoryStorage() })
    const session = await client.login("a@b.com", "pw")
    expect(session.jwt).toBe("jwt-1")
    const stored = await client.getSession()
    expect(stored?.jwt).toBe("jwt-1")
  })

  it("login 用 identifier 字段调用 /api/auth/local", async () => {
    const fetchMock = vi.fn(
      async () => new Response(JSON.stringify({ jwt: "j", user: { id: 1 } }), { status: 200 }),
    )
    vi.stubGlobal("fetch", fetchMock)
    const client = createStrapiAuthClient({ apiBaseUrl: "http://x", storage: memoryStorage() })
    await client.login("a@b.com", "pw")
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe("http://x/api/auth/local")
    expect(JSON.parse(init.body)).toEqual({ identifier: "a@b.com", password: "pw" })
  })

  it("logout 仅清本地，不打后端", async () => {
    const fetchMock = vi.fn(
      async () => new Response(JSON.stringify({ jwt: "j", user: { id: 1 } }), { status: 200 }),
    )
    vi.stubGlobal("fetch", fetchMock)
    const client = createStrapiAuthClient({ apiBaseUrl: "http://x", storage: memoryStorage() })
    await client.login("a@b.com", "pw")
    fetchMock.mockClear()
    await client.logout()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(await client.getSession()).toBeNull()
  })

  it("getCurrentUser 打 /api/users/me 带 Bearer", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.endsWith("/api/auth/local"))
        return new Response(JSON.stringify({ jwt: "j", user: { id: 1 } }), { status: 200 })
      return new Response(JSON.stringify({ id: 1, email: "a@b.com" }), { status: 200 })
    })
    vi.stubGlobal("fetch", fetchMock)
    const client = createStrapiAuthClient({ apiBaseUrl: "http://x", storage: memoryStorage() })
    await client.login("a@b.com", "pw")
    const me = await client.getCurrentUser()
    expect(me?.email).toBe("a@b.com")
    const meCall = fetchMock.mock.calls.find(([u]) => String(u).endsWith("/api/users/me"))
    expect(meCall?.[1].headers.Authorization).toBe("Bearer j")
  })
})
```

- [ ] **步骤 2：运行测试验证失败**

运行：`pnpm --dir packages/auth test -- strapiAuthClient`
预期：FAIL，模块不存在。

- [ ] **步骤 3：实现纯 JWT 客户端**

创建 `packages/auth/src/strapiAuthClient.ts`（先写类型与骨架，见下方步骤 3b 补全方法体）：

```typescript
import type { AuthStorage } from "@tabora/host-adapters"
import { mapStrapiError, type AuthError } from "./errors"

const SESSION_KEY = "tabora.auth.session"

export type StrapiSession = {
  jwt: string
  userId?: number
  expiresAt?: number
}

export type CurrentUser = {
  id: number
  email?: string
  username?: string
}

export type StrapiAuthClientConfig = {
  apiBaseUrl: string
  storage: AuthStorage
}

export type StrapiAuthClient = {
  register(email: string, password: string): Promise<void>
  login(email: string, password: string): Promise<StrapiSession>
  logout(): Promise<void>
  getSession(): Promise<StrapiSession | null>
  getCurrentUser(): Promise<CurrentUser | null>
  requestPasswordReset(email: string): Promise<void>
  resetPassword(code: string, newPassword: string): Promise<void>
}

function networkError(): AuthError {
  return { code: "NETWORK_ERROR", message: "网络异常，请稍后重试" }
}

type LoginResponse = { jwt: string; user: { id: number } }
```

- [ ] **步骤 3b：补全工厂函数**

在同文件追加（HTTP 辅助沿用 directus 版结构，但解析 Strapi 顶层响应、错误走 `mapStrapiError`）：

```typescript
export function createStrapiAuthClient(config: StrapiAuthClientConfig): StrapiAuthClient {
  const base = config.apiBaseUrl.replace(/\/$/, "")

  async function post<T>(path: string, body: unknown, jwt?: string): Promise<T> {
    let response: Response
    try {
      response = await fetch(`${base}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
        },
        body: JSON.stringify(body),
      })
    } catch {
      throw networkError()
    }
    let parsed: unknown = null
    if (response.status !== 204) {
      try {
        parsed = await response.json()
      } catch {
        parsed = null
      }
    }
    if (!response.ok) throw mapStrapiError(response.status, parsed)
    return parsed as T
  }

  async function readStored(): Promise<StrapiSession | null> {
    const raw = await config.storage.getItem(SESSION_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as StrapiSession
    } catch {
      return null
    }
  }

  async function writeStored(session: StrapiSession): Promise<void> {
    await config.storage.setItem(SESSION_KEY, JSON.stringify(session))
  }

  return {
    async register(email, password) {
      await post("/api/auth/local/register", { username: email, email, password })
    },
    async login(email, password) {
      const data = await post<LoginResponse>("/api/auth/local", {
        identifier: email,
        password,
      })
      const session: StrapiSession = { jwt: data.jwt, userId: data.user.id }
      await writeStored(session)
      return session
    },
    async logout() {
      await config.storage.removeItem(SESSION_KEY)
    },
    getSession() {
      return readStored()
    },
    async getCurrentUser() {
      const session = await readStored()
      if (!session) return null
      let response: Response
      try {
        response = await fetch(`${base}/api/users/me`, {
          headers: { Authorization: `Bearer ${session.jwt}` },
        })
      } catch {
        throw networkError()
      }
      if (!response.ok) {
        if (response.status === 401) await config.storage.removeItem(SESSION_KEY)
        return null
      }
      return (await response.json()) as CurrentUser
    },
    async requestPasswordReset(email) {
      await post("/api/auth/forgot-password", { email })
    },
    async resetPassword(code, newPassword) {
      try {
        await post("/api/auth/reset-password", {
          code,
          password: newPassword,
          passwordConfirmation: newPassword,
        })
      } catch (error) {
        const authError = error as AuthError
        if (authError.code === "INVALID_PAYLOAD" || authError.code === "UNKNOWN") {
          throw { code: "RESET_INVALID", message: "验证码错误或已过期" } satisfies AuthError
        }
        throw error
      }
    },
  }
}
```

- [ ] **步骤 4：删除旧文件，运行测试验证通过**

```bash
git rm packages/auth/src/directusAuthClient.ts
```

运行：`pnpm --dir packages/auth test -- strapiAuthClient`
预期：PASS。

- [ ] **步骤 5：Commit**

```bash
git add packages/auth/src/strapiAuthClient.ts packages/auth/src/strapiAuthClient.test.ts
git commit -m "refactor(auth): 重写为 Strapi 纯 JWT 客户端"
```

### 任务 B4：更新 auth 包导出

**文件：**

- 修改：`packages/auth/src/index.ts`

- [ ] **步骤 1：改导出为 Strapi 命名**

将 `packages/auth/src/index.ts` 改为：

```typescript
export {
  createStrapiAuthClient,
  type StrapiAuthClient,
  type StrapiAuthClientConfig,
  type StrapiSession,
  type CurrentUser,
} from "./strapiAuthClient"

export { mapStrapiError, AUTH_ERROR_MESSAGES, type AuthError, type AuthErrorCode } from "./errors"
```

- [ ] **步骤 2：类型检查**

运行：`pnpm --dir packages/auth check`（或 `pnpm --dir packages/auth exec tsc --noEmit`）
预期：`packages/auth` 内部无类型错误（消费方 workbench-app 的错误留待任务 E1 修）。

- [ ] **步骤 3：Commit**

```bash
git add packages/auth/src/index.ts
git commit -m "refactor(auth): 导出改为 Strapi 命名"
```

## 阶段 C：同步网关 — 后端 content-type + controller 移植

### 任务 C1：生成 `synced-record` content-type

**文件：**

- 创建：`backend/strapi/src/api/synced-record/content-types/synced-record/schema.json`（用 CLI 生成）

- [ ] **步骤 1：用 CLI 生成 content-type**

```bash
cd backend/strapi
npx strapi generate content-type
```

交互选择：displayName `synced-record`，API `synced-record`，kind `collectionType`，draft&publish 否。字段稍后在 schema.json 里补齐。

- [ ] **步骤 2：补齐 schema.json 字段**

将生成的 `backend/strapi/src/api/synced-record/content-types/synced-record/schema.json` 的 `attributes` 设为（`collectionName` 保持 `synced_records` 以对齐旧表名）：

```json
{
  "kind": "collectionType",
  "collectionName": "synced_records",
  "info": {
    "singularName": "synced-record",
    "pluralName": "synced-records",
    "displayName": "SyncedRecord"
  },
  "options": { "draftAndPublish": false },
  "attributes": {
    "record_type": {
      "type": "enumeration",
      "enum": ["workspace", "pluginInstance", "plugin", "pluginData"],
      "required": true
    },
    "record_id": { "type": "string", "required": true, "maxLength": 255 },
    "data": { "type": "json" },
    "version": { "type": "integer", "required": true, "default": 0 },
    "device_id": { "type": "string", "required": true, "maxLength": 255 },
    "record_updated_at": { "type": "datetime", "required": true },
    "deleted": { "type": "boolean", "default": false },
    "owner": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "plugin::users-permissions.user"
    }
  }
}
```

（用 `owner` 关联而非 `user_id` 列；query 时按 `owner.id === ctx.state.user.id` 过滤。）

- [ ] **步骤 3：确认表创建**

运行：`pnpm --dir backend/strapi develop`（启动后 Ctrl+C）
预期：启动日志无 schema 错误，SQLite 中出现 `synced_records` 表。

- [ ] **步骤 4：Commit**

```bash
git add backend/strapi/src/api/synced-record
git commit -m "feat(strapi): 新增 synced-record content-type"
```

### 任务 C2：移植敏感字段过滤器

**文件：**

- 创建：`backend/strapi/src/utils/sensitiveFilter.ts`
- 测试：`backend/strapi/tests/sensitiveFilter.test.ts`

- [ ] **步骤 1：原样移植过滤器**

将 `backend/directus/extensions/directus-extension-tabora/src/syncSensitiveFilter.ts` 内容复制到 `backend/strapi/src/utils/sensitiveFilter.ts`（逻辑零改动，仅函数名保持 `findSensitiveFieldPath`）。

- [ ] **步骤 2：写测试**

创建 `backend/strapi/tests/sensitiveFilter.test.ts`：

```typescript
import { describe, it, expect } from "vitest"
import { findSensitiveFieldPath } from "../src/utils/sensitiveFilter"

describe("findSensitiveFieldPath", () => {
  it("命中关键字 token", () => {
    expect(findSensitiveFieldPath({ apiToken: "x" })).toBe("apiToken")
  })
  it("命中文件路径", () => {
    expect(findSensitiveFieldPath({ note: "/Users/me/f" })).toBe("note")
  })
  it("嵌套安全对象返回 null", () => {
    expect(findSensitiveFieldPath({ a: { b: 1 } })).toBeNull()
  })
})
```

- [ ] **步骤 3：运行测试验证通过**

运行：`pnpm --dir backend/strapi exec vitest run tests/sensitiveFilter.test.ts`
预期：PASS。

- [ ] **步骤 4：Commit**

```bash
git add backend/strapi/src/utils/sensitiveFilter.ts backend/strapi/tests/sensitiveFilter.test.ts
git commit -m "feat(strapi): 移植同步敏感字段过滤器"
```

### 任务 C3：实现 sync controller/routes（push/pull + 冲突检测）

**文件：**

- 创建：`backend/strapi/src/api/sync/controllers/sync.ts`
- 创建：`backend/strapi/src/api/sync/routes/sync.ts`
- 创建：`backend/strapi/src/api/sync/services/sync.ts`
- 测试：`backend/strapi/tests/sync.contract.test.ts`

- [ ] **步骤 1：写自定义路由**

创建 `backend/strapi/src/api/sync/routes/sync.ts`（`type: 'content-api'` 使其走 JWT 鉴权）：

```typescript
export default {
  routes: [
    {
      method: "GET",
      path: "/sync/records",
      handler: "sync.pull",
      config: { policies: [] },
    },
    {
      method: "POST",
      path: "/sync/records",
      handler: "sync.push",
      config: { policies: [] },
    },
  ],
}
```

- [ ] **步骤 2：写 service（纯逻辑，便于单测）**

创建 `backend/strapi/src/api/sync/services/sync.ts`，移植 directus `sync.ts` 的纯函数（`toEpochMs`、`isConflict`、`toResponseRecord`）与常量：

```typescript
const RECORD_TYPES = ["workspace", "pluginInstance", "plugin", "pluginData"] as const
export const MAX_PUSH_BATCH = 100
export const MAX_PULL_LIMIT = 1000

export function toEpochMs(value: string | Date): number {
  return value instanceof Date ? value.getTime() : Date.parse(value)
}

export type SyncedRecordRow = {
  id: number
  record_type: string
  record_id: string
  data: unknown
  version: number
  device_id: string
  record_updated_at: string | Date
  deleted: boolean
}

export function toResponseRecord(row: SyncedRecordRow) {
  return {
    type: row.record_type,
    id: row.record_id,
    data: row.deleted ? null : row.data,
    version: row.version,
    updated_at: new Date(row.record_updated_at).toISOString(),
    deleted: row.deleted,
    device_id: row.device_id,
  }
}

export function isConflict(
  row: SyncedRecordRow,
  record: { version: number | null; client_timestamp: string },
): boolean {
  if (record.version !== null && record.version !== row.version) return true
  return toEpochMs(record.client_timestamp) <= toEpochMs(row.record_updated_at)
}

export default () => ({ toEpochMs, isConflict, toResponseRecord })
```

- [ ] **步骤 3：写 controller（zod 校验 + 事务，移植 push/pull）**

创建 `backend/strapi/src/api/sync/controllers/sync.ts`。用户从 `ctx.state.user` 取；DB 用 `strapi.db.query('api::synced-record.synced-record')` + `strapi.db.transaction`；敏感过滤走 `findSensitiveFieldPath`：

```typescript
import { z } from "zod"
import { findSensitiveFieldPath } from "../../../utils/sensitiveFilter"
import {
  MAX_PUSH_BATCH,
  MAX_PULL_LIMIT,
  toEpochMs,
  isConflict,
  toResponseRecord,
  type SyncedRecordRow,
} from "../services/sync"

const RECORD_TYPES = ["workspace", "pluginInstance", "plugin", "pluginData"] as const

const pushRecordSchema = z.object({
  type: z.enum(RECORD_TYPES),
  id: z.string().min(1).max(255),
  data: z.unknown().nullable(),
  version: z.number().int().positive().nullable(),
  client_timestamp: z.string().datetime(),
  device_id: z.string().min(1).max(255),
  deleted: z.boolean(),
})
const pushBodySchema = z.array(pushRecordSchema).min(1).max(MAX_PUSH_BATCH)

const UID = "api::synced-record.synced-record"

export default {
  async pull(ctx) {
    const userId = ctx.state.user?.id
    if (!userId) return ctx.unauthorized()

    const since = typeof ctx.query.since === "string" ? ctx.query.since : undefined
    const types =
      typeof ctx.query.types === "string"
        ? ctx.query.types.split(",").filter((t) => RECORD_TYPES.includes(t as never))
        : undefined

    let rows = (await strapi.db.query(UID).findMany({
      where: { owner: userId },
      orderBy: { record_updated_at: "asc" },
      populate: [],
    })) as SyncedRecordRow[]

    if (since) {
      const sinceMs = toEpochMs(since)
      rows = rows.filter((r) => toEpochMs(r.record_updated_at) > sinceMs)
    }
    if (types) rows = rows.filter((r) => types.includes(r.record_type))

    ctx.body = {
      data: {
        records: rows.slice(0, MAX_PULL_LIMIT).map(toResponseRecord),
        server_time: new Date().toISOString(),
      },
    }
  },

  async push(ctx) {
    const userId = ctx.state.user?.id
    if (!userId) return ctx.unauthorized()

    const parsed = pushBodySchema.safeParse(ctx.request.body)
    if (!parsed.success) return ctx.badRequest("invalid payload", parsed.error.issues)
    const records = parsed.data

    const accepted: string[] = []
    const conflicts: unknown[] = []
    const rejected: Array<{ id: string; reason: string }> = []

    await strapi.db.transaction(async () => {
      for (const record of records) {
        const sensitivePath = findSensitiveFieldPath(record.data)
        if (sensitivePath !== null) {
          rejected.push({ id: record.id, reason: `sensitive field: ${sensitivePath}` })
          continue
        }

        const row = (await strapi.db.query(UID).findOne({
          where: { owner: userId, record_type: record.type, record_id: record.id },
        })) as (SyncedRecordRow & { id: number }) | null

        if (row && isConflict(row, record)) {
          conflicts.push({
            type: record.type,
            id: record.id,
            server_version: row.version,
            server_data: row.data,
            server_updated_at: new Date(row.record_updated_at).toISOString(),
            server_device_id: row.device_id,
          })
          continue
        }

        const now = new Date().toISOString()
        const payload = {
          owner: userId,
          device_id: record.device_id,
          record_type: record.type,
          record_id: record.id,
          data: record.deleted ? null : record.data,
          version: (row?.version ?? 0) + 1,
          record_updated_at: now,
          deleted: record.deleted,
        }

        if (row) await strapi.db.query(UID).update({ where: { id: row.id }, data: payload })
        else await strapi.db.query(UID).create({ data: payload })

        accepted.push(record.id)
      }
    })

    ctx.body = { data: { accepted, conflicts, rejected, server_time: new Date().toISOString() } }
  },
}
```

- [ ] **步骤 4：service 纯函数单测**

创建 `backend/strapi/tests/sync.contract.test.ts`（先只测纯函数，端到端在阶段 D 集成测试覆盖）：

```typescript
import { describe, it, expect } from "vitest"
import { isConflict, toResponseRecord, toEpochMs } from "../src/api/sync/services/sync"

describe("sync 冲突检测", () => {
  const base = {
    id: 1,
    record_type: "workspace",
    record_id: "w1",
    data: {},
    version: 3,
    device_id: "d1",
    record_updated_at: "2026-07-27T00:00:00.000Z",
    deleted: false,
  }

  it("version 不匹配 → 冲突", () => {
    expect(isConflict(base, { version: 2, client_timestamp: "2026-07-28T00:00:00.000Z" })).toBe(
      true,
    )
  })
  it("client_timestamp 不晚于服务端 → 冲突", () => {
    expect(isConflict(base, { version: null, client_timestamp: "2026-07-26T00:00:00.000Z" })).toBe(
      true,
    )
  })
  it("version null 且时间更新 → 不冲突", () => {
    expect(isConflict(base, { version: null, client_timestamp: "2026-07-28T00:00:00.000Z" })).toBe(
      false,
    )
  })
  it("toResponseRecord: deleted 时 data 为 null", () => {
    expect(toResponseRecord({ ...base, deleted: true }).data).toBeNull()
  })
  it("toEpochMs 兼容 Date 与字符串", () => {
    expect(toEpochMs(new Date("2026-07-27T00:00:00Z"))).toBe(toEpochMs("2026-07-27T00:00:00Z"))
  })
})
```

- [ ] **步骤 5：运行测试验证通过**

运行：`pnpm --dir backend/strapi exec vitest run tests/sync.contract.test.ts`
预期：PASS。

- [ ] **步骤 6：Commit**

```bash
git add backend/strapi/src/api/sync backend/strapi/tests/sync.contract.test.ts
git commit -m "feat(strapi): 移植同步 push/pull + 冲突检测"
```

### 任务 C4：重命名 sync 网关客户端（`directusGatewayClient` → `strapiGatewayClient`）

**文件：**

- 创建：`packages/sync/src/strapiGatewayClient.ts`（重命名自 `directusGatewayClient.ts`）
- 删除：`packages/sync/src/directusGatewayClient.ts`
- 测试：`packages/sync/src/strapiGatewayClient.test.ts`（重命名自旧测试）

- [ ] **步骤 1：重命名测试并把 `Directus*` 符号改为 `Strapi*`**

将 `packages/sync/src/directusGatewayClient.test.ts` 重命名为 `strapiGatewayClient.test.ts`，全局替换：`createDirectusGatewayClient` → `createStrapiGatewayClient`，`Directus*` 类型 → `Strapi*`。请求路径断言从 `/sync/records` 改为 `/api/sync/records`。

- [ ] **步骤 2：运行测试验证失败**

运行：`pnpm --dir packages/sync test -- strapiGatewayClient`
预期：FAIL，模块不存在。

- [ ] **步骤 3：重命名实现文件并改符号名 + 路径**

将 `packages/sync/src/directusGatewayClient.ts` 内容移到 `strapiGatewayClient.ts`，做以下机械替换（逻辑零改动）：

- 所有 `Directus` 前缀类型/函数 → `Strapi`（`DirectusGatewayError`→`StrapiGatewayError`、`createDirectusGatewayClient`→`createStrapiGatewayClient`、`DirectusPushResponse`→`StrapiPushResponse` 等）
- 请求路径 `"/sync/records"` → `"/api/sync/records"`（push 与 pull 两处）
- 错误体解析 `errors[0].message` 改为兼容 Strapi 的 `error.message`：

```typescript
function extractMessage(body: unknown, code: StrapiGatewayError["code"]): string {
  const strapiMsg = (body as { error?: { message?: string } })?.error?.message
  if (typeof strapiMsg === "string" && strapiMsg.length > 0) return strapiMsg
  return ERROR_MESSAGES[code]
}
```

- [ ] **步骤 4：删除旧文件，运行测试验证通过**

```bash
git rm packages/sync/src/directusGatewayClient.ts
```

运行：`pnpm --dir packages/sync test -- strapiGatewayClient`
预期：PASS。

- [ ] **步骤 5：更新 `syncEngine.ts` 与 `index.ts` 的类型引用**

- `packages/sync/src/syncEngine.ts:3,17`：`DirectusGatewayClient` → `StrapiGatewayClient`（import 路径改 `./strapiGatewayClient`）
- `packages/sync/src/index.ts:31-50`：把 re-export 的 auth 符号更新为 `createStrapiAuthClient`/`StrapiAuthClient`/`StrapiSession`（来自 `@tabora/auth`），gateway 符号 `Directus*` → `Strapi*`，from 改 `./strapiGatewayClient`。

- [ ] **步骤 6：类型检查并 commit**

运行：`pnpm --dir packages/sync check`
预期：`packages/sync` 内部无类型错误。

```bash
git add packages/sync/src
git commit -m "refactor(sync): 网关客户端重命名为 Strapi"
```

## 阶段 D：附件 — Strapi upload 插件

客户端当前未引用 attachments 端点，本阶段仅后端。

### 任务 D1：生成 attachment-policy 与 attachment-ref content-types

**文件：**

- 创建：`backend/strapi/src/api/attachment-policy/content-types/attachment-policy/schema.json`
- 创建：`backend/strapi/src/api/attachment-ref/content-types/attachment-ref/schema.json`

- [ ] **步骤 1：用 CLI 生成两个 content-type**

```bash
cd backend/strapi
npx strapi generate content-type   # displayName attachment-policy
npx strapi generate content-type   # displayName attachment-ref
```

- [ ] **步骤 2：补齐 attachment-policy schema**

`attachment-policy/schema.json` 的 attributes（`collectionName` 保持 `attachment_policies`）：

```json
{
  "record_type_placeholder": "见下",
  "attributes": {
    "entity_type": { "type": "string", "required": true, "maxLength": 128, "unique": true },
    "mime_whitelist": { "type": "json" },
    "max_size_bytes": { "type": "biginteger" }
  }
}
```

（顶层 `kind`/`info`/`collectionName` 沿用 C1 同样结构，`collectionName: "attachment_policies"`。删除示意用的 `record_type_placeholder` 键。）

- [ ] **步骤 3：补齐 attachment-ref schema**

`attachment-ref/schema.json` 的 attributes（`collectionName: "attachment_refs"`）：

```json
{
  "attributes": {
    "entity_type": { "type": "string", "required": true, "maxLength": 128 },
    "entity_id": { "type": "string", "required": true, "maxLength": 512 },
    "file": { "type": "relation", "relation": "oneToOne", "target": "plugin::upload.file" },
    "uploaded_by": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "plugin::users-permissions.user"
    }
  }
}
```

- [ ] **步骤 4：确认表创建并 commit**

运行：`pnpm --dir backend/strapi develop`（启动后 Ctrl+C）
预期：`attachment_policies`、`attachment_refs` 表创建，无 schema 错误。

```bash
git add backend/strapi/src/api/attachment-policy backend/strapi/src/api/attachment-ref
git commit -m "feat(strapi): 新增附件 policy/ref content-types"
```

### 任务 D2：配置 upload provider（dev local / 生产 S3）

**文件：**

- 修改：`backend/strapi/config/plugins.ts`

- [ ] **步骤 1：加 upload provider 配置**

在 `plugins.ts` 返回对象中增加 `upload`（env 切换 local/S3）：

```typescript
    upload: {
      config:
        env('UPLOAD_PROVIDER', 'local') === 'aws-s3'
          ? {
              provider: 'aws-s3',
              providerOptions: {
                s3Options: {
                  region: env('AWS_REGION'),
                  credentials: {
                    accessKeyId: env('AWS_ACCESS_KEY_ID'),
                    secretAccessKey: env('AWS_ACCESS_SECRET'),
                  },
                  params: { Bucket: env('AWS_BUCKET') },
                },
              },
            }
          : { provider: 'local' },
    },
```

- [ ] **步骤 2：生产依赖登记**

在 `backend/strapi/package.json` 的 dependencies 加 `@strapi/provider-upload-aws-s3`（版本与 Strapi 主版本对齐），运行 `pnpm install`。`.env.example` 追加 `UPLOAD_PROVIDER`、`AWS_*`。

- [ ] **步骤 3：Commit**

```bash
git add backend/strapi/config/plugins.ts backend/strapi/package.json backend/strapi/.env.example pnpm-lock.yaml
git commit -m "feat(strapi): 配置 upload provider local/S3"
```

### 任务 D3：实现 attachment controller/routes（prepare/commit/access/bind/unbind）

**文件：**

- 创建：`backend/strapi/src/api/attachment/routes/attachment.ts`
- 创建：`backend/strapi/src/api/attachment/controllers/attachment.ts`
- 创建：`backend/strapi/src/api/attachment/services/attachment.ts`
- 测试：`backend/strapi/tests/attachment.contract.test.ts`

- [ ] **步骤 1：写路由**

创建 `backend/strapi/src/api/attachment/routes/attachment.ts`：

```typescript
export default {
  routes: [
    {
      method: "POST",
      path: "/attachments/prepare",
      handler: "attachment.prepare",
      config: { policies: [] },
    },
    {
      method: "POST",
      path: "/attachments/commit",
      handler: "attachment.commit",
      config: { policies: [] },
    },
    {
      method: "GET",
      path: "/attachments/:id/access",
      handler: "attachment.access",
      config: { policies: [] },
    },
    {
      method: "POST",
      path: "/attachments/:id/bind",
      handler: "attachment.bind",
      config: { policies: [] },
    },
    {
      method: "POST",
      path: "/attachments/:id/unbind",
      handler: "attachment.unbind",
      config: { policies: [] },
    },
  ],
}
```

- [ ] **步骤 2：写 service（policy 校验纯函数）**

创建 `backend/strapi/src/api/attachment/services/attachment.ts`，移植 directus 的 policy 校验逻辑：

```typescript
export type AttachmentPolicy = {
  entity_type: string
  mime_whitelist: string[] | null
  max_size_bytes: number | null
}

export type FileSummary = { id: number; mime?: string; size?: number }

/** 校验文件是否符合 policy；不符抛错。size 单位与 policy 对齐（bytes）。 */
export function validateFileAgainstPolicy(
  file: FileSummary,
  policy: AttachmentPolicy | null,
): void {
  if (!policy) return
  if (
    policy.mime_whitelist &&
    (typeof file.mime !== "string" || !policy.mime_whitelist.includes(file.mime))
  ) {
    throw new Error(
      `MIME type ${String(file.mime ?? "unknown")} is not allowed for ${policy.entity_type}`,
    )
  }
  if (
    policy.max_size_bytes !== null &&
    typeof file.size === "number" &&
    file.size > policy.max_size_bytes
  ) {
    throw new Error(`File size exceeds maximum of ${policy.max_size_bytes} bytes`)
  }
}

export default () => ({ validateFileAgainstPolicy })
```

注：Strapi upload 的 file 记录 `size` 字段单位是 **KB**（浮点），入库前需 `Math.round(size * 1024)` 转 bytes 再比对，或在 policy 侧统一。此处 controller 里做转换。

- [ ] **步骤 3：写 controller**

创建 `backend/strapi/src/api/attachment/controllers/attachment.ts`。upload 文件走 `strapi.plugin('upload').service('upload')` / `strapi.db.query('plugin::upload.file')`；ref 走 `strapi.db.query('api::attachment-ref.attachment-ref')`；policy 走 `api::attachment-policy.attachment-policy`：

```typescript
import { z } from "zod"
import { validateFileAgainstPolicy, type AttachmentPolicy } from "../services/attachment"

const REF_UID = "api::attachment-ref.attachment-ref"
const POLICY_UID = "api::attachment-policy.attachment-policy"
const FILE_UID = "plugin::upload.file"

const prepareSchema = z.object({
  entity_type: z.string().trim().min(1).max(128),
  mime_type: z.string().trim().min(1).max(255),
  size_bytes: z.number().int().positive(),
  filename: z.string().trim().min(1).max(255),
})
const commitSchema = z.object({
  file_id: z.number().int().positive(),
  entity_type: z.string().trim().min(1).max(128),
  entity_id: z.string().trim().min(1).max(512),
})
const bindSchema = z.object({
  entity_type: z.string().trim().min(1).max(128),
  entity_id: z.string().trim().min(1).max(512),
})

async function readPolicy(entityType: string): Promise<AttachmentPolicy | null> {
  const row = await strapi.db.query(POLICY_UID).findOne({ where: { entity_type: entityType } })
  if (!row) return null
  return {
    entity_type: row.entity_type,
    mime_whitelist: row.mime_whitelist ?? null,
    max_size_bytes: row.max_size_bytes ?? null,
  }
}

async function readOwnedFile(fileId: number, userId: number) {
  const ref = await strapi.db.query(REF_UID).findOne({
    where: { file: fileId, uploaded_by: userId },
    populate: { file: true },
  })
  return ref?.file ?? null
}

async function countOwnedRefs(fileId: number, userId: number): Promise<number> {
  return strapi.db.query(REF_UID).count({ where: { file: fileId, uploaded_by: userId } })
}

async function createRefIfMissing(data: {
  file: number
  uploaded_by: number
  entity_type: string
  entity_id: string
}) {
  const existing = await strapi.db.query(REF_UID).findOne({ where: data })
  if (!existing) await strapi.db.query(REF_UID).create({ data })
}

export default {
  async prepare(ctx) {
    if (!ctx.state.user?.id) return ctx.unauthorized()
    const p = prepareSchema.safeParse(ctx.request.body)
    if (!p.success) return ctx.badRequest("invalid payload", p.error.issues)
    const policy = await readPolicy(p.data.entity_type)
    if (policy?.mime_whitelist && !policy.mime_whitelist.includes(p.data.mime_type)) {
      return ctx.badRequest(
        `MIME type ${p.data.mime_type} is not allowed for ${p.data.entity_type}`,
      )
    }
    if (policy?.max_size_bytes != null && p.data.size_bytes > policy.max_size_bytes) {
      return ctx.badRequest(`File size exceeds maximum of ${policy.max_size_bytes} bytes`)
    }
    ctx.body = {
      data: {
        entity_type: p.data.entity_type,
        filename: p.data.filename,
        visibility: "private",
        upload: { method: "strapi-upload", endpoint: "/api/upload" },
        ...(policy ? { policy } : {}),
      },
    }
  },

  async commit(ctx) {
    const userId = ctx.state.user?.id
    if (!userId) return ctx.unauthorized()
    const p = commitSchema.safeParse(ctx.request.body)
    if (!p.success) return ctx.badRequest("invalid payload", p.error.issues)

    const refsCount = await strapi.db.transaction(async () => {
      const file = await strapi.db.query(FILE_UID).findOne({ where: { id: p.data.file_id } })
      if (!file) return ctx.notFound("file not found")
      const policy = await readPolicy(p.data.entity_type)
      validateFileAgainstPolicy(
        {
          id: file.id,
          mime: file.mime,
          size: typeof file.size === "number" ? Math.round(file.size * 1024) : undefined,
        },
        policy,
      )
      await createRefIfMissing({
        file: p.data.file_id,
        uploaded_by: userId,
        entity_type: p.data.entity_type,
        entity_id: p.data.entity_id,
      })
      return countOwnedRefs(p.data.file_id, userId)
    })

    ctx.body = {
      data: {
        file_id: p.data.file_id,
        entity_type: p.data.entity_type,
        entity_id: p.data.entity_id,
        visibility: "private",
        refs_count: refsCount,
      },
    }
  },

  async access(ctx) {
    const userId = ctx.state.user?.id
    if (!userId) return ctx.unauthorized()
    const fileId = Number(ctx.params.id)
    const file = await readOwnedFile(fileId, userId)
    if (!file) return ctx.notFound("attachment not found")
    ctx.body = { data: { file_id: fileId, visibility: "private", asset_url: file.url } }
  },

  async bind(ctx) {
    const userId = ctx.state.user?.id
    if (!userId) return ctx.unauthorized()
    const fileId = Number(ctx.params.id)
    const p = bindSchema.safeParse(ctx.request.body)
    if (!p.success) return ctx.badRequest("invalid payload", p.error.issues)
    const refsCount = await strapi.db.transaction(async () => {
      const file = await readOwnedFile(fileId, userId)
      if (!file) return ctx.notFound("attachment not found")
      const policy = await readPolicy(p.data.entity_type)
      validateFileAgainstPolicy(
        {
          id: file.id,
          mime: file.mime,
          size: typeof file.size === "number" ? Math.round(file.size * 1024) : undefined,
        },
        policy,
      )
      await createRefIfMissing({
        file: fileId,
        uploaded_by: userId,
        entity_type: p.data.entity_type,
        entity_id: p.data.entity_id,
      })
      return countOwnedRefs(fileId, userId)
    })
    ctx.body = { data: { file_id: fileId, refs_count: refsCount } }
  },

  async unbind(ctx) {
    const userId = ctx.state.user?.id
    if (!userId) return ctx.unauthorized()
    const fileId = Number(ctx.params.id)
    const p = bindSchema.safeParse(ctx.request.body)
    if (!p.success) return ctx.badRequest("invalid payload", p.error.issues)
    await strapi.db.query(REF_UID).delete({
      where: {
        file: fileId,
        uploaded_by: userId,
        entity_type: p.data.entity_type,
        entity_id: p.data.entity_id,
      },
    })
    ctx.body = { data: { file_id: fileId, refs_count: await countOwnedRefs(fileId, userId) } }
  },
}
```

- [ ] **步骤 4：写 service 纯函数单测**

创建 `backend/strapi/tests/attachment.contract.test.ts`：

```typescript
import { describe, it, expect } from "vitest"
import { validateFileAgainstPolicy } from "../src/api/attachment/services/attachment"

describe("validateFileAgainstPolicy", () => {
  it("无 policy 直接通过", () => {
    expect(() =>
      validateFileAgainstPolicy({ id: 1, mime: "image/png", size: 10 }, null),
    ).not.toThrow()
  })
  it("mime 不在白名单抛错", () => {
    expect(() =>
      validateFileAgainstPolicy(
        { id: 1, mime: "application/x-msdownload", size: 10 },
        { entity_type: "note", mime_whitelist: ["image/png"], max_size_bytes: null },
      ),
    ).toThrow(/not allowed/)
  })
  it("超出大小抛错", () => {
    expect(() =>
      validateFileAgainstPolicy(
        { id: 1, mime: "image/png", size: 999 },
        { entity_type: "note", mime_whitelist: null, max_size_bytes: 100 },
      ),
    ).toThrow(/exceeds maximum/)
  })
})
```

- [ ] **步骤 5：运行测试验证通过并 commit**

运行：`pnpm --dir backend/strapi exec vitest run tests/attachment.contract.test.ts`
预期：PASS。

```bash
git add backend/strapi/src/api/attachment backend/strapi/tests/attachment.contract.test.ts
git commit -m "feat(strapi): 移植附件 prepare/commit/bind"
```

## 阶段 E：消费方接线（workbench-app）

### 任务 E1：更新 bootstrap 与 syncManager 的客户端引用

**文件：**

- 修改：`packages/workbench-app/src/runtime/bootstrap.ts:2,64,398,405`
- 修改：`packages/workbench-app/src/runtime/syncManager.ts:1,5,19,36`

- [ ] **步骤 1：改 bootstrap.ts 引用**

- `bootstrap.ts:2`：`import { createDirectusAuthClient, type DirectusAuthClient } from "@tabora/auth"` → `import { createStrapiAuthClient, type StrapiAuthClient } from "@tabora/auth"`
- `:64`、`:398`：类型 `DirectusAuthClient` → `StrapiAuthClient`
- `:405`：`createDirectusAuthClient(...)` → `createStrapiAuthClient(...)`

- [ ] **步骤 2：改 syncManager.ts 引用**

- `:1`：`import type { DirectusAuthClient } from "@tabora/auth"` → `StrapiAuthClient`
- `:5`：`createDirectusGatewayClient` → `createStrapiGatewayClient`
- `:19`：`authClient: DirectusAuthClient` → `StrapiAuthClient`
- `:36`：`createDirectusGatewayClient({...})` → `createStrapiGatewayClient({...})`

若 syncManager 用到 `authClient.getSession()?.accessToken`，改为 `getSession()?.jwt`（纯 JWT 会话字段变了）。检查 `getAccessToken` 回调：从旧 `session.accessToken` 改为 `session.jwt`。

- [ ] **步骤 3：类型检查全仓**

运行：`pnpm check`
预期：无类型错误。若报 `accessToken`/`refreshToken`/`sessionId`/`refreshSession` 不存在，按纯 JWT 会话（`{ jwt, userId?, expiresAt? }`）修正调用点。

- [ ] **步骤 4：跑受影响包测试**

运行：`pnpm --dir packages/workbench-app test`
预期：PASS（若测试 mock 了旧 auth 会话结构，同步更新 mock 字段为 `jwt`）。

- [ ] **步骤 5：Commit**

```bash
git add packages/workbench-app/src/runtime
git commit -m "refactor(workbench): 接线 Strapi auth/sync 客户端"
```

### 任务 E2：全仓校验

- [ ] **步骤 1：全仓测试 + 检查 + 构建**

运行：`pnpm test && pnpm check && pnpm build`
预期：全绿。已知预先失败项（见 memory）：`e2e overflowX`、`AppShell localStorage` 与本次无关，可忽略但需确认无新增失败。

- [ ] **步骤 2：手动冒烟（启动 Strapi + playground）**

启动 `pnpm --dir backend/strapi develop`，配置 `VITE_TABORA_API_BASE` 指向 `http://localhost:1337`，启动 playground，验证：注册 → 登录 → 触发一次同步 → 刷新后会话恢复。

- [ ] **步骤 3：Commit（若冒烟发现修补）**

```bash
git add -A && git commit -m "fix(strapi): 冒烟修补"
```

## 阶段 F：Docker、root 接线、文档、清理

### 任务 F1：迁移 Docker 与 nginx

**文件：**

- 创建：`backend/strapi/Dockerfile`、`backend/strapi/docker/compose.{dev,prod}.yml`、`backend/strapi/docker/nginx/strapi.conf`
- 修改/创建：`infra/docker/compose.strapi.yml`

- [ ] **步骤 1：写 Strapi Dockerfile**

创建 `backend/strapi/Dockerfile`（node 20 + pnpm，构建后 `strapi start`）：

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile && pnpm --dir backend/strapi build

FROM node:20-alpine
WORKDIR /app/backend/strapi
RUN corepack enable
COPY --from=build /app/backend/strapi ./
ENV NODE_ENV=production
EXPOSE 1337
CMD ["pnpm", "start"]
```

（若仓库用 monorepo 依赖，Dockerfile 需在仓库根 build context；具体路径按 `docker:build` 脚本对齐。）

- [ ] **步骤 2：迁移 compose 文件**

以 `backend/directus/docker/compose.{dev,prod}.yml` 为模板，改：service 名 `directus`→`strapi`、镜像/build、端口 `8055`→`1337`、环境变量（`DATABASE_*`、`APP_KEYS`、`JWT_SECRET`、`ADMIN_JWT_SECRET`、`APP_KEYS`）。Postgres service 保留。

- [ ] **步骤 3：迁移 nginx**

`backend/directus/docker/nginx/directus.conf` → `backend/strapi/docker/nginx/strapi.conf`，upstream 端口 `8055` → `1337`。`infra/docker/compose.directus.yml` → `compose.strapi.yml` 同步改。

- [ ] **步骤 4：Commit**

```bash
git add backend/strapi/Dockerfile backend/strapi/docker infra/docker/compose.strapi.yml
git commit -m "feat(strapi): 迁移 docker 与 nginx 配置"
```

### 任务 F2：更新 root 脚本、workspace、vitest 入口

**文件：**

- 修改：`package.json:8-25`
- 修改：`vitest.config.ts:11`

- [ ] **步骤 1：改 root 脚本**

`package.json` 中把 directus 脚本替换为 strapi：

- `dev:directus` → `dev:strapi`：`pnpm --dir backend/strapi develop`
- `dev:directus:stack` → `dev:strapi:stack`：`docker compose -f infra/docker/compose.strapi.yml up -d`
- `test:directus` → `test:strapi`：`pnpm --dir backend/strapi test`
- `directus:bootstrap`/`directus:schema:provision`：Strapi 无对应，删除（或改为 `strapi:build`）

- [ ] **步骤 2：改 vitest 入口**

`vitest.config.ts:11`：`"backend/directus/vitest.config.ts"` → `"backend/strapi/vitest.config.ts"`。确认 `backend/strapi/vitest.config.ts` 存在（不存在则创建，`test.include: ['tests/**/*.test.ts']`，node 环境）。

- [ ] **步骤 3：校验**

运行：`pnpm test:strapi && pnpm check`
预期：Strapi 单测通过，配置检查绿。

- [ ] **步骤 4：Commit**

```bash
git add package.json vitest.config.ts backend/strapi/vitest.config.ts
git commit -m "chore: root 脚本与测试入口切到 strapi"
```

### 任务 F3：同步文档（含漂移纠正）

**文件：**

- 修改：`AGENTS.md:55`、`docs/README.md`、`docs/technical/mpz35mfq-16-data-sync-prd.md`、`docs/technical/tabora-data-sync-technical-design.md`
- 创建：`backend/strapi/README.md`、`backend/strapi/DEPLOY.md`

- [ ] **步骤 1：纠正后端事实源**

- `AGENTS.md:55`：把"后端采用 Supabase..."更正为"后端采用 Strapi 5（users-permissions 纯 JWT + 自定义 sync/attachment controller）"。
- `docs/technical/mpz35mfq-16-data-sync-prd.md` 与 `tabora-data-sync-technical-design.md`：Supabase/Directus 表述 → Strapi 现状。

- [ ] **步骤 2：写 Strapi 后端 README/DEPLOY**

`backend/strapi/README.md`：本地启动、env、手动开启认证角色权限的步骤（见 B1 步骤 2）。`backend/strapi/DEPLOY.md`：docker 部署、pg env、S3 env。

- [ ] **步骤 3：更新文档地图**

`docs/README.md`：directus 相关条目改为 strapi，登记本迁移设计与计划文档入口。`docs/superpowers/DIRECTUS_STATUS_ASSESSMENT.md` 标注为历史（顶部加"⚠️ 已被 Strapi 迁移取代，见 2026-07-27 计划"）。

- [ ] **步骤 4：校验并 commit**

运行：`pnpm check`
预期：文档检查绿。

```bash
git add AGENTS.md docs backend/strapi/README.md backend/strapi/DEPLOY.md
git commit -m "docs: 后端事实源切到 strapi 并纠正 supabase 漂移"
```

### 任务 F4：删除 backend/directus 与残留引用

**文件：**

- 删除：`backend/directus/`
- 修改：`pnpm-workspace.yaml`、`package.json`（残留 directus 依赖）

- [ ] **步骤 1：确认无代码仍引用 directus**

运行：`rg -i directus --glob '!docs/**' --glob '!pnpm-lock.yaml'`
预期：仅剩允许的历史文档引用；若有代码/配置引用，先修掉。

- [ ] **步骤 2：删除目录与 workspace 入口**

```bash
git rm -r backend/directus
```

`pnpm-workspace.yaml`：删除 `- backend/directus` 与 `- backend/directus/extensions/*` 两行。检查根 `package.json` `devDependencies`/`dependencies` 有无 directus 残留，一并删。

- [ ] **步骤 3：重装并全仓校验**

运行：`pnpm install && pnpm test && pnpm check && pnpm build`
预期：全绿，无 directus 引用残留。

- [ ] **步骤 4：Commit**

```bash
git add -A
git commit -m "chore: 移除 directus 后端"
```

---

## 完成标准

- Strapi 5 后端提供认证（原生纯 JWT）、同步（push/pull + 冲突检测）、附件（upload 插件）能力
- 客户端 `@tabora/auth`、`@tabora/sync` 全部 `Strapi*` 命名，纯 JWT 会话
- `pnpm test && pnpm check && pnpm build` 全绿
- 手动冒烟：注册/登录/同步/会话恢复通过
- `backend/directus` 已删除，无残留引用
- 文档事实源指向 Strapi，Supabase 漂移已纠正
