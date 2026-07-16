# S2 Directus 数据同步网关设计规格

> **子项目定位**：S1 完成前端登录注册接入，S2 实现 Directus 后端的数据同步网关 API，S3 将前端同步客户端从 Supabase 迁移到 Directus。

**目标**：在 Directus 后端实现跨设备数据同步的 REST API，支持笔记、工作区设置、插件数据的增量 pull/push，采用状态同步 + LWW（Last-Write-Wins）冲突策略 + tombstone 删除标记。

---

## 1. 同步模型

### 1.1 状态同步（State-based Sync）

客户端推送整个实体的当前状态（非增量操作），服务端存储每个实体的最新版本。优势：

- 实现简单，无需事件溯源或 CRDT
- 客户端无需维护操作历史
- 适合笔记/设置类数据（更新频率低，单次变更较大）

劣势：每次 push 需传输完整实体，网络开销较大（可通过 gzip 缓解）。

### 1.2 LWW 冲突策略

- 每条记录带 `updated_at` 时间戳（服务端生成）
- push 时客户端带 `client_timestamp`（客户端本地时间）
- 服务端比较：`client_timestamp > server.updated_at` 则接受，否则返回冲突
- 客户端收到冲突后，比较本地修改时间 vs 服务端时间，采用较新者（或提示用户）

### 1.3 Tombstone 删除

- 删除操作不物理删除记录，而是标记 `deleted: true`
- tombstone 保留 30 天（定期清理任务），确保各设备有足够时间同步删除
- pull 时返回包含删除标记的记录，客户端据此删除本地副本

---

## 2. 数据模型

### 2.1 Directus Collection: `sync_records`

```typescript
{
  id: string // uuid, PK
  user_id: string // FK to directus_users, indexed
  device_id: string // 标识最后写入的设备（客户端生成的 UUID）
  record_type: string // "note" | "workspace_settings" | "plugin_data"
  record_id: string // 业务层实体 ID（客户端生成）
  data: object // JSON，实体完整内容
  version: number // 乐观锁版本号，每次更新 +1
  updated_at: timestamp // 服务端写入时间
  deleted: boolean // tombstone 标记

  // 唯一索引：(user_id, record_type, record_id)
  // 索引：user_id, updated_at（加速 pull 查询）
}
```

**record_type 枚举**：

- `"note"` — 笔记实体，`data` 结构见前端 `Note` 类型
- `"workspace_settings"` — 工作区设置（主题、布局、插件配置等）
- `"plugin_data"` — 插件持久化数据（键值对）

### 2.2 Directus Permissions

- 所有 `sync_records` 操作需认证（Bearer token，复用 S1 的 `/auth/*`）
- 用户只能访问 `user_id = $CURRENT_USER` 的记录（Directus filter rule）
- 读写权限：authenticated users 可 CRUD 自己的 sync_records

---

## 3. API 端点

### 3.1 Pull（增量拉取）

**请求**：

```http
GET /tabora/sync/records?since=2026-07-16T04:30:00.000Z&types=note,workspace_settings
Authorization: Bearer <access_token>
```

**查询参数**：

- `since`（可选）：ISO 8601 时间戳，返回 `updated_at > since` 的记录；不传则返回全部
- `types`（可选）：逗号分隔的 `record_type` 列表，不传则返回所有类型

**响应**（200）：

```json
{
  "records": [
    {
      "type": "note",
      "id": "note-abc123",
      "data": { "title": "会议记录", "content": "...", "tags": ["work"] },
      "version": 5,
      "updated_at": "2026-07-16T05:00:00.000Z",
      "deleted": false,
      "device_id": "device-xyz"
    },
    {
      "type": "note",
      "id": "note-def456",
      "data": null,
      "version": 3,
      "updated_at": "2026-07-16T04:45:00.000Z",
      "deleted": true,
      "device_id": "device-xyz"
    }
  ],
  "server_time": "2026-07-16T05:10:00.000Z"
}
```

**说明**：

- `server_time` 用于客户端下次 pull 的 `since` 参数
- 删除记录的 `data` 为 `null`
- 按 `updated_at` 升序返回（客户端按序应用）

### 3.2 Push（推送变更）

**请求**：

```http
POST /tabora/sync/records
Authorization: Bearer <access_token>
Content-Type: application/json

[
  {
    "type": "note",
    "id": "note-abc123",
    "data": { "title": "会议记录（已编辑）", "content": "...", "tags": ["work"] },
    "version": 5,
    "client_timestamp": "2026-07-16T05:05:00.000Z",
    "device_id": "device-xyz",
    "deleted": false
  },
  {
    "type": "workspace_settings",
    "id": "workspace-main",
    "data": { "theme": "dark", "layout": "grid" },
    "version": null,
    "client_timestamp": "2026-07-16T05:06:00.000Z",
    "device_id": "device-xyz",
    "deleted": false
  }
]
```

**请求体**：

- `type` / `id` / `data` / `deleted` — 实体信息
- `version`（可选）：客户端已知的服务端版本，用于冲突检测；首次 push 传 `null`
- `client_timestamp` — 客户端的修改时间（ISO 8601）
- `device_id` — 客户端设备 UUID

**响应**（200）：

```json
{
  "accepted": ["note-abc123", "workspace-main"],
  "conflicts": [],
  "server_time": "2026-07-16T05:10:00.000Z"
}
```

**响应（部分冲突，200）**：

```json
{
  "accepted": ["workspace-main"],
  "conflicts": [
    {
      "type": "note",
      "id": "note-abc123",
      "server_version": 6,
      "server_data": { "title": "会议记录（他人编辑）", "content": "...", "tags": ["work"] },
      "server_updated_at": "2026-07-16T05:08:00.000Z",
      "server_device_id": "device-abc"
    }
  ],
  "server_time": "2026-07-16T05:10:00.000Z"
}
```

**冲突判定规则**：

- 如果客户端传了 `version` 且不等于服务端当前 `version`，返回冲突
- 如果 `client_timestamp <= server.updated_at`（服务端更新更晚），返回冲突
- 否则接受 push，服务端更新记录并递增 `version`

**响应（认证失败，401）**：

```json
{
  "errors": [{ "message": "Invalid token", "extensions": { "code": "INVALID_CREDENTIALS" } }]
}
```

---

## 4. 实现路径

### 4.1 Directus Extension（已有 `directus-extension-tabora`）

在现有扩展基础上新增两个端点：

- `GET /tabora/sync/records` — pull handler
- `POST /tabora/sync/records` — push handler

### 4.2 Collection Schema

通过 Directus schema snapshot 定义 `sync_records` collection（或直接在 extension 里用 Knex migration）。

### 4.3 权限配置

在 Directus Admin UI 或通过 API 配置：

- Role: `Authenticated Users`
- Collection: `sync_records`
- Permissions: CRUD
- Filter: `user_id = $CURRENT_USER`

### 4.4 测试策略

- 单元测试：mock Knex，测试 pull/push 逻辑（冲突检测、LWW、tombstone 过滤）
- 集成测试：启动 Directus + Postgres，调用真实端点验证完整流程
- 边界测试：并发 push 同一记录、过期 token、跨用户隔离

---

## 5. 非功能需求

### 5.1 性能

- pull 查询加索引：`(user_id, updated_at)`，支持高效范围查询
- push 批量写入用事务，确保原子性
- 单次 pull 限制返回 1000 条（分页），避免超大响应

### 5.2 安全

- 所有端点需 Bearer token 认证
- `user_id` 从 token 解析，禁止客户端传递（防伪造）
- SQL 注入防护：使用 Knex 参数化查询
- Rate limit：每用户每分钟最多 60 次 pull、30 次 push（Directus 内置或 Nginx）

### 5.3 可观测

- 日志：记录每次 pull/push 的 `user_id`、记录数、耗时
- 指标：同步延迟（客户端 pull 间隔）、冲突率（conflicts / total pushes）
- 错误追踪：集成 Sentry 或类似服务

---

## 6. S2 与 S3 边界

**S2（本阶段）**：

- Directus 后端实现 `/tabora/sync/records` GET/POST
- 定义 `sync_records` collection schema
- 编写端点单元测试与集成测试
- 配置 Directus permissions

**S3（下一阶段）**：

- 前端 `@tabora/sync` 包实现 `createDirectusSyncGateway`（替换 Supabase）
- 前端 workbench-app 集成新 gateway
- 前端测试验证跨设备同步（两个浏览器 tab 模拟）

---

## 7. 遗留问题（S2 不处理）

- **实时推送**：当前采用轮询，WebSocket/SSE 推送可在 S4 增强
- **大文件附件**：笔记附件（图片/视频）暂不纳入 sync_records，使用独立的 Directus Files API（已在 S1 前的 Directus extension 实现 `/tabora/attachments`）
- **离线编辑合并**：当前 LWW 会丢失并发编辑，3-way merge 或 CRDT 可在后续迭代
- **tombstone 清理**：30 天过期的 tombstone 自动删除（需 cron job），S2 暂不实现，可手动清理或 S5 补充

---

## 8. 验收标准

S2 完成的标志：

- ✅ `sync_records` collection 在 Directus 中创建且有正确索引
- ✅ `GET /tabora/sync/records` 返回用户的增量记录，支持 `since` 和 `types` 过滤
- ✅ `POST /tabora/sync/records` 接受 push 并返回 `accepted` / `conflicts`
- ✅ 冲突检测：version 不匹配或 client_timestamp 过时时返回冲突
- ✅ Tombstone：删除的记录标记 `deleted: true` 且在 pull 中返回
- ✅ 权限隔离：用户 A 无法读取用户 B 的记录
- ✅ 单元测试覆盖 pull/push 核心逻辑（80%+ 覆盖率）
- ✅ 集成测试验证完整流程（push → pull → 冲突 → 删除）

---

## 附录 A：前端 `Note` 类型示例

```typescript
type Note = {
  id: string // 客户端生成 UUID
  title: string
  content: string // Markdown 或纯文本
  tags: string[]
  created_at: string // ISO 8601
  updated_at: string
  deleted?: boolean // 客户端本地删除标记
}
```

同步时 `data` 字段即为完整 `Note` 对象（除 `id` 外，`id` 放在 `sync_records.record_id`）。

---

## 附录 B：Directus Extension Endpoint 实现骨架

```typescript
import { defineEndpoint } from "@directus/extensions-sdk"

export default defineEndpoint({
  id: "sync-records",
  handler: (router, { services, getSchema }) => {
    const { ItemsService } = services

    router.get("/", async (req, res, next) => {
      try {
        const schema = await getSchema()
        const service = new ItemsService("sync_records", {
          schema,
          accountability: req.accountability,
        })

        const { since, types } = req.query
        const filter: any = {}
        if (since) filter.updated_at = { _gt: since }
        if (types) filter.record_type = { _in: types.split(",") }

        const records = await service.readByQuery({ filter, sort: ["updated_at"] })

        res.json({
          records: records.map((r) => ({
            type: r.record_type,
            id: r.record_id,
            data: r.deleted ? null : r.data,
            version: r.version,
            updated_at: r.updated_at,
            deleted: r.deleted,
            device_id: r.device_id,
          })),
          server_time: new Date().toISOString(),
        })
      } catch (error) {
        next(error)
      }
    })

    router.post("/", async (req, res, next) => {
      try {
        const schema = await getSchema()
        const service = new ItemsService("sync_records", {
          schema,
          accountability: req.accountability,
        })
        const userId = req.accountability?.user
        if (!userId) return res.status(401).json({ errors: [{ message: "Unauthorized" }] })

        const pushRecords = req.body as Array<{
          type: string
          id: string
          data: any
          version: number | null
          client_timestamp: string
          device_id: string
          deleted: boolean
        }>

        const accepted: string[] = []
        const conflicts: any[] = []

        for (const record of pushRecords) {
          const existing = await service.readByQuery({
            filter: {
              user_id: { _eq: userId },
              record_type: { _eq: record.type },
              record_id: { _eq: record.id },
            },
            limit: 1,
          })

          const serverRecord = existing[0]
          const hasConflict =
            serverRecord &&
            ((record.version !== null && record.version !== serverRecord.version) ||
              new Date(record.client_timestamp) <= new Date(serverRecord.updated_at))

          if (hasConflict) {
            conflicts.push({
              type: record.type,
              id: record.id,
              server_version: serverRecord.version,
              server_data: serverRecord.data,
              server_updated_at: serverRecord.updated_at,
              server_device_id: serverRecord.device_id,
            })
          } else {
            const payload = {
              user_id: userId,
              device_id: record.device_id,
              record_type: record.type,
              record_id: record.id,
              data: record.data,
              version: (serverRecord?.version || 0) + 1,
              updated_at: new Date().toISOString(),
              deleted: record.deleted,
            }
            if (serverRecord) {
              await service.updateOne(serverRecord.id, payload)
            } else {
              await service.createOne(payload)
            }
            accepted.push(record.id)
          }
        }

        res.json({
          accepted,
          conflicts,
          server_time: new Date().toISOString(),
        })
      } catch (error) {
        next(error)
      }
    })
  },
})
```

（骨架仅供参考，实际实现需补充错误处理、事务、类型安全等）
