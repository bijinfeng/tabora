# S2 Directus 数据同步网关实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法跟踪。

**目标：** 在 `directus-extension-tabora` 扩展中实现 `GET/POST /tabora/sync/records`（增量 pull / 批量 push），状态同步 + LWW 冲突 + tombstone，服务端敏感字段过滤，按 `user_id` 隔离。

**架构：** 复用现有 schema manifest 的 `synced_records` 集合（不新建 `sync_records`，避免重复表），字段按 S2 规格扩展。新增 `src/sync.ts` 路由模块 + `src/syncSensitiveFilter.ts`（移植前端过滤逻辑），在 `src/index.ts` 注册。测试沿用 `tabora-test-kit.ts` 的内存数据库模式，直接导入 `src/index.ts`。

**技术栈：** TypeScript、Directus 12 extension SDK、Zod 4、Knex（经 context.database）、Vitest。

**规格事实源：** `docs/superpowers/specs/2026-07-16-directus-sync-gateway-s2-design.md`。与规格的两处对齐修正：(1) 集合名用已有 `synced_records`；(2) 补服务端敏感字段过滤（PRD 硬边界：网关是主防线）。

**仓库约束：** 分支 `s1-frontend-directus-auth` 继续工作（或按用户指示新分支）。不自动 commit 计划外文件。测试命令从 `backend/directus` 目录运行。

---

### 任务 1：扩展 `synced_records` schema 与 RED schema 测试

**文件：**

- 修改：`backend/directus/schema/manifest.json`
- 修改：`backend/directus/tests/schema/schema.test.ts`

- [ ] **步骤 1：写 RED schema 断言**

在 `tests/schema/schema.test.ts` 增加（仿照现有 `user_refresh_tokens` 断言风格）：

```ts
const syncedRecords = manifest.collections.find(
  (collection) => collection.name === "synced_records",
)

expect(syncedRecords?.fields).toEqual(
  expect.arrayContaining([
    expect.objectContaining({ name: "user_id", type: "uuid" }),
    expect.objectContaining({ name: "device_id", type: "string" }),
    expect.objectContaining({ name: "record_type", type: "string" }),
    expect.objectContaining({ name: "record_id", type: "string" }),
    expect.objectContaining({ name: "data", type: "json" }),
    expect.objectContaining({ name: "version", type: "integer" }),
    expect.objectContaining({ name: "record_updated_at", type: "timestamp" }),
    expect.objectContaining({ name: "deleted", type: "boolean" }),
  ]),
)
```

说明：时间戳字段命名 `record_updated_at`，避免与 Directus 系统字段/约定冲突。

- [ ] **步骤 2：运行确认 RED**

```bash
cd /home/kebai/桌面/tabora/backend/directus
../../node_modules/.bin/vitest run --config vitest.config.ts tests/schema/schema.test.ts
```

预期：FAIL（manifest 里 synced_records 仍是旧字段 scope/entity_type/record_key/payload/deleted_at）。

- [ ] **步骤 3：更新 manifest**

把 manifest.json 中 `synced_records` 的 `fields` 整体替换为：

```json
[
  { "name": "user_id", "type": "uuid" },
  { "name": "device_id", "type": "string" },
  { "name": "record_type", "type": "string" },
  { "name": "record_id", "type": "string" },
  { "name": "data", "type": "json" },
  { "name": "version", "type": "integer" },
  { "name": "record_updated_at", "type": "timestamp" },
  { "name": "deleted", "type": "boolean" }
]
```

- [ ] **步骤 4：运行确认 GREEN 并 commit**

同上命令，预期 PASS。

```bash
git add backend/directus/schema/manifest.json backend/directus/tests/schema/schema.test.ts
git commit -m "feat(directus): synced_records schema 对齐 S2 同步网关字段"
```

---

### 任务 2：服务端敏感字段过滤模块

**文件：**

- 创建：`backend/directus/extensions/directus-extension-tabora/src/syncSensitiveFilter.ts`
- 测试：`backend/directus/tests/endpoints/tabora-sync-filter.test.ts`

- [ ] **步骤 1：写 RED 测试**

`tests/endpoints/tabora-sync-filter.test.ts`：

```ts
import { describe, expect, it } from "vitest"
import { findSensitiveFieldPath } from "../../extensions/directus-extension-tabora/src/syncSensitiveFilter"

describe("findSensitiveFieldPath", () => {
  it("returns null for a safe payload", () => {
    expect(findSensitiveFieldPath({ title: "笔记", tags: ["a"] })).toBeNull()
  })

  it("detects sensitive key names case-insensitively", () => {
    expect(findSensitiveFieldPath({ apiKey: "x" })).toBe("apiKey")
    expect(findSensitiveFieldPath({ nested: { Password: "x" } })).toBe("nested.Password")
    expect(findSensitiveFieldPath({ a: [{ mySecretValue: 1 }] })).toBe("a[0].mySecretValue")
  })

  it("detects file path values", () => {
    expect(findSensitiveFieldPath({ p: "/home/user/x.png" })).toBe("p")
    expect(findSensitiveFieldPath({ p: "C:\\\\Users\\\\x" })).toBe("p")
    expect(findSensitiveFieldPath({ p: "file:///tmp/a" })).toBe("p")
  })

  it("does not flag normal urls or relative paths", () => {
    expect(findSensitiveFieldPath({ p: "https://example.com/a" })).toBeNull()
    expect(findSensitiveFieldPath({ p: "docs/readme.md" })).toBeNull()
  })

  it("handles null and non-object payloads", () => {
    expect(findSensitiveFieldPath(null)).toBeNull()
    expect(findSensitiveFieldPath("plain")).toBeNull()
  })
})
```

- [ ] **步骤 2：运行确认 RED**

```bash
cd /home/kebai/桌面/tabora/backend/directus
../../node_modules/.bin/vitest run --config vitest.config.ts tests/endpoints/tabora-sync-filter.test.ts
```

预期：FAIL（模块不存在）。

- [ ] **步骤 3：实现（移植前端 `packages/sync/src/sensitiveFilter.ts` 的语义，返回路径而非抛异常）**

`src/syncSensitiveFilter.ts`：

```ts
const SENSITIVE_KEYWORDS = ["apikey", "token", "password", "secret", "filepath"]

const FILE_PATH_PATTERNS = [/^\/[A-Za-z]+\//, /^[A-Z]:\\/, /^file:\/\//]

function isFilePath(value: unknown): boolean {
  return typeof value === "string" && FILE_PATH_PATTERNS.some((pattern) => pattern.test(value))
}

/**
 * 返回 payload 中第一个敏感字段的路径；安全则返回 null。
 * 与前端 @tabora/sync 的 sensitiveFilter 语义一致，服务端是主防线。
 */
export function findSensitiveFieldPath(payload: unknown, path = ""): string | null {
  if (typeof payload !== "object" || payload === null) {
    return null
  }

  if (Array.isArray(payload)) {
    for (const [index, item] of payload.entries()) {
      const found = findSensitiveFieldPath(item, path ? `${path}[${index}]` : `[${index}]`)
      if (found) return found
    }
    return null
  }

  for (const [key, value] of Object.entries(payload)) {
    const fullPath = path ? `${path}.${key}` : key
    const lowerKey = key.toLowerCase()

    if (SENSITIVE_KEYWORDS.some((keyword) => lowerKey.includes(keyword))) {
      return fullPath
    }
    if (isFilePath(value)) {
      return fullPath
    }
    const nested = findSensitiveFieldPath(value, fullPath)
    if (nested) return nested
  }

  return null
}
```

- [ ] **步骤 4：运行确认 GREEN 并 commit**

```bash
git add backend/directus/extensions/directus-extension-tabora/src/syncSensitiveFilter.ts backend/directus/tests/endpoints/tabora-sync-filter.test.ts
git commit -m "feat(directus): 同步网关服务端敏感字段过滤"
```

---

### 任务 3：sync 端点 RED 测试（pull + push 契约）

**文件：**

- 创建：`backend/directus/tests/endpoints/tabora-sync.test.ts`
- 参考：`tests/endpoints/tabora-auth.test.ts` 与 `tabora-test-kit.ts` 的既有模式（createRouter/findRoute/createResponse/内存 database）

- [ ] **步骤 1：编写测试骨架与内存数据准备**

测试直接导入 `extensions/directus-extension-tabora/src/index.ts`，用 test-kit 构造 context（内存 database 含 `synced_records` 表）与带 `accountability: { user: "user-1" }` 的 request。约定：路由注册为 `router.get("/sync/records", ...)` 与 `router.post("/sync/records", ...)`（扩展挂载在 /tabora 前缀下）。

- [ ] **步骤 2：覆盖以下用例（全部先 RED）**

Pull：

1. 未登录（accountability.user 为空）→ 抛 InvalidCredentialsError（经 next(error)）。
2. 返回当前用户全部记录，响应形状 `{ data: { records: [...], server_time } }`；records 元素含 type/id/data/version/updated_at/deleted/device_id；deleted 记录 data 为 null。
3. `?since=<iso>` 只返回 record_updated_at 大于 since 的记录。
4. `?types=note,plugin_data` 只返回对应 record_type。
5. 不返回其他用户（user-2）的记录。
6. since 非法（非 ISO 时间）→ InvalidPayloadError。

Push：7. 新记录（服务端不存在）→ 插入 version=1，accepted 含该 id。8. 已存在记录、version 匹配且 client_timestamp 更新 → 更新，version+1，accepted。9. version 不匹配 → conflicts 含 server_version/server_data/server_updated_at/server_device_id，不写库。10. client_timestamp 早于服务端 record_updated_at → conflicts。11. deleted: true → 记录标记 deleted 且 data 置 null，accepted。12. payload 含敏感字段（如 data.apiKey）→ 该条进 rejected（`{ id, reason }`），不写库，其他条不受影响。13. body 非数组或字段缺失 → InvalidPayloadError。14. 未登录 → InvalidCredentialsError。15. 批量条数超过 100 → InvalidPayloadError（上限防滥用）。

响应形状：`{ data: { accepted: string[], conflicts: [...], rejected: [{ id, reason }], server_time } }`。

说明：与规格 3.2 相比新增 `rejected`（敏感字段拒绝与冲突语义不同，分开表达）；`server_time` 语义不变。

- [ ] **步骤 3：运行确认 RED 并 commit 测试**

```bash
cd /home/kebai/桌面/tabora/backend/directus
../../node_modules/.bin/vitest run --config vitest.config.ts tests/endpoints/tabora-sync.test.ts
```

预期：全部 FAIL（路由未注册）。

```bash
git add backend/directus/tests/endpoints/tabora-sync.test.ts
git commit -m "test(directus): sync 端点 pull/push RED 契约测试"
```

---

### 任务 4：实现 sync 路由模块（GREEN）

**文件：**

- 创建：`backend/directus/extensions/directus-extension-tabora/src/sync.ts`
- 修改：`backend/directus/extensions/directus-extension-tabora/src/index.ts`（注册 `registerSyncEndpoints`）
- 修改（如需）：`src/types.ts`（新增 SyncedRecordRow 类型）

- [ ] **步骤 1：Zod schema 与类型**

```ts
const RECORD_TYPES = ["note", "workspace_settings", "plugin_data"] as const
const MAX_PUSH_BATCH = 100
const MAX_PULL_LIMIT = 1000

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

const pullQuerySchema = z.object({
  since: z.string().datetime().optional(),
  types: z
    .string()
    .transform((value) => value.split(","))
    .pipe(z.array(z.enum(RECORD_TYPES)))
    .optional(),
})
```

- [ ] **步骤 2：pull handler**

`GET /sync/records`：requireUserId → parse query → Knex 查询 `synced_records` where `user_id`，可选 `record_updated_at > since` 与 `record_type in types`，orderBy `record_updated_at` asc，limit MAX_PULL_LIMIT → 映射响应（deleted ? data:null）→ `response.json({ data: { records, server_time: new Date().toISOString() } })`。

注意 test-kit 内存 database 支持的查询形态（select/where/orderBy/first/insert/update），实现要与 kit 兼容——不用 `whereIn`/`where('a','>',b)` 之外 kit 不支持的 API 时，先读 `tabora-test-kit.ts` 确认支持面；不支持的操作（如范围比较、in 查询）在应用层过滤：先按 user_id 取全部再在 JS 里过滤 since/types。**优先保证正确性与测试兼容，数据量优化留给真实索引。**

- [ ] **步骤 3：push handler**

`POST /sync/records`：requireUserId → parseBody(pushBodySchema) → 在 `context.database.transaction` 中逐条处理：

1. `findSensitiveFieldPath(record.data)` 非 null → rejected.push({ id, reason: `sensitive field: ${path}` })，continue。
2. 查现有行（user_id + record_type + record_id，`forUpdate()` 行锁）。
3. 冲突判定：存在行且（record.version !== null 且 record.version !== row.version）或 `new Date(record.client_timestamp) <= new Date(row.record_updated_at)` → conflicts.push({...server 字段})。
4. 否则 upsert：version = (row?.version ?? 0) + 1，record_updated_at = now，deleted，data = record.deleted ? null : record.data，device_id → accepted.push(id)。

响应 `{ data: { accepted, conflicts, rejected, server_time } }`。

- [ ] **步骤 4：注册路由**

`src/index.ts` 增加 `registerSyncEndpoints(router, context)`（与现有 auth/sessions/attachments 并列）。

- [ ] **步骤 5：运行任务 3 测试确认 GREEN**

```bash
cd /home/kebai/桌面/tabora/backend/directus
../../node_modules/.bin/vitest run --config vitest.config.ts tests/endpoints/tabora-sync.test.ts
```

预期：15 用例全 PASS。若个别用例因 test-kit 查询能力受限失败，修实现或按 kit 现有模式（参考 attachments 测试的数据库用法）调整查询写法，不放宽断言。

- [ ] **步骤 6：全部后端测试回归 + commit**

```bash
../../node_modules/.bin/vitest run --config vitest.config.ts
git add backend/directus/extensions/directus-extension-tabora/src/sync.ts backend/directus/extensions/directus-extension-tabora/src/index.ts backend/directus/extensions/directus-extension-tabora/src/types.ts
git commit -m "feat(directus): 实现 /sync/records pull/push 同步网关端点"
```

---

### 任务 5：扩展构建验证与文档

**文件：**

- 修改：`backend/directus/README.md`（端点列表补 sync）
- 修改：`backend/directus/extensions/directus-extension-tabora/README.md`（如存在端点清单）
- 修改：`docs/README.md`（阶段性实施记录登记本计划）

- [ ] **步骤 1：扩展 typecheck + build + validate**

```bash
cd /home/kebai/桌面/tabora/backend/directus/extensions/directus-extension-tabora
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/directus-extension build
./node_modules/.bin/directus-extension validate
```

预期：全部通过。

- [ ] **步骤 2：文档更新**

- `backend/directus/README.md` 目录结构注释加 `sync.ts    # 数据同步 pull/push`；
- `docs/README.md` 阶段性实施记录加 S2 spec 与本 plan 两行；
- 说明 LWW/tombstone/敏感过滤边界一句话即可，细节链接 spec。

- [ ] **步骤 3：仓库级验证**

```bash
cd /home/kebai/桌面/tabora
pnpm test
pnpm check
```

预期：pnpm test 通过；pnpm check 若因预存的 docs/design/notes-prototype-\*.html 未跟踪文件格式问题失败，记录为无关基线问题（S1 已知），本次改动文件需干净。

- [ ] **步骤 4：commit 文档**

```bash
git add backend/directus/README.md docs/README.md
git commit -m "docs(directus): 登记 S2 同步网关实现与端点说明"
```

- [ ] **步骤 5：最终 diff 审查**

规格审查（对照 S2 spec 验收标准第 8 节）+ 代码质量审查，解决 critical/important 后报告完成。**权限配置（Directus Admin 的 role filter）与真实 Postgres 集成测试属于部署侧，S2 代码交付不含**——在 final 汇报中明确说明这两项为部署时人工步骤。
