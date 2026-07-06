# Tabora 数据同步 S2：Edge Function 同步网关设计

日期：2026-07-06

状态：设计稿（brainstorming 产出，待 writing-plans）

关联文档：

- S1-S6 路线图：`docs/superpowers/specs/2026-07-06-data-sync-backend-roadmap-design.md`
- 技术方案：`docs/technical/tabora-data-sync-technical-design.md`（§5 Edge Function gateway）
- PRD：`docs/technical/mpz35mfq-16-data-sync-prd.md`

## 0. 本文档定位

S2 是数据同步后端的**安全边界落地点**：客户端只经网关访问云端，插件永远拿不到 service_role 或用户 access token，敏感字段在服务端过滤。S2 交付单一 Edge Function `sync-gateway`，按 action 分发 8 个同步操作，用真实 HTTP 集成测试验证。

依赖 S1（迁移文件已落地）。S3-S6 等 S2 验证通过后再启动。

## 1. 架构概览

### 单一 Edge Function 按 action 派发

```
客户端 (@tabora/sync，S5 交付)
  ↓ HTTPS POST /functions/v1/sync-gateway
  ↓ Authorization: Bearer <user_access_token>
  ↓ Body: {action: '...', ...params}
Edge Function (Deno runtime，Supabase 托管)
  ├─ 解析 JWT → accountId = auth.uid()
  ├─ 用 service_role client 访问 Postgres（绕过 RLS）
  ├─ switch (action):
  │   ├─ register-device → 注册/更新设备记录
  │   ├─ push           → 敏感过滤 + LWW 合并 + 写 synced_records
  │   ├─ pull           → 增量拉取（cursor = server_updated_at）
  │   ├─ snapshot       → 写 sync_snapshots
  │   ├─ list-devices   → 查 sync_devices
  │   ├─ remove-device  → 标记 status='removed'
  │   ├─ list-conflicts → 查 sync_conflicts
  │   └─ resolve-conflict → 更新 conflict status
  └─ 返回 {ok: true/false, data?, error?}
```

### 关键约束

- **单文件组织**：`supabase/functions/sync-gateway/index.ts`，switch-case 派发到 8 个内联 handler 函数，总计 ~1000 行。不拆多文件（贴合 Edge Function 天然边界，避免模块解析坑）。
- **service_role 密钥隔离**：只存在于 Edge Function 环境变量（Supabase Dashboard「Settings → Edge Functions → Secrets」配），绝不进客户端 bundle。
- **RLS 纵深防御**：所有表开启 RLS（S1 已落地），但网关用 service_role 绕过（必须，否则无法代用户写入）。若未来出现直连路径，RLS 仍生效。
- **权威时间戳**：客户端传 `clientUpdatedAt`，网关写入时覆盖为 `server_updated_at = now()`，避免客户端伪造时间。

## 2. 数据流与安全边界

### Push 流程（核心安全点）

```
客户端 → {
  action: 'push',
  changes: [{
    scope: 'core' | 'plugin',
    entityType: string,
    recordKey: string,
    payload: Record<string, any>,
    clientUpdatedAt: string,  // ISO8601
    deleted?: boolean
  }]
}
  ↓
网关校验 JWT → accountId = auth.uid()
  ↓
for each change:
  1. 敏感字段过滤（filterSensitiveFields）
     - 拒绝任何 key 包含 'apiKey' / 'token' / 'password' / 'secret' / 'filePath' 的字段（不区分大小写）
     - 若 scope='plugin'，还需查插件 manifest 的 sync.collections[].excludeFields，剔除声明排除的字段
     - 返回错误 code: 'SENSITIVE_FIELD_REJECTED' 如果检测到违规字段

  2. 危险声明拦截
     - 若 scope='plugin' 且插件 manifest 未声明该 entityType 在 sync.collections 中，拒绝
     - 返回错误 code: 'ENTITY_NOT_SYNCABLE'

  3. 查云端当前记录
     SELECT * FROM synced_records
     WHERE account_id = $accountId
       AND scope = $scope
       AND entity_type = $entityType
       AND record_key = $recordKey

  4. Last-Write-Wins 合并
     - 若云端不存在 或 clientUpdatedAt > 云端 updated_at：写入/覆盖
     - 否则：客户端版本旧，跳过（客户端下次 pull 会拿到云端新版本）
     - V1 只做整记录 LWW，不做字段级 record-merge

  5. 写入/更新
     INSERT INTO synced_records (
       account_id, scope, entity_type, record_key,
       payload,  -- 已过滤
       updated_at,  -- now()，权威时间戳
       deleted_at,  -- change.deleted ? now() : null
       last_writer_device_id,  -- 请求头或参数传入
       server_updated_at  -- now()
     )
     ON CONFLICT (account_id, scope, entity_type, record_key)
     DO UPDATE SET ...
  ↓
返回 {ok: true, pushedCount: number, skippedCount: number}
```

### Pull 流程（增量高效）

```
客户端 → {
  action: 'pull',
  cursor?: string  // ISO8601 timestamptz，上次 pull 的 max(server_updated_at)
}
  ↓
SELECT * FROM synced_records
WHERE account_id = $accountId
  AND server_updated_at > $cursor  -- 无 cursor 时视为 '1970-01-01'
ORDER BY server_updated_at ASC
LIMIT 500  -- 分页，避免单次过大
  ↓
返回 {
  ok: true,
  records: [{scope, entityType, recordKey, payload, updatedAt, deletedAt, lastWriterDeviceId}],
  newCursor: string  -- max(records[].serverUpdatedAt)，客户端下次 pull 用
}
```

### service_role 使用边界

- Edge Function 用 `createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)` 创建 admin client。
- `SUPABASE_SERVICE_ROLE_KEY` 只在 Supabase Dashboard「Settings → Edge Functions → Secrets」配置，Edge Function 运行时从 `Deno.env.get()` 读取。
- 客户端（extension / playground）bundle 里绝不出现 service_role，只持有 `anon` key（现代称 publishable key，公开安全）+ 用户自己的 access token。
- 客户端调网关时传 `Authorization: Bearer <user_access_token>`，网关用 `supabase.auth.getUser(token)` 解析出 `user.id` 作为 `accountId`。

## 3. Actions 契约

### 统一请求/响应格式

**请求体**

```typescript
{
  action: 'register-device' | 'push' | 'pull' | 'snapshot' |
          'list-devices' | 'remove-device' | 'list-conflicts' | 'resolve-conflict',
  ...actionParams  // 各 action 特定参数
}
```

**响应体（成功）**

```typescript
{ ok: true, data: {...} }
```

**响应体（失败）**

```typescript
{
  ok: false,
  error: {
    code: 'AUTH_FAILED' | 'DEVICE_REMOVED' | 'INVALID_PAYLOAD' |
          'SENSITIVE_FIELD_REJECTED' | 'ENTITY_NOT_SYNCABLE' | 'DB_ERROR' |
          'UNKNOWN_ACTION',
    message: string  // 人类可读错误描述
  }
}
```

**客户端（S5）重试策略**

- `AUTH_FAILED`：不重试，触发重新登录流程。
- `DEVICE_REMOVED`：不重试，提示设备已被移除。
- `INVALID_PAYLOAD` / `SENSITIVE_FIELD_REJECTED` / `ENTITY_NOT_SYNCABLE`：不重试，本地数据问题，记录日志。
- `DB_ERROR` / `UNKNOWN_ACTION`：指数退避重试（1s / 2s / 4s），最多 3 次。
- 网络错误（fetch 失败、timeout）：指数退避重试，最多 5 次。

### 8 个 Actions 详细契约

#### 1. register-device

```typescript
// 请求
{
  action: 'register-device',
  deviceId: string,  // 客户端生成（UUID）
  name: string,      // 设备名称（浏览器 UA / 设备型号）
  type: 'macos' | 'windows' | 'ios' | 'android' | 'browser'
}

// 响应
{ ok: true, data: { device: {...} } }

// 行为：upsert sync_devices，更新 last_sync_at = now()
```

#### 2. push

```typescript
// 请求
{
  action: 'push',
  changes: [{
    scope: 'core' | 'plugin',
    entityType: string,
    recordKey: string,
    payload: Record<string, any>,
    clientUpdatedAt: string,  // ISO8601
    deleted?: boolean
  }]
}

// 响应
{ ok: true, data: { pushedCount: number, skippedCount: number } }

// 行为：见 §2 Push 流程
```

#### 3. pull

```typescript
// 请求
{
  action: 'pull',
  cursor?: string  // ISO8601 timestamptz，不传则从头拉
}

// 响应
{
  ok: true,
  data: {
    records: [{
      scope: string,
      entityType: string,
      recordKey: string,
      payload: Record<string, any>,
      updatedAt: string,      // ISO8601
      deletedAt: string | null,
      lastWriterDeviceId: string
    }],
    newCursor: string  // 下次 pull 用
  }
}

// 行为：见 §2 Pull 流程
```

#### 4. snapshot

```typescript
// 请求
{
  action: 'snapshot',
  reason: 'first-sync' | 'bulk-merge' | 'conflict-batch' | 'manual',
  payload: Record<string, any>  // 快照内容（core 结构 + 实例配置 + 可同步插件数据）
}

// 响应
{ ok: true, data: { snapshotId: string } }

// 行为：INSERT INTO sync_snapshots
```

#### 5. list-devices

```typescript
// 请求
{ action: 'list-devices' }

// 响应
{
  ok: true,
  data: {
    devices: [{
      deviceId: string,
      name: string,
      type: string,
      firstLoginAt: string,
      lastSyncAt: string | null,
      status: 'current' | 'online' | 'offline' | 'removed'
    }]
  }
}

// 行为：SELECT * FROM sync_devices WHERE account_id = $accountId
```

#### 6. remove-device

```typescript
// 请求
{
  action: 'remove-device',
  deviceId: string
}

// 响应
{ ok: true }

// 行为：UPDATE sync_devices SET status = 'removed' WHERE device_id = $deviceId AND account_id = $accountId
```

#### 7. list-conflicts

```typescript
// 请求
{
  action: 'list-conflicts',
  status?: 'open' | 'resolved' | 'ignored',  // 不传则只返回 'open'
  limit?: number  // 默认 50
}

// 响应
{
  ok: true,
  data: {
    conflicts: [{
      conflictId: string,
      scope: string,
      entityType: string,
      recordKey: string,
      localDeviceId: string,
      remoteDeviceId: string,
      localSummary: string,
      remoteSummary: string,
      localPayload: Record<string, any>,
      remotePayload: Record<string, any>,
      status: string,
      createdAt: string
    }]
  }
}

// 行为：SELECT * FROM sync_conflicts WHERE account_id = $accountId AND status = $status LIMIT $limit
```

#### 8. resolve-conflict

```typescript
// 请求
{
  action: 'resolve-conflict',
  conflictId: string,
  resolution: 'local' | 'remote'  // 保留哪个版本
}

// 响应
{ ok: true }

// 行为：
// 1. 从 sync_conflicts 读取 conflict
// 2. 根据 resolution 选择 localPayload 或 remotePayload
// 3. 写入 synced_records（覆盖当前版本）
// 4. UPDATE sync_conflicts SET status = 'resolved', resolved_at = now()
```

## 4. 部署与验证

### 部署流程

```bash
# Step 1: 创建 Edge Function 文件
supabase/functions/sync-gateway/index.ts  # ~1000 行，单文件全部逻辑

# Step 2: 在 Supabase Dashboard 配置环境变量
# Settings → Edge Functions → Secrets:
#   SUPABASE_SERVICE_ROLE_KEY=<从 Settings → API 复制>

# Step 3: 部署（不需要 Docker，走 Supabase API）
supabase functions deploy sync-gateway --no-verify-jwt

# --no-verify-jwt 原因：网关自己解析 JWT 拿 auth.uid()，
# 不需要 Supabase 平台在网关前再验证一次（避免双重验证）
```

### 验证策略：集成测试脚本

写 `scripts/test-sync-gateway.ts`（Node/TS），用 `supabase-js` 或 Supabase MCP 调真实网关 + 真实 DB：

```typescript
// 1. 用测试账号 Email OTP 登录，拿 access_token
// 2. 调 register-device，验证返回 {ok: true}
// 3. 调 push 上传一条 core 记录（workspace），验证 pushedCount=1
// 4. 调 pull，验证能拉回刚才 push 的记录
// 5. 调 push 上传含敏感字段的 payload（apiKey: 'xxx'），验证被拒绝 SENSITIVE_FIELD_REJECTED
// 6. 调 push 上传未声明可同步的 plugin entityType，验证被拒绝 ENTITY_NOT_SYNCABLE
// 7. 调 list-devices / snapshot / list-conflicts 验证返回格式正确
// 8. 清理测试数据（DELETE FROM synced_records / sync_devices WHERE account_id = test_user_id）
```

运行：`tsx scripts/test-sync-gateway.ts`，全绿色输出则网关工作正常。

验证覆盖：

- 成功路径：register / push / pull / snapshot / list 都返回正确数据。
- 安全边界：敏感字段被拒绝、未声明 entityType 被拒绝。
- 合并逻辑：push 旧版本被跳过（skippedCount > 0）。
- 增量 pull：cursor 正确传递，不重复拉取。

### 非目标（S2 不做）

- Deno 单元测试（mock Supabase client）——V1 只做集成测试，单测可后补。
- 客户端 `@tabora/sync` 包——那是 S5。
- storage 增强（syncQueue / syncMeta）——那是 S3。
- auth 会话层——那是 S4。
- UI 面板（账号、数据同步页）——明确不在本轮。

## 5. 边界与依赖

**依赖**

- S1：迁移文件已落地，5 表 + RLS 已在远端。
- Supabase CLI 2.109.0+：`supabase functions deploy` 命令。
- 已 link 到 tabora 项目（S1 已完成）。

**产物**

- `supabase/functions/sync-gateway/index.ts`：Edge Function 入口，~1000 行。
- `scripts/test-sync-gateway.ts`：集成测试脚本，验证 8 个 actions。
- Supabase Dashboard「Functions」页面显示 `sync-gateway` 部署成功，状态 ACTIVE。

**阻塞 S3-S6**

S2 验证通过（集成测试脚本全绿）后，S3/S4 可以并行启动；S5 依赖 S2+S3+S4；S6 依赖 S5。
