# Tabora 官方账号数据同步技术方案

版本：V0.1

日期：2026-07-06

状态：技术设计稿（对齐数据同步 PRD V0.2 已锁定决策）

关联文档：

- 需求与决策事实源：`docs/technical/mpz35mfq-16-data-sync-prd.md`
- 平台技术方案 V2：`docs/technical/tabora-plugin-workbench-technical-design-v2.md`
- 回归治理：`docs/technical/tabora-regression-baseline.md`

## 0. 本文档定位

本文档是数据同步的**实现事实源**。PRD 负责需求、范围与产品决策；本文档负责 Supabase 后端形态、数据模型、API 契约、客户端同步引擎和包边界。

PRD §3.1 已锁定三条核心决策，本方案以此为前提，不再重复论证：

1. 云端事实源为 **state-based 当前态**（每行一条记录 + `updatedAt` + tombstone 软删除）。
2. 客户端只经 **Supabase Edge Function 同步网关**读写，不直连数据表。
3. 加密语义为**平台级加密 + 敏感字段永不上传**，非 E2EE。

## 1. 后端总体形态

```txt
┌─────────────────────────────────────────────┐
│ 客户端（extension newtab / playground / 未来 desktop） │
│                                               │
│  @tabora/sync (core 同步引擎)                  │
│    - 本地变更监听（Dexie hooks）               │
│    - 待上传队列（SyncChange，本地内部结构）     │
│    - push / pull / merge                       │
│    - 冲突检测与冲突收件箱模型                   │
│    - 快照触发                                   │
│    - 会话持有（supabase-js + 自定义 storage）   │
└───────────────┬───────────────────────────────┘
                │ 仅经网关，HTTPS
                │ Authorization: Bearer <access_token>
                ▼
┌─────────────────────────────────────────────┐
│ Supabase Edge Function: sync-gateway          │
│  （唯一同步端点，Deno runtime）                │
│    - 校验 JWT，解析 auth.uid()                 │
│    - 敏感字段过滤 + 危险声明拒绝               │
│    - state-based 合并 / 冲突检测              │
│    - 快照触发                                   │
│    - 用 service_role 访问 Postgres            │
└───────────────┬───────────────────────────────┘
                │ service_role（仅存在于网关运行时）
                ▼
┌─────────────────────────────────────────────┐
│ Supabase Postgres                             │
│    - auth.users（Supabase Auth 托管）          │
│    - public.profiles                           │
│    - public.sync_devices                       │
│    - public.synced_records                     │
│    - public.sync_snapshots                     │
│    - public.sync_conflicts                     │
│  全表开启 RLS（纵深防御）                       │
│                                               │
│ Supabase Auth（Email OTP）                     │
└─────────────────────────────────────────────┘
```

关键边界：

- **插件永远拿不到 supabase client、access token 或网关 URL。** 插件只经 core runtime 的 storage repository 读写本地数据，同步由 core 在后台完成。
- **service_role 只存在于 Edge Function 运行时环境变量**，绝不进入扩展包、前端 bundle 或任何插件。
- 客户端持有的是 Supabase **publishable key**（`anon` 的现代替代）+ 用户 access token，只用于调用 Auth 和网关，不用于直连表。

## 2. Supabase 项目与 Auth 配置

### 2.1 项目

- 一个 Supabase 项目承载 Auth + Postgres + Edge Functions。
- Data API 依赖：本方案客户端不使用 Data (REST/GraphQL) API，同步表不需要向 `anon` / `authenticated` 暴露。2026-04-28 起新表默认不暴露 Data API，与本方案安全预期一致，无需额外收敛。

### 2.2 Email OTP

V1 用邮箱验证码，对应 Supabase 无密码登录的 OTP 形态：

```ts
// 发送验证码（注册与登录共用；shouldCreateUser 控制是否允许新建）
await supabase.auth.signInWithOtp({
  email,
  options: { shouldCreateUser: true },
})

// 校验 6 位验证码
const { data, error } = await supabase.auth.verifyOtp({
  email,
  token, // 用户输入的 6 位码
  type: "email",
})
```

必须的配置项：

- **邮件模板改为发送验证码而非 magic link**：默认模板发的是 `{{ .ConfirmationURL }}`（magic link）。要发 6 位码，模板必须使用 `{{ .Token }}`。这是能否走"验证码"体验的硬前提。
- **生产必须接自建 SMTP**（SES / Resend / Postmark 等）：Supabase 内置邮件服务有严格发信限流，且 2026-06-03 起免费层邮件模板定制受限。仅用于开发联调可暂用内置。
- **注册 vs 登录的区分**：`shouldCreateUser: true` 时邮箱不存在会新建账号，存在则登录。UI 需按 PRD §6.1 让用户明确当前是创建还是登录；后端不额外区分。
- 会话有效期与刷新：使用 Supabase 默认 access token + refresh token 自动续期；`AuthSession`（PRD §17）中的 `sessionId` 对应 Supabase session，不自建。

### 2.3 账号身份映射

- PRD 的 `SyncAccount.accountId` **直接等于 `auth.users.id`**，不自建账号 id 体系。
- `displayName`、协议确认时间等 profile 字段放独立 `public.profiles` 表，**不写入 `raw_user_meta_data`**（用户可改，不可用于任何授权判断）。

## 3. 数据库 Schema

> **落地状态（2026-07-06）**：本节 5 表 + RLS 已在远端 tabora 项目（`ajetfjtfterbkczrbjlq`）验证通过 security/performance advisors，并落成迁移文件 `supabase/migrations/20260706092225_create_sync_schema.sql`（手写，已与远端 MCP 跨核对一致）。后续结构变更走 `execute_sql` 迭代 + `migration new` 追加迁移。

所有业务表放 `public` schema 并开启 RLS。字段用 `snake_case`（Postgres 惯例），客户端/网关边界处映射为 camelCase。

### 3.1 profiles

```sql
create table public.profiles (
  account_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  terms_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### 3.2 sync_devices

对应 PRD §11。设备"移除"是撤销后续同步资格，用 `status` 表达，不物理删除。

```sql
create table public.sync_devices (
  device_id text not null,
  account_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type text not null check (type in ('macos','windows','ios','android','browser')),
  first_login_at timestamptz not null default now(),
  last_sync_at timestamptz,
  status text not null default 'online'
    check (status in ('current','online','offline','removed')),
  primary key (account_id, device_id)
);
```

网关在每次同步请求中校验设备 `status != 'removed'`，被移除设备的同步请求被拒绝，直到重新注册。

### 3.3 synced_records（云端事实源核心表）

state-based 当前态：每个可同步实体一行，按 `updated_at` 合并，删除走 tombstone。

```sql
create table public.synced_records (
  account_id uuid not null references auth.users (id) on delete cascade,
  scope text not null check (scope in ('core','plugin')),
  entity_type text not null,          -- 'workspace' | 'group' | 'pluginInstance' | 'todo.tasks' 等
  record_key text not null,           -- 插件声明的稳定 recordKey，或 core 对象 ID
  payload jsonb not null,             -- 已过滤敏感字段后的记录体
  updated_at timestamptz not null,    -- 合并比较基准（权威时间戳，见 §6.4）
  deleted_at timestamptz,             -- 非空即 tombstone
  schema_version integer not null default 1,
  last_writer_device_id text not null,
  server_updated_at timestamptz not null default now(),
  primary key (account_id, scope, entity_type, record_key)
);

create index on public.synced_records (account_id, server_updated_at);
```

- 主键保证同一实体全局单行，天然满足"每行一条记录"。
- `server_updated_at` 供增量 pull 用作 cursor（客户端记住上次拉取的 `server_updated_at`，只拉更新的行）。
- tombstone 保留策略：删除记录保留行并置 `deleted_at`，避免多设备复活。**保留期建议 90 天**后由定时清理任务物理删除（pg_cron，V1 可先不清理，作为后续优化）。

### 3.4 sync_snapshots

对应 PRD §14。快照是恢复点，不是通用时光机。

```sql
create table public.sync_snapshots (
  snapshot_id uuid primary key default gen_random_uuid(),
  account_id uuid not null references auth.users (id) on delete cascade,
  reason text not null,               -- 'first-sync' | 'bulk-merge' | 'conflict-batch' | 'manual'
  payload jsonb not null,             -- 快照范围见 PRD §14（core 结构 + 实例配置 + 已声明可同步插件数据）
  created_at timestamptz not null default now()
);

create index on public.sync_snapshots (account_id, created_at desc);
```

快照可能较大，V1 直接存 jsonb；若单快照超出合理体积，后续迁移到 Supabase Storage 存对象、表内只留引用（后续优化）。

### 3.5 sync_conflicts

对应 PRD §13 冲突收件箱。

```sql
create table public.sync_conflicts (
  conflict_id uuid primary key default gen_random_uuid(),
  account_id uuid not null references auth.users (id) on delete cascade,
  scope text not null,
  entity_type text not null,
  record_key text not null,
  local_device_id text not null,
  remote_device_id text not null,
  local_summary text not null,
  remote_summary text not null,
  local_payload jsonb not null,
  remote_payload jsonb not null,
  status text not null default 'open' check (status in ('open','resolved','ignored')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index on public.sync_conflicts (account_id, status, created_at desc);
```

## 4. RLS 策略

即便客户端只经网关（网关用 service_role，绕过 RLS），所有表仍开 RLS 作为纵深防御：一旦未来出现直连路径或密钥泄漏边界变化，用户之间不越权。

```sql
alter table public.profiles       enable row level security;
alter table public.sync_devices   enable row level security;
alter table public.synced_records enable row level security;
alter table public.sync_snapshots enable row level security;
alter table public.sync_conflicts enable row level security;
```

每张表按"仅本账号"授权，`select auth.uid()` 包裹以命中 initplan 优化：

```sql
-- 以 synced_records 为例，其余表同构
create policy "own rows select" on public.synced_records
  for select to authenticated
  using ( (select auth.uid()) = account_id );

create policy "own rows insert" on public.synced_records
  for insert to authenticated
  with check ( (select auth.uid()) = account_id );

-- UPDATE 必须同时给 USING 和 WITH CHECK，否则可被改 account_id 转移他人
create policy "own rows update" on public.synced_records
  for update to authenticated
  using ( (select auth.uid()) = account_id )
  with check ( (select auth.uid()) = account_id );

create policy "own rows delete" on public.synced_records
  for delete to authenticated
  using ( (select auth.uid()) = account_id );
```

安全约束（来自 Supabase 安全 checklist，落地必须守）：

- 不使用 `auth.role()`，用 `TO authenticated` + 所有权谓词。
- `TO authenticated` 单独用只是认证不是授权（BOLA/IDOR），必须带 `account_id = auth.uid()` 所有权判断。
- 不用 `SECURITY DEFINER` 函数来"解决"权限报错。确需绕 RLS 的内部查询放非暴露 schema，函数体内校验 `auth.uid()`。
- 授权字段不放 `raw_user_meta_data`（用户可改）；如需放 JWT，用 `app_metadata`。

## 5. Edge Function 同步网关

### 5.1 端点形态

单一 Edge Function `sync-gateway`，按 action 分发（避免多个函数间嵌套调用触发 2026-03-11 起的递归限流）：

```txt
POST /functions/v1/sync-gateway
Authorization: Bearer <access_token>
Content-Type: application/json

{ "action": "...", "deviceId": "...", ... }
```

网关启动即用请求头的 JWT 解析出用户：

```ts
// Deno / Edge Function
const authClient = createClient(SUPABASE_URL, PUBLISHABLE_KEY, {
  global: { headers: { Authorization: req.headers.get("Authorization")! } },
})
const {
  data: { user },
  error,
} = await authClient.auth.getUser()
if (!user) return json(401, { error: "unauthorized" })

// 数据读写用 service_role client（仅网关运行时可见）
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
```

`verify_jwt` 保持开启（默认），确保只有携带有效 JWT 的请求进入函数体。

### 5.2 Actions

| action                                | 说明                                                 | 请求要点                                                                                                                                               | 响应要点                                                                  |
| ------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| `register-device`                     | 登录后注册/更新当前设备                              | `deviceId`、`name`、`type`                                                                                                                             | 设备记录，`status`                                                        |
| `push`                                | 上传本地待同步记录（已过滤前的原始体，服务端再过滤） | `records: SyncPushRecord[]`（含 `scope`/`entityType`/`recordKey`/`payload`/`clientUpdatedAt`/`deleted`）、`declarations`（本次涉及插件集合的同步声明） | 每条 `accepted` / `conflict` / `rejected(reason)`；服务端权威 `updatedAt` |
| `pull`                                | 增量拉取                                             | `sinceServerUpdatedAt` (cursor)                                                                                                                        | `records`（含 tombstone）、新 `cursor`                                    |
| `snapshot`                            | 触发一次快照                                         | `reason`、`payload`                                                                                                                                    | `snapshotId`                                                              |
| `list-devices` / `remove-device`      | 设备管理                                             | `deviceId`（remove）                                                                                                                                   | 设备列表 / 结果                                                           |
| `list-conflicts` / `resolve-conflict` | 冲突收件箱                                           | `conflictId`、`resolution`（`keep-local`/`keep-remote`/`merged`/`ignore`）、`mergedPayload?`                                                           | 冲突列表 / 结果                                                           |

### 5.3 服务端职责（PRD §15 主防线）

网关是敏感过滤和危险声明拒绝的**唯一可信执行点**：

1. **危险声明拒绝**：`push` 携带的插件同步声明，若 `excludeFields` 未覆盖、或字段名命中危险模式（`apiKey`、`token`、`accessToken`、`secret`、`password`、`filePath`、绝对路径样式的值），整条记录 `rejected`，不落库。
2. **敏感字段过滤**：按 core 内置排除表 + 插件声明 `excludeFields`，从 `payload` 剔除敏感字段后才写 `synced_records`。
3. **state-based 合并 / 冲突检测**：见 §7。
4. **快照触发**：首次开启同步、大批量合并、冲突批处理前，先写 `sync_snapshots`。

即使客户端也做一遍过滤（减少上传体积），服务端过滤不可省略——客户端不可信。

## 6. 客户端同步引擎（@tabora/sync）

### 6.1 包边界与放置

同步是 core 能力，但**不放进 `@tabora/platform-kernel`**（kernel 只放通用运行机制，不含具体后端/业务）。新建独立包 `@tabora/sync`：

```txt
packages/sync/
  src/
    index.ts
    syncEngine.ts          # 编排 push/pull/merge/重试
    localChangeQueue.ts    # SyncChange 本地队列（IndexedDB）
    changeDetector.ts      # 监听 Dexie 变更 -> 生成待上传项
    conflictModel.ts       # 冲突收件箱模型
    gatewayClient.ts       # 调用 sync-gateway 的唯一出口
    authSession.ts         # supabase-js + 自定义 storage adapter
    sensitiveFilter.ts     # 客户端预过滤（与服务端对齐，减体积）
```

依赖方向：

- `@tabora/sync` 可依赖 `@tabora/storage`（读写本地）、`@tabora/plugin-api`（类型/声明）、`supabase-js`。
- `@tabora/sync` **不被** `@tabora/ui` / `@tabora/plugin-api` 依赖，不含插件业务逻辑。
- 同步设置 UI 作为 core 设置面板贡献，经 shell 装配；插件不感知 `@tabora/sync`。
- `pnpm check:architecture` 需新增守卫：插件 package 不得依赖 `@tabora/sync`；`@tabora/plugin-api`、`@tabora/ui` 不得依赖 `@tabora/sync`。

> 待确认：包名与是否独立成包（备选：并入 `@tabora/workbench-app` 的 core runtime 层）。本方案按独立包 `@tabora/sync` 设计，最终以架构评审为准。

### 6.2 会话持有（浏览器扩展硬坑）

扩展 MV3 的 background/service worker 没有 `localStorage`，supabase-js 默认 storage 失效，session 无法持久化。必须注入自定义 storage adapter：

```ts
const chromeStorageAdapter = {
  getItem: (k) => chrome.storage.local.get(k).then((r) => r[k] ?? null),
  setItem: (k, v) => chrome.storage.local.set({ [k]: v }),
  removeItem: (k) => chrome.storage.local.remove(k),
}
createClient(url, publishableKey, {
  auth: { storage: chromeStorageAdapter, persistSession: true, autoRefreshToken: true },
})
```

playground（普通 web）用默认 `localStorage`。adapter 由 host-adapters 层按宿主注入，`@tabora/sync` 只依赖抽象 storage 接口。

### 6.3 本地变更捕获与队列

- `changeDetector` 通过 Dexie hooks（`creating`/`updating`/`deleting`）监听 `workspaces`、`pluginInstances`、`plugins`、`pluginData` 的写入。
- 每次写入生成一条本地 `SyncChange`（PRD §17，**仅本地内部结构**），入 `localChangeQueue`（存 IndexedDB 一张新表 `syncQueue`，见 §9）。
- 短延迟合并：同一 `(scope, entityType, recordKey)` 的多次变更在延迟窗口内合并为最新态，再上传（PRD §12）。
- 触发时机（PRD §12）：本地变更后短延迟、应用启动、后台回前台、网络恢复、登录成功、手动"立即同步"。

### 6.4 权威时间戳兜底

PRD §8 要求 `updatedAt` 由插件写入时维护，但插件不打或打错会静默丢数据。约束：

- core 在把插件记录纳入队列时，若 `updatedAt` 缺失或明显不合理（早于上次已知值），**用 core 侧可信时间盖写** `clientUpdatedAt`。
- 网关最终以 `server_updated_at`（服务端时间）记录落库时刻，`updated_at` 用于合并比较。LWW 比较用客户端声明的 `updatedAt`，但同值/异常时以 `server_updated_at` 打破平局，避免时钟漂移导致乱序。

### 6.5 增量 pull

- 客户端持久化每个账号的 `pullCursor`（上次 `pull` 返回的 `server_updated_at` 上界）。
- `pull` 只返回 `server_updated_at > cursor` 的行，含 tombstone。
- 本地按 tombstone 删除对应记录（core 对象删实例/分组；插件数据经 repository 删除）。

## 7. 合并与冲突

### 7.1 state-based 合并

网关处理 `push` 中每条记录：

1. 读取云端同 `(account_id, scope, entity_type, record_key)` 当前行。
2. 云端不存在 → 直接插入（`accepted`）。
3. 云端存在：
   - `last-write-wins`：比较 `updated_at`，客户端较新则覆盖（保留 tombstone 语义），否则忽略并返回云端较新态供客户端回写。
   - `record-merge`：按字段合并。字段互不重叠 → 自动合并（`accepted`）；同一字段两端都改且值不同 → 冲突。

### 7.2 冲突判定与收件箱

- 仅当 `record-merge` 下同字段并发冲突、且无法按 `updated_at` 安全取舍时，写入 `sync_conflicts`（`status='open'`），该记录本轮不覆盖云端。
- 客户端 `list-conflicts` 拉取，渲染 PRD §13 冲突条目（设备、时间、两端摘要、建议动作）。
- 用户选择 `keep-local`/`keep-remote`/`merged`/`ignore`，经 `resolve-conflict` 写回合并记录并触发一次同步。

### 7.3 首次开启同步（PRD §6.3）

- `initialize-cloud-from-local`：先 `snapshot(first-sync)`，再把本地全量作为 `push` 上传。
- `merge-cloud-with-local`：先 `snapshot(first-sync)`，`pull` 云端全量，与本地做一轮 §7.1 合并，冲突进收件箱。
- `skip-for-now`：仅登录 + 注册设备，不开同步。

## 8. 敏感字段过滤规则

core 内置排除（永不上传，PRD §15 / §7.2）：

- 任意名为 `apiKey`/`token`/`accessToken`/`refreshToken`/`secret`/`password` 的字段。
- 本机绝对路径样式的值（`/Users/...`、`C:\...`、`file://`）。
- 缓存、临时图片、OCR 原图、导出结果对应的字段/集合（插件通过不声明这些集合来排除，core 不接收即不上传）。

插件声明排除（PRD §8 `excludeFields`）：叠加在内置规则之上。

执行点：客户端 `sensitiveFilter` 预过滤（减体积）+ 网关服务端过滤（主防线）。两侧规则表同源，放 `@tabora/plugin-api` 或共享常量，避免漂移。

## 9. 本地存储增强

`@tabora/storage` 的 Dexie schema（当前 6 表，见平台技术方案 §13.2）新增同步专用表，version bump：

```txt
syncQueue: "id, [scope+entityType+recordKey], status, queuedAt"
syncMeta:  "key"   // 存 pullCursor、账号态、设备 ID、schemaVersion 等
```

约束（对齐平台技术方案 §13）：

- 同步队列是 core-owned 数据，**不混入 `pluginData`**（插件业务数据路径），也不混入 workspace 装配数据。
- 插件业务数据仍只经 repository 读写；`@tabora/sync` 读它们用于生成同步项，不改变插件访问路径。
- `syncMeta.schemaVersion` 承接 PRD §20.1 的 IndexedDB→云端结构演进：payload 带 `schema_version`，网关/客户端按版本做前向兼容或迁移。

## 10. 失败与回退

对齐 PRD §16 与平台技术方案 §14（同步失败绝不阻塞本地工作台）：

- 网关不可达 / 5xx / 网络离线：记录留在 `syncQueue`，指数退避重试，不弹阻断式错误。
- 401（会话过期）：暂停同步，提示重新登录，本地照常可用。
- 设备被移除（网关返回资格失效）：停止同步，提示重新登录注册。
- 危险声明 `rejected`：不重试该记录，记录 warning 供调试，不影响其他记录。
- 快照/恢复失败：保留原状态并给出原因（PRD §14）。

## 11. 验收（技术层，补 PRD §19 的产品验收）

- push/pull 幂等：重复上传同一记录不产生重复行、不错误覆盖较新态。
- 离线重放：离线期间多次本地写入，恢复后合并为最新态正确上传。
- LWW 正确性：并发写同一记录，`updated_at` 较新者胜；同值以 `server_updated_at` 打破平局。
- tombstone 生效：一端删除，另一端 pull 后本地删除，且不被旧态重新上传复活。
- 敏感过滤：含 `apiKey`/绝对路径的 payload 经网关后云端不含这些字段；危险声明被 `rejected`。
- RLS：用伪造 `account_id` 直连（模拟直连路径）无法读写他人行。
- 会话持久化：扩展 MV3 环境重启 service worker 后 session 仍可恢复。

## 12. 待确认 / 后续

- `@tabora/sync` 是否独立成包（vs 并入 workbench-app core runtime）——待架构评审。
- tombstone 与快照的物理清理任务（pg_cron）——V1 可暂缓，作为后续优化。
- 大快照迁移到 Supabase Storage——V1 存 jsonb，超阈值后再迁。
- 自建 SMTP 供应商选型——生产上线前必须确定。
- `SyncedRecord.payload` 的 jsonb 索引策略——按实际查询模式在实现期补 GIN 索引评估。

## 13. 验证入口

本方案落地涉及 storage schema、新包、架构守卫，属跨包变更，至少运行：

```bash
pnpm check
pnpm check:architecture
pnpm test
pnpm build
```

Supabase 侧变更（表、RLS、Edge Function）落地后，用 `get_advisors`（安全 + 性能）核对，并按 §11 技术验收编写针对同步引擎的单测与集成测试。
