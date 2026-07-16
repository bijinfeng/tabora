# S1 前端登录注册接入 Directus 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 抽出独立 `@tabora/auth` 包承载 Directus 邮箱+密码认证会话逻辑，把账号设置页从 OTP mock 改为真实登录/注册/退出/会话恢复/忘记密码，后端地址经 Vite 环境变量注入。

**架构：** 新建 `@tabora/auth` 包，导出 `createDirectusAuthClient({ apiBaseUrl, storage })`，内部薄 `fetch` 包装负责 JSON、Bearer 头、错误归一化，会话持久化复用 `@tabora/host-adapters` 的 `AuthStorage`。`packages/sync` 通过 re-export 保持兼容。地址经 `WorkbenchShellConfig.auth.apiBaseUrl` 从 app 层注入到 `bootstrap`，`bootstrap` 建 `authClient` 并挂到 `WorkbenchShellApp` 的 `host.auth`，账号页只经 `props.host.auth` 调用。

**技术栈：** TypeScript, SolidJS, Vitest (happy-dom), pnpm workspace, Directus 12 auth 端点, `@tabora/ui`。

**仓库约束：** 未经用户明确要求不要 commit 之外的行为；已在分支 `s1-frontend-directus-auth` 上工作，保留现有 staged/unstaged 拆分。组件测试用 `solid-js/web` 的 `render`（本仓库无 `@solidjs/testing-library`）。

---

### 任务 1：创建 `@tabora/auth` 包骨架与错误归一

**文件：**

- 创建：`packages/auth/package.json`
- 创建：`packages/auth/tsconfig.json`
- 创建：`packages/auth/vitest.config.ts`
- 创建：`packages/auth/src/errors.ts`
- 测试：`packages/auth/src/errors.test.ts`

- [ ] **步骤 1：创建包配置文件**

`packages/auth/package.json`：

```json
{
  "name": "@tabora/auth",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./package.json": "./package.json"
  },
  "publishConfig": {
    "exports": {
      ".": "./dist/index.js",
      "./package.json": "./package.json"
    }
  },
  "scripts": {
    "build": "vp pack src/index.ts",
    "test": "vitest run --config vitest.config.ts"
  },
  "dependencies": {
    "@tabora/host-adapters": "workspace:*"
  },
  "devDependencies": {
    "@tabora/tsconfig": "workspace:*"
  }
}
```

`packages/auth/tsconfig.json`：

```json
{
  "extends": "@tabora/tsconfig/base.json",
  "include": ["src"]
}
```

`packages/auth/vitest.config.ts`：

```ts
import { definePackageUnitTestProject } from "../../tooling/vitest/config"

export default definePackageUnitTestProject()
```

- [ ] **步骤 2：编写失败的错误归一化测试**

`packages/auth/src/errors.test.ts`：

```ts
import { describe, expect, it } from "vitest"
import { mapDirectusError, AUTH_ERROR_MESSAGES } from "./errors"

describe("mapDirectusError", () => {
  it("maps INVALID_CREDENTIALS from status 401", () => {
    const result = mapDirectusError(401, {
      errors: [{ extensions: { code: "INVALID_CREDENTIALS" } }],
    })
    expect(result.code).toBe("INVALID_CREDENTIALS")
  })

  it("maps RECORD_NOT_UNIQUE to EMAIL_IN_USE", () => {
    const result = mapDirectusError(400, {
      errors: [{ extensions: { code: "RECORD_NOT_UNIQUE" } }],
    })
    expect(result.code).toBe("EMAIL_IN_USE")
  })

  it("maps INVALID_PAYLOAD from status 400", () => {
    const result = mapDirectusError(400, { errors: [{ extensions: { code: "INVALID_PAYLOAD" } }] })
    expect(result.code).toBe("INVALID_PAYLOAD")
  })

  it("falls back to UNKNOWN for unrecognized codes", () => {
    const result = mapDirectusError(500, { errors: [{ extensions: { code: "WEIRD" } }] })
    expect(result.code).toBe("UNKNOWN")
  })

  it("falls back to UNKNOWN when body has no errors array", () => {
    const result = mapDirectusError(500, {})
    expect(result.code).toBe("UNKNOWN")
  })

  it("has a Chinese message for every error code", () => {
    for (const code of [
      "NETWORK_ERROR",
      "INVALID_CREDENTIALS",
      "INVALID_PAYLOAD",
      "EMAIL_IN_USE",
      "RESET_INVALID",
      "UNKNOWN",
    ] as const) {
      expect(AUTH_ERROR_MESSAGES[code]).toBeTruthy()
    }
  })
})
```

- [ ] **步骤 3：运行测试验证失败**

运行：`cd /home/kebai/桌面/tabora && ./node_modules/.bin/vitest run --config packages/auth/vitest.config.ts`
预期：FAIL，报错模块 `./errors` 不存在。

- [ ] **步骤 4：编写最少实现**

`packages/auth/src/errors.ts`：

```ts
export type AuthErrorCode =
  | "NETWORK_ERROR"
  | "INVALID_CREDENTIALS"
  | "INVALID_PAYLOAD"
  | "EMAIL_IN_USE"
  | "RESET_INVALID"
  | "UNKNOWN"

export type AuthError = { code: AuthErrorCode; message: string }

export const AUTH_ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  NETWORK_ERROR: "网络异常，请稍后重试",
  INVALID_CREDENTIALS: "邮箱或密码错误",
  INVALID_PAYLOAD: "输入格式不正确",
  EMAIL_IN_USE: "该邮箱已注册",
  RESET_INVALID: "验证码错误或已过期",
  UNKNOWN: "操作失败，请稍后重试",
}

type DirectusErrorBody = {
  errors?: Array<{ extensions?: { code?: string } }>
}

export function mapDirectusError(status: number, body: unknown): AuthError {
  const directusCode = (body as DirectusErrorBody)?.errors?.[0]?.extensions?.code
  let code: AuthErrorCode = "UNKNOWN"

  if (directusCode === "INVALID_CREDENTIALS" || status === 401) {
    code = "INVALID_CREDENTIALS"
  } else if (directusCode === "RECORD_NOT_UNIQUE") {
    code = "EMAIL_IN_USE"
  } else if (directusCode === "INVALID_PAYLOAD") {
    code = "INVALID_PAYLOAD"
  }

  return { code, message: AUTH_ERROR_MESSAGES[code] }
}
```

- [ ] **步骤 5：运行测试验证通过**

运行：`cd /home/kebai/桌面/tabora && ./node_modules/.bin/vitest run --config packages/auth/vitest.config.ts`
预期：PASS。

- [ ] **步骤 6：Commit**

```bash
git add packages/auth/package.json packages/auth/tsconfig.json packages/auth/vitest.config.ts packages/auth/src/errors.ts packages/auth/src/errors.test.ts
git commit -m "feat(auth): 新增 @tabora/auth 包骨架与 Directus 错误归一"
```

---

### 任务 2：实现 `createDirectusAuthClient` 核心逻辑

**文件：**

- 创建：`packages/auth/src/directusAuthClient.ts`
- 测试：`packages/auth/src/directusAuthClient.test.ts`

- [ ] **步骤 1：编写失败的测试**

`packages/auth/src/directusAuthClient.test.ts`：

```ts
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createDirectusAuthClient } from "./directusAuthClient"
import type { AuthStorage } from "@tabora/host-adapters"

function memoryStorage(): AuthStorage {
  const map = new Map<string, string>()
  return {
    async getItem(k) {
      return map.get(k) ?? null
    },
    async setItem(k, v) {
      map.set(k, v)
    },
    async removeItem(k) {
      map.delete(k)
    },
  }
}

const BASE = "http://api.test/tabora"

function loginBody() {
  return {
    data: {
      access_token: "acc",
      refresh_token: "ref",
      expires: 900_000,
      session_id: "sess-1",
    },
  }
}

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

describe("createDirectusAuthClient", () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)
  })

  it("login stores session and returns it", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, loginBody()))
    const storage = memoryStorage()
    const client = createDirectusAuthClient({ apiBaseUrl: BASE, storage })

    const session = await client.login("a@test.com", "pw12345678")

    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE}/auth/login`,
      expect.objectContaining({ method: "POST" }),
    )
    expect(session.sessionId).toBe("sess-1")
    expect(session.accessToken).toBe("acc")
    const stored = await storage.getItem("tabora.auth.session")
    expect(stored).toContain("sess-1")
  })

  it("login maps 401 to INVALID_CREDENTIALS thrown error", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(401, { errors: [{ extensions: { code: "INVALID_CREDENTIALS" } }] }),
    )
    const client = createDirectusAuthClient({ apiBaseUrl: BASE, storage: memoryStorage() })

    await expect(client.login("a@test.com", "bad")).rejects.toMatchObject({
      code: "INVALID_CREDENTIALS",
    })
  })

  it("register posts credentials and resolves on 204", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }))
    const client = createDirectusAuthClient({ apiBaseUrl: BASE, storage: memoryStorage() })

    await expect(client.register("a@test.com", "pw12345678")).resolves.toBeUndefined()
    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE}/auth/register`,
      expect.objectContaining({ method: "POST" }),
    )
  })

  it("getSession returns cached session when not expired", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, loginBody()))
    const storage = memoryStorage()
    const client = createDirectusAuthClient({ apiBaseUrl: BASE, storage })
    await client.login("a@test.com", "pw12345678")
    fetchMock.mockClear()

    const session = await client.getSession()

    expect(session?.sessionId).toBe("sess-1")
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("getSession auto-refreshes an expired session", async () => {
    const storage = memoryStorage()
    await storage.setItem(
      "tabora.auth.session",
      JSON.stringify({
        userId: "",
        accessToken: "old",
        refreshToken: "ref",
        expiresAt: 1,
        sessionId: "sess-old",
      }),
    )
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, {
        data: {
          access_token: "new",
          refresh_token: "ref2",
          expires: 900_000,
          session_id: "sess-2",
        },
      }),
    )
    const client = createDirectusAuthClient({ apiBaseUrl: BASE, storage })

    const session = await client.getSession()

    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE}/auth/refresh`,
      expect.objectContaining({ method: "POST" }),
    )
    expect(session?.accessToken).toBe("new")
    expect(session?.sessionId).toBe("sess-2")
  })

  it("getSession clears session and returns null when refresh fails", async () => {
    const storage = memoryStorage()
    await storage.setItem(
      "tabora.auth.session",
      JSON.stringify({
        userId: "",
        accessToken: "old",
        refreshToken: "ref",
        expiresAt: 1,
        sessionId: "s",
      }),
    )
    fetchMock.mockResolvedValueOnce(
      jsonResponse(401, { errors: [{ extensions: { code: "INVALID_CREDENTIALS" } }] }),
    )
    const client = createDirectusAuthClient({ apiBaseUrl: BASE, storage })

    const session = await client.getSession()

    expect(session).toBeNull()
    expect(await storage.getItem("tabora.auth.session")).toBeNull()
  })

  it("logout posts refresh_token and clears storage", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, loginBody()))
    const storage = memoryStorage()
    const client = createDirectusAuthClient({ apiBaseUrl: BASE, storage })
    await client.login("a@test.com", "pw12345678")
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }))

    await client.logout()

    expect(fetchMock).toHaveBeenLastCalledWith(
      `${BASE}/auth/logout`,
      expect.objectContaining({ method: "POST" }),
    )
    expect(await storage.getItem("tabora.auth.session")).toBeNull()
  })

  it("requestPasswordReset posts email to send-code", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }))
    const client = createDirectusAuthClient({ apiBaseUrl: BASE, storage: memoryStorage() })

    await client.requestPasswordReset("a@test.com")

    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE}/auth/send-code`,
      expect.objectContaining({ method: "POST" }),
    )
  })

  it("resetPassword posts code and password to verify-code", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }))
    const client = createDirectusAuthClient({ apiBaseUrl: BASE, storage: memoryStorage() })

    await client.resetPassword("123456", "pw87654321")

    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE}/auth/verify-code`,
      expect.objectContaining({ method: "POST" }),
    )
  })

  it("returns NETWORK_ERROR when fetch throws", async () => {
    fetchMock.mockRejectedValueOnce(new Error("boom"))
    const client = createDirectusAuthClient({ apiBaseUrl: BASE, storage: memoryStorage() })

    await expect(client.login("a@test.com", "pw12345678")).rejects.toMatchObject({
      code: "NETWORK_ERROR",
    })
  })
})
```

- [ ] **步骤 2：运行测试验证失败**

运行：`cd /home/kebai/桌面/tabora && ./node_modules/.bin/vitest run --config packages/auth/vitest.config.ts`
预期：FAIL，报错模块 `./directusAuthClient` 不存在。

- [ ] **步骤 3：编写实现**

`packages/auth/src/directusAuthClient.ts`：

```ts
import type { AuthStorage } from "@tabora/host-adapters"
import { mapDirectusError, type AuthError } from "./errors"

const SESSION_KEY = "tabora.auth.session"
const REFRESH_LEEWAY_MS = 30_000

export type DirectusSession = {
  userId: string
  accessToken: string
  refreshToken: string
  expiresAt: number
  sessionId: string
}

export type CurrentUser = {
  id: string
  email?: string
  first_name?: string
  last_name?: string
  avatar?: string
  status?: string
}

export type DirectusAuthClientConfig = {
  apiBaseUrl: string
  storage: AuthStorage
}

export type DirectusAuthClient = {
  register(email: string, password: string): Promise<void>
  login(email: string, password: string): Promise<DirectusSession>
  logout(): Promise<void>
  getSession(): Promise<DirectusSession | null>
  refreshSession(): Promise<DirectusSession | null>
  getCurrentUser(): Promise<CurrentUser | null>
  requestPasswordReset(email: string): Promise<void>
  resetPassword(code: string, newPassword: string): Promise<void>
}

function networkError(): AuthError {
  return { code: "NETWORK_ERROR", message: "网络异常，请稍后重试" }
}

type LoginResponseData = {
  access_token: string
  refresh_token: string
  expires: number
  session_id: string
}

export function createDirectusAuthClient(config: DirectusAuthClientConfig): DirectusAuthClient {
  const base = config.apiBaseUrl.replace(/\/$/, "")

  async function request<T>(
    path: string,
    body: unknown,
    accessToken?: string,
  ): Promise<{ status: number; data: T | null }> {
    let response: Response
    try {
      response = await fetch(`${base}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
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

    if (!response.ok) {
      throw mapDirectusError(response.status, parsed)
    }

    return { status: response.status, data: (parsed as { data?: T })?.data ?? null }
  }

  async function get<T>(path: string, accessToken: string): Promise<T | null> {
    let response: Response
    try {
      response = await fetch(`${base}${path}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
    } catch {
      throw networkError()
    }
    let parsed: unknown = null
    try {
      parsed = await response.json()
    } catch {
      parsed = null
    }
    if (!response.ok) {
      throw mapDirectusError(response.status, parsed)
    }
    return (parsed as { data?: T })?.data ?? null
  }

  function toSession(data: LoginResponseData): DirectusSession {
    return {
      userId: "",
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires,
      sessionId: data.session_id,
    }
  }

  async function readStored(): Promise<DirectusSession | null> {
    const raw = await config.storage.getItem(SESSION_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as DirectusSession
    } catch {
      return null
    }
  }

  async function writeStored(session: DirectusSession): Promise<void> {
    await config.storage.setItem(SESSION_KEY, JSON.stringify(session))
  }

  async function clearStored(): Promise<void> {
    await config.storage.removeItem(SESSION_KEY)
  }

  async function refreshSession(): Promise<DirectusSession | null> {
    const current = await readStored()
    if (!current) return null
    try {
      const { data } = await request<LoginResponseData>("/auth/refresh", {
        refresh_token: current.refreshToken,
      })
      if (!data) {
        await clearStored()
        return null
      }
      const next = toSession(data)
      await writeStored(next)
      return next
    } catch {
      await clearStored()
      return null
    }
  }

  return {
    async register(email, password) {
      await request<never>("/auth/register", { email, password })
    },

    async login(email, password) {
      const { data } = await request<LoginResponseData>("/auth/login", { email, password })
      if (!data) {
        throw { code: "UNKNOWN", message: "登录失败，请稍后重试" } satisfies AuthError
      }
      const session = toSession(data)
      await writeStored(session)
      return session
    },

    async logout() {
      const current = await readStored()
      if (current) {
        try {
          await request<never>("/auth/logout", { refresh_token: current.refreshToken })
        } catch {
          // 即使后端登出失败也清本地会话
        }
      }
      await clearStored()
    },

    async getSession() {
      const current = await readStored()
      if (!current) return null
      if (current.expiresAt - REFRESH_LEEWAY_MS > Date.now()) {
        return current
      }
      return refreshSession()
    },

    refreshSession,

    async getCurrentUser() {
      const session = await this.getSession()
      if (!session) return null
      return get<CurrentUser>("/auth/session", session.accessToken)
    },

    async requestPasswordReset(email) {
      await request<never>("/auth/send-code", { email })
    },

    async resetPassword(code, newPassword) {
      try {
        await request<never>("/auth/verify-code", { code, password: newPassword })
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

- [ ] **步骤 4：运行测试验证通过**

运行：`cd /home/kebai/桌面/tabora && ./node_modules/.bin/vitest run --config packages/auth/vitest.config.ts`
预期：PASS（所有用例）。

- [ ] **步骤 5：Commit**

```bash
git add packages/auth/src/directusAuthClient.ts packages/auth/src/directusAuthClient.test.ts
git commit -m "feat(auth): 实现 createDirectusAuthClient 会话与刷新逻辑"
```

---

### 任务 3：导出包公共 API 并接入 pnpm workspace

**文件：**

- 创建：`packages/auth/src/index.ts`

- [ ] **步骤 1：编写 index 导出**

`packages/auth/src/index.ts`：

```ts
export {
  createDirectusAuthClient,
  type DirectusAuthClient,
  type DirectusAuthClientConfig,
  type DirectusSession,
  type CurrentUser,
} from "./directusAuthClient"

export { mapDirectusError, AUTH_ERROR_MESSAGES, type AuthError, type AuthErrorCode } from "./errors"
```

- [ ] **步骤 2：安装 workspace 依赖链接**

运行：`cd /home/kebai/桌面/tabora && pnpm install`
预期：`@tabora/auth` 被 workspace 识别，无报错。

- [ ] **步骤 3：类型检查新包**

运行：`cd /home/kebai/桌面/tabora && pnpm --filter @tabora/auth exec tsc --noEmit -p tsconfig.json`
预期：无类型错误。

- [ ] **步骤 4：Commit**

```bash
git add packages/auth/src/index.ts pnpm-lock.yaml
git commit -m "feat(auth): 导出 @tabora/auth 公共 API 并接入 workspace"
```

---

### 任务 4：`WorkbenchShellConfig` 增加 auth 字段并接线 bootstrap

**文件：**

- 修改：`packages/workbench-app/src/shared/shellConfig.ts`
- 修改：`packages/workbench-app/src/runtime/bootstrap.ts`
- 修改：`packages/workbench-app/package.json`（新增依赖 `@tabora/auth`）

- [ ] **步骤 1：为 shellConfig 增加 auth 字段**

在 `packages/workbench-app/src/shared/shellConfig.ts` 的 `WorkbenchShellConfig` 类型末尾（`searchHistory` 字段之后、右花括号之前）加入：

```ts
  auth?: {
    apiBaseUrl: string
  }
```

- [ ] **步骤 2：为 workbench-app 增加依赖**

在 `packages/workbench-app/package.json` 的 `dependencies` 中加入（保持字母序，与现有 `@tabora/*` 依赖并列）：

```json
    "@tabora/auth": "workspace:*",
```

运行：`cd /home/kebai/桌面/tabora && pnpm install`
预期：链接成功。

- [ ] **步骤 3：在 bootstrap 建 authClient**

在 `packages/workbench-app/src/runtime/bootstrap.ts` 顶部 import 区加入：

```ts
import { createDirectusAuthClient, type DirectusAuthClient } from "@tabora/auth"
import {
  createChromeStorageAuthStorage,
  createLocalStorageAuthStorage,
} from "@tabora/host-adapters"
```

在 `WorkbenchRuntimeBootstrap` 类型中，`syncManager?` 字段旁新增：

```ts
  authClient?: DirectusAuthClient
```

在函数体内，`createSyncManager` 那段禁用分支**之前**，插入 authClient 构建（`options.host`、`repositories` 等已在作用域内）：

```ts
let authClient: DirectusAuthClient | undefined = undefined
const authApiBaseUrl = options.shellConfig.auth?.apiBaseUrl
if (authApiBaseUrl) {
  const authStorage =
    options.host.platform === "extension"
      ? createChromeStorageAuthStorage()
      : createLocalStorageAuthStorage()
  authClient = createDirectusAuthClient({ apiBaseUrl: authApiBaseUrl, storage: authStorage })
}
```

在函数末尾 `return { ... }` 对象中，`...(syncManager ? { syncManager } : {}),` 旁加入：

```ts
    ...(authClient ? { authClient } : {}),
```

- [ ] **步骤 4：类型检查**

运行：`cd /home/kebai/桌面/tabora && pnpm --filter @tabora/workbench-app exec tsc --noEmit -p tsconfig.json`
预期：无类型错误。

- [ ] **步骤 5：Commit**

```bash
git add packages/workbench-app/src/shared/shellConfig.ts packages/workbench-app/src/runtime/bootstrap.ts packages/workbench-app/package.json pnpm-lock.yaml
git commit -m "feat(auth): shellConfig 增加 auth.apiBaseUrl 并在 bootstrap 构建 authClient"
```

---

### 任务 5：`SettingsPanelViewProps.host` 增加 auth 方法并在 shell 接线

**文件：**

- 修改：`packages/plugin-api/src/manifest.ts:295-310`
- 修改：`packages/workbench-app/src/shell/WorkbenchShellApp.tsx:202-220`

- [ ] **步骤 1：为 host 类型增加 auth 契约**

在 `packages/plugin-api/src/manifest.ts` 的 `SettingsPanelViewProps["host"]` 对象类型末尾（`deleteWorkspace?` 之后）加入：

```ts
    auth?: {
      getSession(): Promise<{ userId: string; sessionId: string } | null>
      getCurrentUser(): Promise<{ id: string; email?: string } | null>
      login(email: string, password: string): Promise<void>
      register(email: string, password: string): Promise<void>
      logout(): Promise<void>
      requestPasswordReset(email: string): Promise<void>
      resetPassword(code: string, password: string): Promise<void>
    }
```

- [ ] **步骤 2：在 WorkbenchShellApp 接线 host.auth**

`WorkbenchShellApp.tsx` 需要访问 bootstrap 的 `authClient`。确认组件已能拿到 bootstrap 结果（同 `workspaceController` 来源）；设其为 `runtime`/`bootstrap` 作用域内的 `authClient`。在 `host: { ... }` 对象里 `deleteWorkspace` 之后加入：

```ts
      ...(authClient
        ? {
            auth: {
              getSession: () =>
                authClient.getSession().then((s) =>
                  s ? { userId: s.userId, sessionId: s.sessionId } : null,
                ),
              getCurrentUser: () =>
                authClient.getCurrentUser().then((u) =>
                  u ? { id: u.id, email: u.email } : null,
                ),
              login: (email: string, password: string) =>
                authClient.login(email, password).then(() => undefined),
              register: (email: string, password: string) =>
                authClient.register(email, password),
              logout: () => authClient.logout(),
              requestPasswordReset: (email: string) => authClient.requestPasswordReset(email),
              resetPassword: (code: string, password: string) =>
                authClient.resetPassword(code, password),
            },
          }
        : {}),
```

> 注意：`authClient` 的具体获取路径按 `WorkbenchShellApp.tsx` 实际持有 bootstrap 的方式接入（读取该文件顶部 props/解构，找到与 `workspaceController` 同源的 bootstrap 对象，取其 `authClient` 字段）。若组件当前未解构 bootstrap，需在 props 类型与解构处补上 `authClient`。

- [ ] **步骤 3：类型检查**

运行：`cd /home/kebai/桌面/tabora && pnpm --filter @tabora/plugin-api exec tsc --noEmit -p tsconfig.json && pnpm --filter @tabora/workbench-app exec tsc --noEmit -p tsconfig.json`
预期：无类型错误。

- [ ] **步骤 4：Commit**

```bash
git add packages/plugin-api/src/manifest.ts packages/workbench-app/src/shell/WorkbenchShellApp.tsx
git commit -m "feat(auth): host 契约增加 auth 方法并在 shell 接线 authClient"
```

---

### 任务 6：改造账号设置页为真实邮箱+密码

**文件：**

- 修改：`packages/official-plugins/src/settings-workspace.account.tsx`（整体重写）
- 测试：`packages/official-plugins/src/settings-workspace.account.test.tsx`
- 修改：`packages/official-plugins/package.json`（devDependency 增加 `vite-plugin-solid` 已有；确认无需新增运行时依赖）

- [ ] **步骤 1：编写失败的组件测试**

`packages/official-plugins/src/settings-workspace.account.test.tsx`：

```tsx
import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import { AccountSettingsPanel } from "./settings-workspace.account"
import type { SettingsPanelViewProps } from "@tabora/plugin-api"

function mountPanel(hostAuth?: SettingsPanelViewProps["host"]["auth"]) {
  const root = document.createElement("div")
  document.body.appendChild(root)
  const props = {
    panelId: "p",
    pluginId: "official.settings.workspace",
    scope: "workspace",
    host: { close: vi.fn(), setDirty: vi.fn(), auth: hostAuth },
    workspace: {} as never,
    layouts: [],
    themes: [],
    backgrounds: [],
    searchProviders: [],
    searchSettings: {} as never,
    plugins: [],
  } as unknown as SettingsPanelViewProps
  const dispose = render(() => <AccountSettingsPanel {...props} />, root)
  return { root, dispose }
}

function flush() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

describe("AccountSettingsPanel", () => {
  it("shows local-mode notice when host.auth is undefined", async () => {
    const { root } = mountPanel(undefined)
    await flush()
    expect(root.textContent).toContain("未配置同步服务")
  })

  it("restores signed-in state when a session exists", async () => {
    const auth = {
      getSession: vi.fn().mockResolvedValue({ userId: "u1", sessionId: "s1" }),
      getCurrentUser: vi.fn().mockResolvedValue({ id: "u1", email: "a@test.com" }),
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      requestPasswordReset: vi.fn(),
      resetPassword: vi.fn(),
    }
    const { root } = mountPanel(auth)
    await flush()
    expect(root.textContent).toContain("a@test.com")
  })

  it("calls login with entered credentials", async () => {
    const auth = {
      getSession: vi.fn().mockResolvedValue(null),
      getCurrentUser: vi.fn().mockResolvedValue({ id: "u1", email: "a@test.com" }),
      login: vi.fn().mockResolvedValue(undefined),
      register: vi.fn(),
      logout: vi.fn(),
      requestPasswordReset: vi.fn(),
      resetPassword: vi.fn(),
    }
    const { root } = mountPanel(auth)
    await flush()
    const email = root.querySelector<HTMLInputElement>('input[type="email"]')!
    const password = root.querySelector<HTMLInputElement>('input[type="password"]')!
    email.value = "a@test.com"
    email.dispatchEvent(new Event("input", { bubbles: true }))
    password.value = "pw12345678"
    password.dispatchEvent(new Event("input", { bubbles: true }))
    const loginBtn = Array.from(root.querySelectorAll("button")).find(
      (b) => b.textContent === "登录",
    )!
    loginBtn.click()
    await flush()
    expect(auth.login).toHaveBeenCalledWith("a@test.com", "pw12345678")
  })

  it("registers then auto-logs in", async () => {
    const auth = {
      getSession: vi.fn().mockResolvedValue(null),
      getCurrentUser: vi.fn().mockResolvedValue({ id: "u1", email: "a@test.com" }),
      login: vi.fn().mockResolvedValue(undefined),
      register: vi.fn().mockResolvedValue(undefined),
      logout: vi.fn(),
      requestPasswordReset: vi.fn(),
      resetPassword: vi.fn(),
    }
    const { root } = mountPanel(auth)
    await flush()
    const email = root.querySelector<HTMLInputElement>('input[type="email"]')!
    const password = root.querySelector<HTMLInputElement>('input[type="password"]')!
    email.value = "a@test.com"
    email.dispatchEvent(new Event("input", { bubbles: true }))
    password.value = "pw12345678"
    password.dispatchEvent(new Event("input", { bubbles: true }))
    const registerBtn = Array.from(root.querySelectorAll("button")).find(
      (b) => b.textContent === "注册",
    )!
    registerBtn.click()
    await flush()
    expect(auth.register).toHaveBeenCalledWith("a@test.com", "pw12345678")
    expect(auth.login).toHaveBeenCalledWith("a@test.com", "pw12345678")
  })

  it("shows credential error message on login failure", async () => {
    const auth = {
      getSession: vi.fn().mockResolvedValue(null),
      getCurrentUser: vi.fn(),
      login: vi.fn().mockRejectedValue({ code: "INVALID_CREDENTIALS", message: "邮箱或密码错误" }),
      register: vi.fn(),
      logout: vi.fn(),
      requestPasswordReset: vi.fn(),
      resetPassword: vi.fn(),
    }
    const { root } = mountPanel(auth)
    await flush()
    const email = root.querySelector<HTMLInputElement>('input[type="email"]')!
    const password = root.querySelector<HTMLInputElement>('input[type="password"]')!
    email.value = "a@test.com"
    email.dispatchEvent(new Event("input", { bubbles: true }))
    password.value = "wrong123"
    password.dispatchEvent(new Event("input", { bubbles: true }))
    Array.from(root.querySelectorAll("button"))
      .find((b) => b.textContent === "登录")!
      .click()
    await flush()
    expect(root.textContent).toContain("邮箱或密码错误")
  })
})
```

- [ ] **步骤 2：运行测试验证失败**

运行：`cd /home/kebai/桌面/tabora && ./node_modules/.bin/vitest run --config packages/official-plugins/vitest.config.ts settings-workspace.account`
预期：FAIL（当前组件是 OTP mock，无 email/password 输入、无 host.auth 逻辑）。

- [ ] **步骤 3：重写账号页组件**

`packages/official-plugins/src/settings-workspace.account.tsx`（整体替换）：

```tsx
import { Button, Input } from "@tabora/ui"
import { createSignal, onMount, Show } from "solid-js"
import type { SettingsPanelViewProps } from "@tabora/plugin-api"

type AccountPhase = "loading" | "signed-out" | "reset-request" | "reset-verify" | "signed-in"

const MIN_PASSWORD = 8

export function AccountSettingsPanel(props: SettingsPanelViewProps) {
  const auth = () => props.host.auth
  const [email, setEmail] = createSignal("")
  const [password, setPassword] = createSignal("")
  const [code, setCode] = createSignal("")
  const [newPassword, setNewPassword] = createSignal("")
  const [phase, setPhase] = createSignal<AccountPhase>("loading")
  const [accountEmail, setAccountEmail] = createSignal("")
  const [status, setStatus] = createSignal("")
  const [busy, setBusy] = createSignal(false)

  onMount(async () => {
    const client = auth()
    if (!client) {
      setPhase("signed-out")
      return
    }
    try {
      const session = await client.getSession()
      if (session) {
        const user = await client.getCurrentUser()
        setAccountEmail(user?.email ?? "")
        setPhase("signed-in")
        return
      }
    } catch {
      // 恢复失败按未登录处理
    }
    setPhase("signed-out")
  })

  function messageFor(error: unknown): string {
    const code = (error as { code?: string })?.code
    const message = (error as { message?: string })?.message
    return message ?? (code ? String(code) : "操作失败，请稍后重试")
  }

  async function run(action: () => Promise<void>) {
    if (busy()) return
    setBusy(true)
    setStatus("")
    try {
      await action()
    } catch (error) {
      setStatus(messageFor(error))
    } finally {
      setBusy(false)
    }
  }

  function validCredentials(requireLength: boolean): boolean {
    if (!email().trim()) {
      setStatus("请输入邮箱")
      return false
    }
    if (!password()) {
      setStatus("请输入密码")
      return false
    }
    if (requireLength && password().length < MIN_PASSWORD) {
      setStatus(`密码至少 ${MIN_PASSWORD} 位`)
      return false
    }
    return true
  }

  function handleLogin() {
    if (!validCredentials(false)) return
    void run(async () => {
      await auth()!.login(email().trim(), password())
      const user = await auth()!.getCurrentUser()
      setAccountEmail(user?.email ?? email().trim())
      setPassword("")
      setPhase("signed-in")
    })
  }

  function handleRegister() {
    if (!validCredentials(true)) return
    void run(async () => {
      await auth()!.register(email().trim(), password())
      await auth()!.login(email().trim(), password())
      const user = await auth()!.getCurrentUser()
      setAccountEmail(user?.email ?? email().trim())
      setPassword("")
      setPhase("signed-in")
    })
  }

  function handleSendResetCode() {
    if (!email().trim()) {
      setStatus("请输入邮箱")
      return
    }
    void run(async () => {
      await auth()!.requestPasswordReset(email().trim())
      setPhase("reset-verify")
      setStatus("验证码已发送到邮箱")
    })
  }

  function handleResetPassword() {
    if (!code().trim()) {
      setStatus("请输入验证码")
      return
    }
    if (newPassword().length < MIN_PASSWORD) {
      setStatus(`新密码至少 ${MIN_PASSWORD} 位`)
      return
    }
    void run(async () => {
      await auth()!.resetPassword(code().trim(), newPassword())
      setCode("")
      setNewPassword("")
      setPhase("signed-out")
      setStatus("密码已重置，请登录")
    })
  }

  function handleLogout() {
    void run(async () => {
      await auth()!.logout()
      setAccountEmail("")
      setPassword("")
      setPhase("signed-out")
      setStatus("已退出登录")
    })
  }

  return (
    <section class="account-auth-panel" aria-label="官方账号登录注册">
      <Show when={auth()} fallback={<p class="auth-status">未配置同步服务，当前为本地模式</p>}>
        <Show when={phase() !== "loading"} fallback={<p class="auth-status">正在恢复登录状态…</p>}>
          <Show when={phase() === "signed-in"}>
            <div class="account-auth-form">
              <p class="auth-status">已登录 · {accountEmail()}</p>
              <Button size="sm" variant="secondary" disabled={busy()} onClick={handleLogout}>
                退出
              </Button>
            </div>
          </Show>

          <Show when={phase() === "signed-out"}>
            <div class="account-auth-form">
              <label class="auth-field">
                <span>邮箱</span>
                <Input
                  size="sm"
                  type="email"
                  value={email()}
                  onInput={setEmail}
                  placeholder="name@example.com"
                  aria-label="账号邮箱"
                />
              </label>
              <label class="auth-field">
                <span>密码</span>
                <Input
                  size="sm"
                  type="password"
                  value={password()}
                  onInput={setPassword}
                  placeholder="至少 8 位"
                  aria-label="账号密码"
                />
              </label>
              <div class="account-actions">
                <Button size="sm" variant="primary" disabled={busy()} onClick={handleLogin}>
                  登录
                </Button>
                <Button size="sm" variant="secondary" disabled={busy()} onClick={handleRegister}>
                  注册
                </Button>
              </div>
              <Button
                size="sm"
                variant="ghost"
                disabled={busy()}
                onClick={() => {
                  setStatus("")
                  setPhase("reset-request")
                }}
              >
                忘记密码?
              </Button>
              <span class="auth-status">{status()}</span>
            </div>
          </Show>

          <Show when={phase() === "reset-request"}>
            <div class="account-auth-form">
              <label class="auth-field">
                <span>邮箱</span>
                <Input
                  size="sm"
                  type="email"
                  value={email()}
                  onInput={setEmail}
                  placeholder="name@example.com"
                  aria-label="重置账号邮箱"
                />
              </label>
              <div class="account-actions">
                <Button size="sm" variant="primary" disabled={busy()} onClick={handleSendResetCode}>
                  发送验证码
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy()}
                  onClick={() => {
                    setStatus("")
                    setPhase("signed-out")
                  }}
                >
                  返回
                </Button>
              </div>
              <span class="auth-status">{status()}</span>
            </div>
          </Show>

          <Show when={phase() === "reset-verify"}>
            <div class="account-auth-form">
              <label class="auth-field">
                <span>验证码</span>
                <Input
                  size="sm"
                  value={code()}
                  onInput={setCode}
                  placeholder="邮箱验证码"
                  aria-label="重置验证码"
                />
              </label>
              <label class="auth-field">
                <span>新密码</span>
                <Input
                  size="sm"
                  type="password"
                  value={newPassword()}
                  onInput={setNewPassword}
                  placeholder="至少 8 位"
                  aria-label="新密码"
                />
              </label>
              <div class="account-actions">
                <Button size="sm" variant="primary" disabled={busy()} onClick={handleResetPassword}>
                  重置密码
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy()}
                  onClick={() => {
                    setStatus("")
                    setPhase("signed-out")
                  }}
                >
                  返回
                </Button>
              </div>
              <span class="auth-status">{status()}</span>
            </div>
          </Show>
        </Show>
      </Show>
    </section>
  )
}
```

> `Input` 的 `onInput` 在本仓库直接接收字符串值（见原组件用法 `onInput={setEmail}`）。若类型检查报 `onInput` 签名不符，按 `@tabora/ui` 的 `Input` 实际 props 调整为 `(value) => setEmail(value)`。`Button` 的 `variant="ghost"` 若不存在，用 `"secondary"` 替代。

- [ ] **步骤 4：运行测试验证通过**

运行：`cd /home/kebai/桌面/tabora && ./node_modules/.bin/vitest run --config packages/official-plugins/vitest.config.ts settings-workspace.account`
预期：PASS（全部用例）。

- [ ] **步骤 5：类型检查**

运行：`cd /home/kebai/桌面/tabora && pnpm --filter @tabora/official-plugins exec tsc --noEmit -p tsconfig.json`
预期：无类型错误。

- [ ] **步骤 6：Commit**

```bash
git add packages/official-plugins/src/settings-workspace.account.tsx packages/official-plugins/src/settings-workspace.account.test.tsx
git commit -m "feat(auth): 账号页改为真实邮箱密码登录注册与忘记密码"
```

---

### 任务 7：app 层注入 apiBaseUrl（playground + extension）

**文件：**

- 修改：`apps/playground/src/workbenchComposition.ts`
- 修改：`apps/extension/entrypoints/newtab/workbenchComposition.ts`
- 创建/修改：`apps/playground/.env.example`
- 创建/修改：`apps/extension/.env.example`

- [ ] **步骤 1：playground 注入 auth 配置**

在 `apps/playground/src/workbenchComposition.ts` 的 `createPlaygroundRuntimeBootstrap` 中，把 `shellConfig` 从直接透传改为合并 auth 字段：

```ts
export function createPlaygroundRuntimeBootstrap(): WorkbenchRuntimeBootstrap {
  const apiBaseUrl = import.meta.env.VITE_TABORA_API_BASE?.trim()
  return createWorkbenchRuntimeBootstrap({
    host: createWebHostAdapter({
      id: "host.playground",
    }),
    plugins: builtinPlugins,
    defaultWorkspacePreset: builtinDefaultWorkspacePreset,
    shellConfig: apiBaseUrl
      ? { ...builtinWorkbenchShellConfig, auth: { apiBaseUrl } }
      : builtinWorkbenchShellConfig,
  })
}
```

- [ ] **步骤 2：extension 注入 auth 配置**

在 `apps/extension/entrypoints/newtab/workbenchComposition.ts` 的 runtime bootstrap 构建处（与 playground 对应的 `createWorkbenchRuntimeBootstrap` 调用），同样读取 `import.meta.env.VITE_TABORA_API_BASE` 并合并进 `shellConfig`：

```ts
  const apiBaseUrl = import.meta.env.VITE_TABORA_API_BASE?.trim()
  // ...在 createWorkbenchRuntimeBootstrap 的参数里：
  shellConfig: apiBaseUrl
    ? { ...builtinWorkbenchShellConfig, auth: { apiBaseUrl } }
    : builtinWorkbenchShellConfig,
```

> 若该文件当前用的是 `createWorkbenchComposition` 而非 `createWorkbenchRuntimeBootstrap`，按其实际 bootstrap 入口套用同一合并逻辑；两个 app 的注入方式保持一致。

- [ ] **步骤 3：补 .env.example**

`apps/playground/.env.example` 追加（若文件不存在则创建）：

```
# Tabora Directus 后端地址（Nginx 代理前缀），留空则账号页降级为本地模式
VITE_TABORA_API_BASE=http://localhost:8080/tabora
```

`apps/extension/.env.example` 追加同样一行。

- [ ] **步骤 4：类型检查两个 app**

运行：`cd /home/kebai/桌面/tabora && pnpm --filter playground exec tsc --noEmit -p tsconfig.json && pnpm --filter extension exec tsc --noEmit -p tsconfig.json`
预期：无类型错误。若 `import.meta.env.VITE_TABORA_API_BASE` 报未知属性，在对应 app 的 `vite-env.d.ts` / `env.d.ts` 的 `ImportMetaEnv` 接口加 `readonly VITE_TABORA_API_BASE?: string`。

- [ ] **步骤 5：Commit**

```bash
git add apps/playground/src/workbenchComposition.ts apps/extension/entrypoints/newtab/workbenchComposition.ts apps/playground/.env.example apps/extension/.env.example
git commit -m "feat(auth): playground 与 extension 经 VITE_TABORA_API_BASE 注入后端地址"
```

---

### 任务 8：`packages/sync` re-export 兼容层

保持 `packages/sync` 现有 import 不断（S3 才彻底清理 Supabase）。本任务只确认新增的 `@tabora/auth` 不与 sync 冲突，并让 sync 能选用新的认证类型。**S1 不删除 supabaseauthSession**，仅补充 re-export 便于 S3 过渡。

**文件：**

- 修改：`packages/sync/src/index.ts`
- 修改：`packages/sync/package.json`（dependencies 增加 `@tabora/auth`）

- [ ] **步骤 1：sync 增加 @tabora/auth 依赖**

在 `packages/sync/package.json` 的 `dependencies` 加入：

```json
    "@tabora/auth": "workspace:*",
```

运行：`cd /home/kebai/桌面/tabora && pnpm install`

- [ ] **步骤 2：从 sync re-export Directus 认证类型**

在 `packages/sync/src/index.ts` 末尾追加（不删除现有 Supabase 导出，S3 处理）：

```ts
// Directus auth (S1) - re-exported for S3 migration off Supabase
export {
  createDirectusAuthClient,
  type DirectusAuthClient,
  type DirectusSession,
} from "@tabora/auth"
```

- [ ] **步骤 3：类型检查 sync**

运行：`cd /home/kebai/桌面/tabora && pnpm --filter @tabora/sync exec tsc --noEmit -p tsconfig.json`
预期：无类型错误。

- [ ] **步骤 4：Commit**

```bash
git add packages/sync/src/index.ts packages/sync/package.json pnpm-lock.yaml
git commit -m "chore(sync): re-export @tabora/auth 供 S3 迁移使用"
```

---

### 任务 9：文档同步与全量验证

**文件：**

- 修改：`backend/directus/README.md` 或 `docs/README.md`（如需补充前端接入说明，最小改动）

- [ ] **步骤 1：运行受影响包的测试**

运行：

```bash
cd /home/kebai/桌面/tabora
pnpm --filter @tabora/auth test
pnpm --filter @tabora/official-plugins test
pnpm --filter @tabora/workbench-app test
```

预期：全部 PASS。

- [ ] **步骤 2：全量测试**

运行：`cd /home/kebai/桌面/tabora && pnpm test`
预期：PASS。若出现与本次无关的既有失败（参考 memory：`e2e overflowX`、`AppShell localStorage` 预先失败），记录但不算本次回归。

- [ ] **步骤 3：check 与 build**

运行：

```bash
cd /home/kebai/桌面/tabora
pnpm check
pnpm build
```

预期：均通过（build 覆盖新增 `@tabora/auth` 包与跨包类型导出）。

- [ ] **步骤 4：浏览器人工核对（前端交互变更）**

启动 playground（配置 `VITE_TABORA_API_BASE` 指向本地 Directus），打开设置 → 账号，核对：未配置时显示本地模式提示；配置后可注册、登录、退出；忘记密码两步流程可走通；刷新页面后登录态恢复。

- [ ] **步骤 5：最终 diff 审查与文档登记**

确认 `docs/README.md` 已登记本 plan（在阶段性实施记录补一行指向本文件）。执行规格评审 + 代码质量评审，解决所有 critical / important 问题后再报告完成。

```bash
cd /home/kebai/桌面/tabora
git diff --check
```
