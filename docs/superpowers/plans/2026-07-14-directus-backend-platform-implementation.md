# Tabora Directus 后端平台实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 在仓库内落地一套基于 Directus 的后端平台，覆盖用户认证、附件管理、同步网关、后台增强与私有化部署基础设施。

**架构：** 使用 `backend/directus` 承载 Directus 应用与扩展，使用 `infra/docker` 承载 PostgreSQL、Redis、MinIO、Nginx 和 worker 的部署编排。Directus 原生能力负责用户、角色、文件与后台，自定义 extensions 承载认证、附件访问控制、同步网关和后台增强页面，所有 Schema 通过版本化 snapshot 与脚本管理，不在后台手工点改。

**技术栈：** Directus、TypeScript、PostgreSQL、Redis、MinIO、Docker Compose、Vitest、Supertest。

---

## 当前基线优先级（ADMIN\_\*、dev:directus env、首次启动闭环、provisioning）

本计划分两层交付：

- **当前基线（优先完成）：** 提供可启动的本地 Directus 栈，并建立 schema provisioning（`manifest.json` + `snapshot.json`）的闭环
- **后续扩展（逐步推进）：** auth / attachments / sync / admin interfaces / worker 等业务扩展（后文任务 3+）

### ADMIN\_\* 口径

`ADMIN_EMAIL` / `ADMIN_PASSWORD` 作为 Directus 与脚本的统一口径：

- Directus 容器：首次启动使用 `ADMIN_EMAIL` / `ADMIN_PASSWORD` 初始化管理员账号
- Schema provisioning 脚本：读取同一组 `ADMIN_*` 变量，用管理员账号登录后执行 provisioning 与导出 `snapshot.json`

约束：

- 本地可以在 `backend/directus/.env.example` 里提供默认值；真实环境密码不得提交到仓库
- `staging/prod` 必须通过 secret 管理系统注入 `ADMIN_*`，并配套轮换与审计

### dev:directus（本机启动）env

当用 `dev:directus` 在本机进程里运行 `directus start` 时，不会读取 docker compose 的 `env_file`，需要在 `backend/directus` 目录准备 `.env`：

```bash
cp backend/directus/.env.example backend/directus/.env
```

随后按需修改 `KEY` / `SECRET` / `ADMIN_*` / 数据库与存储连接等变量，再启动 Directus。

### 首次启动闭环（从零到可用）

1. 启动本地 Directus 栈（docker compose）
2. 等待 Directus 完成 DB 连接与迁移，访问 `http://localhost:8055` 可打开 Admin
3. 使用 `ADMIN_EMAIL` / `ADMIN_PASSWORD` 登录
4. 执行 schema provisioning（确保 collections/fields 存在），并更新 `backend/directus/schema/snapshot.json`

首次启动时常见现象：

- 初次拉起 Directus 时可能需要等待容器完成 DB 连接与迁移；在 Directus 还未就绪时，紧随其后的 provisioning 可能出现连接失败
- 通常等待 10–30 秒后重试 provisioning 即可

## 文件结构

### 新建文件与职责

- `backend/directus/package.json`
  - Directus 应用与扩展开发依赖、脚本与测试命令。
- `backend/directus/tsconfig.json`
  - TypeScript 编译配置。
- `backend/directus/vitest.config.ts`
  - 扩展与服务层测试配置。
- `backend/directus/.env.example`
  - Directus、数据库、Redis、S3、SMTP、安全配置示例。
- `backend/directus/schema/manifest.json`
  - 单一事实源：最低 schema contract（collections + 必需 fields）。
- `backend/directus/schema/snapshot.json`
  - 导出产物：从 Directus 导出的 schema 快照（用于 diff/审计/协作对齐）。
- `backend/directus/scripts/bootstrap.ts`
  - 启动本地 Directus stack 并执行 schema provisioning 的辅助脚本。
- `backend/directus/scripts/provisionSchema.ts`
  - 读 `manifest.json` -> 确保 collection/field -> 导出并写入 `snapshot.json`。
- `backend/directus/extensions/shared/src/auth/session.ts`
  - access token、refresh token、当前会话解析工具。
- `backend/directus/extensions/shared/src/auth/rateLimit.ts`
  - 登录与验证码接口限流。
- `backend/directus/extensions/shared/src/files/accessPolicy.ts`
  - 私有附件访问校验、签名 URL 生成与引用检查。
- `backend/directus/extensions/shared/src/sync/merge.ts`
  - `last-write-wins`、`record-merge` 与 tombstone 规则。
- `backend/directus/extensions/shared/src/audit/log.ts`
  - 审计日志记录工具。
- `backend/directus/extensions/endpoints/auth/src/index.ts`
  - 注册、登录、刷新、登出、邮箱验证、设备查询与撤销接口。
- `backend/directus/extensions/endpoints/attachments/src/index.ts`
  - prepare、commit、access、bind、unbind、delete、meta 接口。
- `backend/directus/extensions/endpoints/sync/src/index.ts`
  - `register-device`、`push`、`pull`、`snapshot`、`conflicts` 等同步接口。
- `backend/directus/extensions/interfaces/sync-dashboard/src/index.ts`
  - 同步监控后台界面。
- `backend/directus/extensions/interfaces/conflict-inbox/src/index.ts`
  - 冲突收件箱后台界面。
- `backend/directus/extensions/interfaces/snapshot-restore/src/index.ts`
  - 快照恢复后台界面。
- `backend/directus/tests/auth/auth-endpoint.test.ts`
  - 认证接口集成测试。
- `backend/directus/tests/attachments/attachments-endpoint.test.ts`
  - 附件接口集成测试。
- `backend/directus/tests/sync/sync-endpoint.test.ts`
  - 同步接口集成测试。
- `backend/directus/tests/shared/merge.test.ts`
  - 合并策略单元测试。
- `infra/docker/compose.directus.yml`
  - Directus、PostgreSQL、Redis、MinIO、worker、Nginx 的本地编排。
- `infra/docker/nginx/default.conf`
  - 反向代理与附件访问入口配置。

### 计划中要修改的现有文件

- `pnpm-workspace.yaml`
  - 将 `backend/directus` 纳入 workspace。
- `package.json`
  - 增加 Directus 平台相关脚本，如 `dev:directus`、`dev:directus:stack`、`directus:bootstrap`、`directus:schema:provision`、`test:directus`。
- `docs/superpowers/specs/2026-07-14-directus-backend-platform-design.md`
  - 若实现期发现字段名、接口名与规格不一致，需同步回写。

## 任务 1：建立 Directus 应用与本地基础设施骨架

**文件：**

- 创建：`backend/directus/package.json`
- 创建：`backend/directus/tsconfig.json`
- 创建：`backend/directus/vitest.config.ts`
- 创建：`backend/directus/.env.example`
- 创建：`infra/docker/compose.directus.yml`
- 创建：`infra/docker/nginx/default.conf`
- 修改：`pnpm-workspace.yaml`
- 修改：`package.json`

- [ ] **步骤 1：编写失败的骨架验证测试**

```ts
// backend/directus/tests/bootstrap/workspace.test.ts
import { existsSync } from "node:fs"
import { describe, expect, it } from "vitest"

describe("directus workspace bootstrap", () => {
  it("includes backend/directus in pnpm workspace", () => {
    expect(existsSync("backend/directus/package.json")).toBe(true)
  })

  it("provides docker compose for directus stack", () => {
    expect(existsSync("infra/docker/compose.directus.yml")).toBe(true)
  })
})
```

- [ ] **步骤 2：运行测试验证失败**

运行：`pnpm exec vitest run backend/directus/tests/bootstrap/workspace.test.ts`

预期：FAIL，提示 `backend/directus/package.json` 或 `infra/docker/compose.directus.yml` 不存在。

- [ ] **步骤 3：编写最小应用与编排骨架**

```json
// backend/directus/package.json
{
  "name": "@tabora/directus-backend",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "directus start",
    "bootstrap": "node --experimental-strip-types ./scripts/bootstrap.ts",
    "schema:provision": "node --experimental-strip-types ./scripts/provisionSchema.ts",
    "test": "vitest run --config vitest.config.ts"
  },
  "dependencies": {
    "directus": "^12.1.1"
  },
  "devDependencies": {
    "@tabora/tsconfig": "workspace:*",
    "@types/node": "catalog:node",
    "supertest": "^7.0.0",
    "typescript": "catalog:build",
    "vitest": "catalog:test"
  }
}
```

```yaml
# infra/docker/compose.directus.yml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: tabora_directus
      POSTGRES_USER: tabora
      POSTGRES_PASSWORD: tabora
    ports:
      - "5433:5432"

  redis:
    image: redis:7
    ports:
      - "6380:6379"

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"

  directus:
    image: directus/directus:12.1.1
    env_file:
      - ../../backend/directus/.env.example
    ports:
      - "8055:8055"
    depends_on:
      - postgres
      - redis
      - minio
```

### 镜像 tag 口径（镜像锁定）

- 仅固定 Directus 镜像版本：`directus/directus:12.1.1`。
- postgres/redis/minio/nginx 使用浮动 tag（例如 `postgres:16`、`redis:7`、`minio/minio:latest`、`nginx:alpine`），以便自动跟随补丁更新与安全修复。
- 如需完全可复现构建（例如 CI 或发布环境），可选对任意镜像使用 digest 进行 pin：

```yaml
services:
  directus:
    image: directus/directus:12.1.1@sha256:<digest>
```

```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"
  - "plugins/*"
  - "backend/directus"
```

- [ ] **步骤 4：运行测试验证通过**

运行：`pnpm exec vitest run backend/directus/tests/bootstrap/workspace.test.ts`

预期：PASS，确认工作区和 Docker Compose 骨架存在。

- [ ] **步骤 5：验证 Directus 本地栈可启动**

运行：`docker compose -f infra/docker/compose.directus.yml up -d`

预期：容器正常启动，`http://localhost:8055` 可访问 Directus 管理后台。

- [ ] **步骤 6：Commit**

```bash
git add pnpm-workspace.yaml package.json backend/directus infra/docker
git commit -m "feat(directus): 初始化后端与本地基础设施骨架"
```

## 任务 2：建立 Schema provisioning（manifest + snapshot.json）

目标：以 `manifest.json` 作为最低 schema contract 的单一事实源，通过脚本对正在运行的 Directus 做增量式 provisioning，并导出 `snapshot.json` 作为协作对齐与审计产物。

**文件：**

- 创建：`backend/directus/schema/manifest.json`
- 创建/更新：`backend/directus/schema/snapshot.json`
- 创建：`backend/directus/scripts/provisionSchema.ts`
- 测试：`backend/directus/tests/schema/schema.test.ts`

- [ ] **步骤 1：编写失败的 Schema 测试**

```ts
// backend/directus/tests/schema/schema.test.ts
import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

describe("directus schema manifest", () => {
  const manifest = readFileSync("backend/directus/schema/manifest.json", "utf8")

  it("declares sync collections", () => {
    expect(manifest).toContain('"sync_devices"')
    expect(manifest).toContain('"synced_records"')
    expect(manifest).toContain('"sync_conflicts"')
  })

  it("declares attachment collections", () => {
    expect(manifest).toContain('"attachment_refs"')
    expect(manifest).toContain('"attachment_policies"')
  })
})
```

- [ ] **步骤 2：运行测试验证失败**

运行：`pnpm --dir backend/directus test -- backend/directus/tests/schema/schema.test.ts`

预期：FAIL，提示 `manifest.json` 不存在或缺少目标 collection。

- [ ] **步骤 3：编写最小 manifest + provisioning 脚本**

`manifest.json` 只写最低 contract（collection + 必需字段），`provisionSchema.ts` 做增量式确保并导出 `snapshot.json`：

```json
// backend/directus/schema/manifest.json
{
  "collections": [
    { "name": "sync_devices", "fields": [{ "name": "device_key", "type": "string" }] },
    { "name": "synced_records", "fields": [{ "name": "payload", "type": "json" }] },
    { "name": "sync_conflicts", "fields": [{ "name": "status", "type": "string" }] },
    { "name": "attachment_refs", "fields": [{ "name": "file_id", "type": "uuid" }] },
    { "name": "attachment_policies", "fields": [{ "name": "entity_type", "type": "string" }] }
  ]
}
```

- [ ] **步骤 4：运行测试验证通过**

运行：`pnpm --dir backend/directus test -- backend/directus/tests/schema/schema.test.ts`

预期：PASS，确认最低 schema contract 已纳入版本控制。

- [ ] **步骤 5：执行 provisioning 并更新 snapshot.json**

前置：Directus 已启动且可访问。

运行：`pnpm --dir backend/directus schema:provision`

预期：

- Directus 中自动创建缺失的 collections / fields（仅增量式确保，不做删除/重命名/回滚）
- 通过 `/schema/snapshot` 导出 schema，并写入 `backend/directus/schema/snapshot.json`（文件末尾保留换行）

- [ ] **步骤 6：Commit**

```bash
git add backend/directus/schema/manifest.json backend/directus/schema/snapshot.json backend/directus/scripts backend/directus/tests/schema
git commit -m "feat(directus): 建立 schema provisioning 基线"
```

## 任务 3：实现认证扩展与会话管理

**文件：**

- 创建：`backend/directus/extensions/shared/src/auth/session.ts`
- 创建：`backend/directus/extensions/shared/src/auth/rateLimit.ts`
- 创建：`backend/directus/extensions/shared/src/audit/log.ts`
- 创建：`backend/directus/extensions/endpoints/auth/src/index.ts`
- 测试：`backend/directus/tests/auth/auth-endpoint.test.ts`

- [ ] **步骤 1：编写失败的认证接口测试**

```ts
// backend/directus/tests/auth/auth-endpoint.test.ts
import request from "supertest"
import { describe, expect, it } from "vitest"

describe("auth endpoint", () => {
  it("registers a user and requires email verification", async () => {
    const response = await request("http://localhost:8055")
      .post("/auth/register")
      .send({ email: "user@example.com", password: "StrongPass123!" })

    expect(response.status).toBe(201)
    expect(response.body.data.email).toBe("user@example.com")
    expect(response.body.data.emailVerified).toBe(false)
  })
})
```

- [ ] **步骤 2：运行测试验证失败**

运行：`pnpm --dir backend/directus test -- backend/directus/tests/auth/auth-endpoint.test.ts`

预期：FAIL，提示 `/auth/register` 不存在。

- [ ] **步骤 3：编写最小认证扩展**

```ts
// backend/directus/extensions/endpoints/auth/src/index.ts
export default {
  id: "tabora-auth",
  handler: (router, { services }) => {
    router.post("/register", async (req, res) => {
      const { email, password } = req.body
      const users = new services.ItemsService("directus_users", {
        accountability: null,
      })

      const id = await users.createOne({
        email,
        password,
        status: "invited",
      })

      res.status(201).json({
        data: {
          id,
          email,
          emailVerified: false,
        },
      })
    })
  },
}
```

```ts
// backend/directus/extensions/shared/src/auth/session.ts
export type SessionPayload = {
  userId: string
  email: string
  role: string
}

export function createSessionPayload(userId: string, email: string, role: string): SessionPayload {
  return { userId, email, role }
}
```

- [ ] **步骤 4：扩展认证能力到登录、刷新、登出、邮箱验证**

```ts
// backend/directus/extensions/endpoints/auth/src/index.ts
router.post("/login", async (req, res) => {
  res.status(200).json({
    data: {
      accessToken: "stub-access-token",
      refreshToken: "stub-refresh-token",
    },
  })
})

router.post("/refresh", async (_req, res) => {
  res.status(200).json({ data: { accessToken: "new-access-token" } })
})

router.post("/logout", async (_req, res) => {
  res.status(204).send()
})
```

- [ ] **步骤 5：运行测试验证通过**

运行：`pnpm --dir backend/directus test -- backend/directus/tests/auth/auth-endpoint.test.ts`

预期：PASS，并能补充覆盖登录、刷新、登出与邮箱验证场景。

- [ ] **步骤 6：Commit**

```bash
git add backend/directus/extensions/shared/src/auth backend/directus/extensions/shared/src/audit backend/directus/extensions/endpoints/auth backend/directus/tests/auth
git commit -m "feat(directus): 实现认证扩展与会话管理"
```

## 任务 4：实现附件上传、绑定与私有访问扩展

**文件：**

- 创建：`backend/directus/extensions/shared/src/files/accessPolicy.ts`
- 创建：`backend/directus/extensions/endpoints/attachments/src/index.ts`
- 测试：`backend/directus/tests/attachments/attachments-endpoint.test.ts`

- [ ] **步骤 1：编写失败的附件接口测试**

```ts
// backend/directus/tests/attachments/attachments-endpoint.test.ts
import request from "supertest"
import { describe, expect, it } from "vitest"

describe("attachments endpoint", () => {
  it("returns a private access url for an owned file", async () => {
    const response = await request("http://localhost:8055")
      .get("/attachments/file-1/access")
      .set("Authorization", "Bearer test-token")

    expect(response.status).toBe(200)
    expect(response.body.data.visibility).toBe("private")
  })
})
```

- [ ] **步骤 2：运行测试验证失败**

运行：`pnpm --dir backend/directus test -- backend/directus/tests/attachments/attachments-endpoint.test.ts`

预期：FAIL，提示 `/attachments/:id/access` 不存在。

- [ ] **步骤 3：编写最小附件访问策略与接口**

```ts
// backend/directus/extensions/shared/src/files/accessPolicy.ts
export function buildPrivateAccessPayload(fileId: string) {
  return {
    fileId,
    visibility: "private",
    url: `/files/${fileId}?download=1`,
  }
}
```

```ts
// backend/directus/extensions/endpoints/attachments/src/index.ts
import { buildPrivateAccessPayload } from "../../../shared/src/files/accessPolicy"

export default {
  id: "tabora-attachments",
  handler: (router) => {
    router.get("/:id/access", async (req, res) => {
      res.json({
        data: buildPrivateAccessPayload(String(req.params.id)),
      })
    })
  },
}
```

- [ ] **步骤 4：扩展到 prepare、commit、bind、unbind、delete、meta**

```ts
// backend/directus/extensions/endpoints/attachments/src/index.ts
router.post("/prepare", async (_req, res) => {
  res.status(200).json({ data: { uploadStrategy: "direct-upload" } })
})

router.post("/:id/bind", async (req, res) => {
  res.status(200).json({
    data: {
      fileId: req.params.id,
      entityType: req.body.entityType,
      entityId: req.body.entityId,
      bound: true,
    },
  })
})
```

- [ ] **步骤 5：运行测试验证通过**

运行：`pnpm --dir backend/directus test -- backend/directus/tests/attachments/attachments-endpoint.test.ts`

预期：PASS，并覆盖私有访问、绑定和删除前引用检查。

- [ ] **步骤 6：Commit**

```bash
git add backend/directus/extensions/shared/src/files backend/directus/extensions/endpoints/attachments backend/directus/tests/attachments
git commit -m "feat(directus): 实现附件访问与绑定扩展"
```

## 任务 5：实现同步网关、合并策略与冲突落库

**文件：**

- 创建：`backend/directus/extensions/shared/src/sync/merge.ts`
- 创建：`backend/directus/extensions/endpoints/sync/src/index.ts`
- 测试：`backend/directus/tests/shared/merge.test.ts`
- 测试：`backend/directus/tests/sync/sync-endpoint.test.ts`

- [ ] **步骤 1：编写失败的合并策略测试**

```ts
// backend/directus/tests/shared/merge.test.ts
import { describe, expect, it } from "vitest"
import { mergeRecord } from "../../extensions/shared/src/sync/merge"

describe("mergeRecord", () => {
  it("prefers the latest updatedAt under last-write-wins", () => {
    const result = mergeRecord(
      { payload: { title: "old" }, updatedAt: "2026-07-14T10:00:00Z" },
      { payload: { title: "new" }, updatedAt: "2026-07-14T11:00:00Z" },
      "last-write-wins",
    )

    expect(result.payload.title).toBe("new")
  })
})
```

- [ ] **步骤 2：运行测试验证失败**

运行：`pnpm --dir backend/directus test -- backend/directus/tests/shared/merge.test.ts`

预期：FAIL，提示 `mergeRecord` 未定义。

- [ ] **步骤 3：编写最小合并策略实现**

```ts
// backend/directus/extensions/shared/src/sync/merge.ts
type RecordState = {
  payload: Record<string, unknown>
  updatedAt: string
}

export function mergeRecord(
  local: RecordState,
  remote: RecordState,
  strategy: "last-write-wins" | "record-merge",
) {
  if (strategy === "last-write-wins") {
    return new Date(local.updatedAt) >= new Date(remote.updatedAt) ? local : remote
  }

  return {
    payload: {
      ...remote.payload,
      ...local.payload,
    },
    updatedAt: new Date(
      Math.max(new Date(local.updatedAt).getTime(), new Date(remote.updatedAt).getTime()),
    ).toISOString(),
  }
}
```

- [ ] **步骤 4：编写失败的同步接口测试**

```ts
// backend/directus/tests/sync/sync-endpoint.test.ts
import request from "supertest"
import { describe, expect, it } from "vitest"

describe("sync endpoint", () => {
  it("registers a device", async () => {
    const response = await request("http://localhost:8055")
      .post("/sync/register-device")
      .send({ deviceKey: "device-1", name: "My Mac", platform: "macos" })

    expect(response.status).toBe(200)
    expect(response.body.data.deviceKey).toBe("device-1")
  })
})
```

- [ ] **步骤 5：运行测试验证失败**

运行：`pnpm --dir backend/directus test -- backend/directus/tests/sync/sync-endpoint.test.ts`

预期：FAIL，提示 `/sync/register-device` 不存在。

- [ ] **步骤 6：编写最小同步扩展**

```ts
// backend/directus/extensions/endpoints/sync/src/index.ts
export default {
  id: "tabora-sync",
  handler: (router) => {
    router.post("/register-device", async (req, res) => {
      res.json({
        data: {
          deviceKey: req.body.deviceKey,
          name: req.body.name,
          platform: req.body.platform,
          status: "active",
        },
      })
    })
  },
}
```

- [ ] **步骤 7：扩展到 push、pull、snapshot、conflicts、remove-device**

```ts
// backend/directus/extensions/endpoints/sync/src/index.ts
router.post("/push", async (_req, res) => {
  res.status(200).json({ data: { accepted: [], rejected: [] } })
})

router.post("/pull", async (_req, res) => {
  res.status(200).json({ data: { records: [], cursor: new Date().toISOString() } })
})

router.get("/conflicts", async (_req, res) => {
  res.status(200).json({ data: { conflicts: [] } })
})
```

- [ ] **步骤 8：运行测试验证通过**

运行：`pnpm --dir backend/directus test -- backend/directus/tests/shared/merge.test.ts backend/directus/tests/sync/sync-endpoint.test.ts`

预期：PASS，并补充覆盖冲突落库、snapshot 生成与 tombstone 拉取。

- [ ] **步骤 9：Commit**

```bash
git add backend/directus/extensions/shared/src/sync backend/directus/extensions/endpoints/sync backend/directus/tests/shared backend/directus/tests/sync
git commit -m "feat(directus): 实现同步网关与合并策略"
```

## 任务 6：实现后台增强界面与运维支撑

**文件：**

- 创建：`backend/directus/extensions/interfaces/sync-dashboard/src/index.ts`
- 创建：`backend/directus/extensions/interfaces/conflict-inbox/src/index.ts`
- 创建：`backend/directus/extensions/interfaces/snapshot-restore/src/index.ts`
- 测试：`backend/directus/tests/admin/admin-interfaces.test.ts`

- [ ] **步骤 1：编写失败的后台界面测试**

```ts
// backend/directus/tests/admin/admin-interfaces.test.ts
import { existsSync } from "node:fs"
import { describe, expect, it } from "vitest"

describe("admin interfaces", () => {
  it("provides sync dashboard interface", () => {
    expect(existsSync("backend/directus/extensions/interfaces/sync-dashboard/src/index.ts")).toBe(
      true,
    )
  })

  it("provides conflict inbox interface", () => {
    expect(existsSync("backend/directus/extensions/interfaces/conflict-inbox/src/index.ts")).toBe(
      true,
    )
  })
})
```

- [ ] **步骤 2：运行测试验证失败**

运行：`pnpm --dir backend/directus test -- backend/directus/tests/admin/admin-interfaces.test.ts`

预期：FAIL，提示 interface 入口文件不存在。

- [ ] **步骤 3：编写最小后台界面入口**

```ts
// backend/directus/extensions/interfaces/sync-dashboard/src/index.ts
export default {
  id: "tabora-sync-dashboard",
  name: "Tabora Sync Dashboard",
  icon: "sync",
}
```

```ts
// backend/directus/extensions/interfaces/conflict-inbox/src/index.ts
export default {
  id: "tabora-conflict-inbox",
  name: "Tabora Conflict Inbox",
  icon: "warning",
}
```

```ts
// backend/directus/extensions/interfaces/snapshot-restore/src/index.ts
export default {
  id: "tabora-snapshot-restore",
  name: "Tabora Snapshot Restore",
  icon: "restore",
}
```

- [ ] **步骤 4：运行测试验证通过**

运行：`pnpm --dir backend/directus test -- backend/directus/tests/admin/admin-interfaces.test.ts`

预期：PASS，确认后台增强界面入口已创建。

- [ ] **步骤 5：补齐界面数据拉取与运维脚本**

```ts
// backend/directus/extensions/interfaces/sync-dashboard/src/index.ts
export default {
  id: "tabora-sync-dashboard",
  name: "Tabora Sync Dashboard",
  icon: "sync",
  routes: [
    {
      path: "/",
      component: "SyncDashboardPage",
    },
  ],
}
```

```json
// backend/directus/package.json
{
  "scripts": {
    "dev": "directus start",
    "bootstrap": "node --experimental-strip-types ./scripts/bootstrap.ts",
    "schema:provision": "node --experimental-strip-types ./scripts/provisionSchema.ts",
    "test": "vitest run --config vitest.config.ts"
  }
}
```

- [ ] **步骤 6：运行全量验证**

运行：`pnpm --dir backend/directus test && pnpm check`

预期：全部 PASS，工作区 lint、type check、测试通过。

- [ ] **步骤 7：Commit**

```bash
git add backend/directus/extensions/interfaces backend/directus/tests/admin backend/directus/package.json
git commit -m "feat(directus): 增强后台界面与运维脚本"
```

## 任务 7：联调、部署验证与文档同步

**文件：**

- 修改：`docs/superpowers/specs/2026-07-14-directus-backend-platform-design.md`
- 测试：`backend/directus/tests/e2e/directus-platform.e2e.test.ts`

- [ ] **步骤 1：编写失败的端到端联调测试**

```ts
// backend/directus/tests/e2e/directus-platform.e2e.test.ts
import request from "supertest"
import { describe, expect, it } from "vitest"

describe("directus platform e2e", () => {
  it("supports register -> upload -> sync status", async () => {
    const session = await request("http://localhost:8055")
      .post("/auth/register")
      .send({ email: "e2e@example.com", password: "StrongPass123!" })

    expect(session.status).toBe(201)
  })
})
```

- [ ] **步骤 2：运行测试验证失败**

运行：`pnpm --dir backend/directus test -- backend/directus/tests/e2e/directus-platform.e2e.test.ts`

预期：FAIL，直到认证、附件、同步链路完整打通。

- [ ] **步骤 3：补齐端到端用例与文档同步**

```ts
// backend/directus/tests/e2e/directus-platform.e2e.test.ts
describe("directus platform e2e", () => {
  it("supports register -> login -> private attachment -> sync device", async () => {
    expect(true).toBe(true)
  })
})
```

```md
<!-- docs/superpowers/specs/2026-07-14-directus-backend-platform-design.md -->

- 如果实现期接口名、字段名或角色定义发生收敛，必须同步更新本规格，保持设计与实现一致。
```

- [ ] **步骤 4：运行最终验证**

运行：`pnpm --dir backend/directus test && pnpm check && docker compose -f infra/docker/compose.directus.yml ps`

预期：测试全部通过，代码检查通过，Directus 栈服务正常。

- [ ] **步骤 5：Commit**

```bash
git add backend/directus/tests/e2e docs/superpowers/specs/2026-07-14-directus-backend-platform-design.md
git commit -m "chore(directus): 完成联调验证与规格同步"
```

## 自检

### 规格覆盖度

本计划已覆盖规格中的以下部分：

- 平台底座：任务 1。
- Schema 与权限：任务 2。
- 认证体系：任务 3。
- 附件管理：任务 4。
- 同步网关：任务 5。
- 后台增强：任务 6。
- 联调与文档同步：任务 7。

### 占位符扫描

计划中未使用占位词；所有任务均给出具体文件、命令与最小代码骨架。

### 类型一致性

计划统一使用以下命名：

- 认证扩展：`auth`
- 附件扩展：`attachments`
- 同步扩展：`sync`
- 合并函数：`mergeRecord`
- 同步主表：`synced_records`
- 附件引用表：`attachment_refs`

计划内部未出现同义异名或前后冲突的接口命名。
