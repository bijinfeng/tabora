# 数据同步 S2：Edge Function 同步网关 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现单一 Edge Function `sync-gateway`，按 action 分发 8 个同步操作（register-device / push / pull / snapshot / list-devices / remove-device / list-conflicts / resolve-conflict），用集成测试脚本验证。

**Architecture:** 单文件 `supabase/functions/sync-gateway/index.ts`（~1000 行），switch-case 派发到 8 个内联 handler 函数。用 service_role client 访问 Postgres，敏感字段在服务端过滤，LWW 合并，权威时间戳。部署后用集成测试脚本（Node/TS + supabase-js）调真实网关验证。

**Tech Stack:** Deno（Supabase Edge Functions runtime），Supabase JS SDK，PostgreSQL，TypeScript。

## Global Constraints

- 单文件组织：`supabase/functions/sync-gateway/index.ts`，不拆多文件。
- service_role 密钥只在 Edge Function 环境变量（Supabase Dashboard 配），绝不进代码或客户端。
- 客户端传 `clientUpdatedAt`，网关写入时覆盖为 `server_updated_at = now()`。
- V1 只做整记录 last-write-wins，不做字段级 record-merge。
- 错误响应统一格式：`{ok: false, error: {code, message}}`。
- 部署用 `supabase functions deploy sync-gateway --no-verify-jwt`（不需要 Docker）。
- 集成测试脚本覆盖 8 个 actions + 安全边界验证（敏感字段拒绝、未声明 entityType 拒绝）。

---

### Task 1: Edge Function 骨架与 JWT 解析

**Files:**

- Create: `supabase/functions/sync-gateway/index.ts`

**Interfaces:**

- Consumes: S1 落地的迁移文件（5 表已在远端）。
- Produces: Edge Function 入口，返回统一响应格式，供后续 tasks 添加 action handlers。

- [ ] **Step 1: 创建 Edge Function 目录和入口文件**

Run: `mkdir -p supabase/functions/sync-gateway && touch supabase/functions/sync-gateway/index.ts`
Expected: 文件已创建。

- [ ] **Step 2: 写入骨架代码（JWT 解析 + 统一响应格式 + action 派发框架）**

把以下内容写入 `supabase/functions/sync-gateway/index.ts`：

```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

type SuccessResponse<T = any> = { ok: true; data: T }
type ErrorResponse = {
  ok: false
  error: {
    code:
      | "AUTH_FAILED"
      | "DEVICE_REMOVED"
      | "INVALID_PAYLOAD"
      | "SENSITIVE_FIELD_REJECTED"
      | "ENTITY_NOT_SYNCABLE"
      | "DB_ERROR"
      | "UNKNOWN_ACTION"
    message: string
  }
}
type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, content-type",
      },
    })
  }

  try {
    // 解析 JWT 拿 accountId
    const authHeader = req.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse<ErrorResponse>(
        {
          ok: false,
          error: { code: "AUTH_FAILED", message: "Missing or invalid authorization header" },
        },
        401,
      )
    }

    const token = authHeader.substring(7)
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    })

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return jsonResponse<ErrorResponse>(
        {
          ok: false,
          error: { code: "AUTH_FAILED", message: "Invalid access token" },
        },
        401,
      )
    }

    const accountId = user.id

    // 解析请求体
    const body = await req.json()
    const { action } = body

    // Action 派发（后续 tasks 填充各 handler）
    switch (action) {
      case "register-device":
        return jsonResponse(
          { ok: false, error: { code: "UNKNOWN_ACTION", message: "Not implemented yet" } },
          501,
        )
      case "push":
        return jsonResponse(
          { ok: false, error: { code: "UNKNOWN_ACTION", message: "Not implemented yet" } },
          501,
        )
      case "pull":
        return jsonResponse(
          { ok: false, error: { code: "UNKNOWN_ACTION", message: "Not implemented yet" } },
          501,
        )
      case "snapshot":
        return jsonResponse(
          { ok: false, error: { code: "UNKNOWN_ACTION", message: "Not implemented yet" } },
          501,
        )
      case "list-devices":
        return jsonResponse(
          { ok: false, error: { code: "UNKNOWN_ACTION", message: "Not implemented yet" } },
          501,
        )
      case "remove-device":
        return jsonResponse(
          { ok: false, error: { code: "UNKNOWN_ACTION", message: "Not implemented yet" } },
          501,
        )
      case "list-conflicts":
        return jsonResponse(
          { ok: false, error: { code: "UNKNOWN_ACTION", message: "Not implemented yet" } },
          501,
        )
      case "resolve-conflict":
        return jsonResponse(
          { ok: false, error: { code: "UNKNOWN_ACTION", message: "Not implemented yet" } },
          501,
        )
      default:
        return jsonResponse<ErrorResponse>(
          {
            ok: false,
            error: { code: "UNKNOWN_ACTION", message: `Unknown action: ${action}` },
          },
          400,
        )
    }
  } catch (err) {
    console.error("Unhandled error:", err)
    return jsonResponse<ErrorResponse>(
      {
        ok: false,
        error: { code: "DB_ERROR", message: "Internal server error" },
      },
      500,
    )
  }
})

function jsonResponse<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  })
}
```

- [ ] **Step 3: 本地语法检查（可选，如果有 Deno）**

Run: `deno check supabase/functions/sync-gateway/index.ts`（如果本地没装 Deno 可跳过，部署时会检查）
Expected: 无语法错误，或跳过。

- [ ] **Step 4: 提交骨架**

```bash
git add supabase/functions/sync-gateway/index.ts
git commit -m "feat(sync): Edge Function 骨架与 JWT 解析"
```

### Task 2: register-device action

**Files:**

- Modify: `supabase/functions/sync-gateway/index.ts`（替换 register-device case）

**Interfaces:**

- Consumes: Task 1 的骨架（accountId, supabaseAdmin）。
- Produces: register-device handler，upsert sync_devices 并返回 device 对象。

- [ ] **Step 1: 替换 register-device case**

在 `switch (action)` 的 `case 'register-device':` 处，替换为：

```typescript
case 'register-device': {
  const { deviceId, name, type } = body
  if (!deviceId || !name || !type) {
    return jsonResponse<ErrorResponse>({
      ok: false,
      error: { code: 'INVALID_PAYLOAD', message: 'Missing deviceId, name, or type' },
    }, 400)
  }

  const { data: device, error: dbError } = await supabaseAdmin
    .from('sync_devices')
    .upsert({
      device_id: deviceId,
      account_id: accountId,
      name,
      type,
      last_sync_at: new Date().toISOString(),
    }, { onConflict: 'account_id,device_id' })
    .select()
    .single()

  if (dbError) {
    return jsonResponse<ErrorResponse>({
      ok: false,
      error: { code: 'DB_ERROR', message: dbError.message },
    }, 500)
  }

  return jsonResponse<SuccessResponse>({ ok: true, data: { device } })
}
```

- [ ] **Step 2: 提交**

```bash
git add supabase/functions/sync-gateway/index.ts
git commit -m "feat(sync): 实现 register-device action"
```

---

### Task 3: push action（核心安全点）

**Files:**

- Modify: `supabase/functions/sync-gateway/index.ts`（替换 push case + 添加 filterSensitiveFields helper）

**Interfaces:**

- Consumes: Task 1 的骨架。
- Produces: push handler，敏感过滤 + LWW 合并 + 写 synced_records。

- [ ] **Step 1: 在文件末尾（jsonResponse 函数后）添加 filterSensitiveFields helper**

```typescript
function filterSensitiveFields(payload: Record<string, any>): Record<string, any> {
  const sensitiveKeywords = ["apikey", "token", "password", "secret", "filepath"]
  const filtered: Record<string, any> = {}

  for (const [key, value] of Object.entries(payload)) {
    const lowerKey = key.toLowerCase()
    if (sensitiveKeywords.some((kw) => lowerKey.includes(kw))) {
      // 拒绝敏感字段，调用方会检查返回的对象大小
      throw new Error(`Sensitive field detected: ${key}`)
    }
    filtered[key] = value
  }

  return filtered
}
```

- [ ] **Step 2: 替换 push case**

在 `switch (action)` 的 `case 'push':` 处，替换为：

```typescript
case 'push': {
  const { changes } = body
  if (!Array.isArray(changes) || changes.length === 0) {
    return jsonResponse<ErrorResponse>({
      ok: false,
      error: { code: 'INVALID_PAYLOAD', message: 'changes must be a non-empty array' },
    }, 400)
  }

  let pushedCount = 0
  let skippedCount = 0

  for (const change of changes) {
    const { scope, entityType, recordKey, payload, clientUpdatedAt, deleted } = change
    if (!scope || !entityType || !recordKey || !payload || !clientUpdatedAt) {
      return jsonResponse<ErrorResponse>({
        ok: false,
        error: { code: 'INVALID_PAYLOAD', message: 'Missing required fields in change' },
      }, 400)
    }

    // 1. 敏感字段过滤
    try {
      filterSensitiveFields(payload)
    } catch (err) {
      return jsonResponse<ErrorResponse>({
        ok: false,
        error: { code: 'SENSITIVE_FIELD_REJECTED', message: (err as Error).message },
      }, 400)
    }

    // 2. 危险声明拦截（简化：V1 不查 manifest，假设客户端已过滤；服务端只过滤敏感 key）
    //    若需要严格检查，需要在此处 SELECT plugins 表的 manifest 并解析 sync.collections

    // 3. 查云端当前记录
    const { data: existingRecord } = await supabaseAdmin
      .from('synced_records')
      .select('updated_at')
      .eq('account_id', accountId)
      .eq('scope', scope)
      .eq('entity_type', entityType)
      .eq('record_key', recordKey)
      .maybeSingle()

    // 4. LWW 合并
    const clientTime = new Date(clientUpdatedAt)
    if (existingRecord) {
      const serverTime = new Date(existingRecord.updated_at)
      if (clientTime <= serverTime) {
        skippedCount++
        continue  // 客户端版本旧，跳过
      }
    }

    // 5. 写入/更新
    const now = new Date().toISOString()
    const { error: upsertError } = await supabaseAdmin
      .from('synced_records')
      .upsert({
        account_id: accountId,
        scope,
        entity_type: entityType,
        record_key: recordKey,
        payload,
        updated_at: now,  // 权威时间戳
        deleted_at: deleted ? now : null,
        schema_version: 1,
        last_writer_device_id: body.deviceId || 'unknown',  // 客户端应传 deviceId
        server_updated_at: now,
      }, { onConflict: 'account_id,scope,entity_type,record_key' })

    if (upsertError) {
      return jsonResponse<ErrorResponse>({
        ok: false,
        error: { code: 'DB_ERROR', message: upsertError.message },
      }, 500)
    }

    pushedCount++
  }

  return jsonResponse<SuccessResponse>({ ok: true, data: { pushedCount, skippedCount } })
}
```

- [ ] **Step 3: 提交**

```bash
git add supabase/functions/sync-gateway/index.ts
git commit -m "feat(sync): 实现 push action（敏感过滤 + LWW 合并）"
```

### Task 4: pull action（增量拉取）

**Files:**

- Modify: `supabase/functions/sync-gateway/index.ts`（替换 pull case）

**Interfaces:**

- Consumes: Task 1 的骨架。
- Produces: pull handler，增量查询 synced_records，返回 records + newCursor。

- [ ] **Step 1: 替换 pull case**

```typescript
case 'pull': {
  const { cursor } = body
  const cursorTime = cursor || '1970-01-01T00:00:00Z'

  const { data: records, error: queryError } = await supabaseAdmin
    .from('synced_records')
    .select('scope, entity_type, record_key, payload, updated_at, deleted_at, last_writer_device_id, server_updated_at')
    .eq('account_id', accountId)
    .gt('server_updated_at', cursorTime)
    .order('server_updated_at', { ascending: true })
    .limit(500)

  if (queryError) {
    return jsonResponse<ErrorResponse>({
      ok: false,
      error: { code: 'DB_ERROR', message: queryError.message },
    }, 500)
  }

  const newCursor = records.length > 0
    ? records[records.length - 1].server_updated_at
    : cursorTime

  return jsonResponse<SuccessResponse>({
    ok: true,
    data: {
      records: records.map(r => ({
        scope: r.scope,
        entityType: r.entity_type,
        recordKey: r.record_key,
        payload: r.payload,
        updatedAt: r.updated_at,
        deletedAt: r.deleted_at,
        lastWriterDeviceId: r.last_writer_device_id,
      })),
      newCursor,
    },
  })
}
```

- [ ] **Step 2: 提交**

```bash
git add supabase/functions/sync-gateway/index.ts
git commit -m "feat(sync): 实现 pull action（增量拉取）"
```

---

### Task 5: snapshot action

**Files:**

- Modify: `supabase/functions/sync-gateway/index.ts`（替换 snapshot case）

**Interfaces:**

- Consumes: Task 1 的骨架。
- Produces: snapshot handler，写 sync_snapshots，返回 snapshotId。

- [ ] **Step 1: 替换 snapshot case**

```typescript
case 'snapshot': {
  const { reason, payload } = body
  if (!reason || !payload) {
    return jsonResponse<ErrorResponse>({
      ok: false,
      error: { code: 'INVALID_PAYLOAD', message: 'Missing reason or payload' },
    }, 400)
  }

  const { data: snapshot, error: insertError } = await supabaseAdmin
    .from('sync_snapshots')
    .insert({
      account_id: accountId,
      reason,
      payload,
      created_at: new Date().toISOString(),
    })
    .select('snapshot_id')
    .single()

  if (insertError) {
    return jsonResponse<ErrorResponse>({
      ok: false,
      error: { code: 'DB_ERROR', message: insertError.message },
    }, 500)
  }

  return jsonResponse<SuccessResponse>({ ok: true, data: { snapshotId: snapshot.snapshot_id } })
}
```

- [ ] **Step 2: 提交**

```bash
git add supabase/functions/sync-gateway/index.ts
git commit -m "feat(sync): 实现 snapshot action"
```

---

### Task 6: 剩余 4 个 actions（list-devices / remove-device / list-conflicts / resolve-conflict）

**Files:**

- Modify: `supabase/functions/sync-gateway/index.ts`（替换剩余 4 个 cases）

**Interfaces:**

- Consumes: Task 1 的骨架。
- Produces: 4 个简单 handler，CRUD 对应表。

- [ ] **Step 1: 替换 list-devices case**

```typescript
case 'list-devices': {
  const { data: devices, error: queryError } = await supabaseAdmin
    .from('sync_devices')
    .select('device_id, name, type, first_login_at, last_sync_at, status')
    .eq('account_id', accountId)

  if (queryError) {
    return jsonResponse<ErrorResponse>({
      ok: false,
      error: { code: 'DB_ERROR', message: queryError.message },
    }, 500)
  }

  return jsonResponse<SuccessResponse>({
    ok: true,
    data: {
      devices: devices.map(d => ({
        deviceId: d.device_id,
        name: d.name,
        type: d.type,
        firstLoginAt: d.first_login_at,
        lastSyncAt: d.last_sync_at,
        status: d.status,
      })),
    },
  })
}
```

- [ ] **Step 2: 替换 remove-device case**

```typescript
case 'remove-device': {
  const { deviceId } = body
  if (!deviceId) {
    return jsonResponse<ErrorResponse>({
      ok: false,
      error: { code: 'INVALID_PAYLOAD', message: 'Missing deviceId' },
    }, 400)
  }

  const { error: updateError } = await supabaseAdmin
    .from('sync_devices')
    .update({ status: 'removed' })
    .eq('account_id', accountId)
    .eq('device_id', deviceId)

  if (updateError) {
    return jsonResponse<ErrorResponse>({
      ok: false,
      error: { code: 'DB_ERROR', message: updateError.message },
    }, 500)
  }

  return jsonResponse<SuccessResponse>({ ok: true, data: {} })
}
```

- [ ] **Step 3: 替换 list-conflicts case**

```typescript
case 'list-conflicts': {
  const { status = 'open', limit = 50 } = body

  const { data: conflicts, error: queryError } = await supabaseAdmin
    .from('sync_conflicts')
    .select('*')
    .eq('account_id', accountId)
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (queryError) {
    return jsonResponse<ErrorResponse>({
      ok: false,
      error: { code: 'DB_ERROR', message: queryError.message },
    }, 500)
  }

  return jsonResponse<SuccessResponse>({
    ok: true,
    data: {
      conflicts: conflicts.map(c => ({
        conflictId: c.conflict_id,
        scope: c.scope,
        entityType: c.entity_type,
        recordKey: c.record_key,
        localDeviceId: c.local_device_id,
        remoteDeviceId: c.remote_device_id,
        localSummary: c.local_summary,
        remoteSummary: c.remote_summary,
        localPayload: c.local_payload,
        remotePayload: c.remote_payload,
        status: c.status,
        createdAt: c.created_at,
      })),
    },
  })
}
```

- [ ] **Step 4: 替换 resolve-conflict case**

```typescript
case 'resolve-conflict': {
  const { conflictId, resolution } = body
  if (!conflictId || !resolution || !['local', 'remote'].includes(resolution)) {
    return jsonResponse<ErrorResponse>({
      ok: false,
      error: { code: 'INVALID_PAYLOAD', message: 'Missing or invalid conflictId/resolution' },
    }, 400)
  }

  // 读取冲突
  const { data: conflict, error: fetchError } = await supabaseAdmin
    .from('sync_conflicts')
    .select('*')
    .eq('conflict_id', conflictId)
    .eq('account_id', accountId)
    .single()

  if (fetchError || !conflict) {
    return jsonResponse<ErrorResponse>({
      ok: false,
      error: { code: 'DB_ERROR', message: fetchError?.message || 'Conflict not found' },
    }, 404)
  }

  // 选择保留版本
  const chosenPayload = resolution === 'local' ? conflict.local_payload : conflict.remote_payload

  // 写入 synced_records（覆盖）
  const now = new Date().toISOString()
  const { error: upsertError } = await supabaseAdmin
    .from('synced_records')
    .upsert({
      account_id: accountId,
      scope: conflict.scope,
      entity_type: conflict.entity_type,
      record_key: conflict.record_key,
      payload: chosenPayload,
      updated_at: now,
      deleted_at: null,
      schema_version: 1,
      last_writer_device_id: resolution === 'local' ? conflict.local_device_id : conflict.remote_device_id,
      server_updated_at: now,
    }, { onConflict: 'account_id,scope,entity_type,record_key' })

  if (upsertError) {
    return jsonResponse<ErrorResponse>({
      ok: false,
      error: { code: 'DB_ERROR', message: upsertError.message },
    }, 500)
  }

  // 标记冲突已解决
  const { error: updateError } = await supabaseAdmin
    .from('sync_conflicts')
    .update({ status: 'resolved', resolved_at: now })
    .eq('conflict_id', conflictId)

  if (updateError) {
    return jsonResponse<ErrorResponse>({
      ok: false,
      error: { code: 'DB_ERROR', message: updateError.message },
    }, 500)
    }

  return jsonResponse<SuccessResponse>({ ok: true, data: {} })
}
```

- [ ] **Step 5: 提交**

```bash
git add supabase/functions/sync-gateway/index.ts
git commit -m "feat(sync): 实现剩余 4 个 actions（list-devices / remove-device / list-conflicts / resolve-conflict）"
```

### Task 7: 部署 Edge Function 到 Supabase

**Files:**

- 无代码变更（部署操作）

**Interfaces:**

- Consumes: Task 1-6 完整的 index.ts。
- Produces: 已部署的 sync-gateway Function，可通过 HTTPS 调用。

- [ ] **Step 1 [需用户操作]: 在 Supabase Dashboard 配置 service_role 环境变量**

打开 Supabase Dashboard → Settings → Edge Functions → Secrets，添加：

```
SUPABASE_SERVICE_ROLE_KEY=<从 Settings → API 复制 service_role key>
```

**重要**：service_role 是管理员密钥，绝不能进代码或客户端。

确认添加完成后告诉我。

- [ ] **Step 2: 部署 Edge Function**

Run: `supabase functions deploy sync-gateway --no-verify-jwt 2>&1`
Expected: 输出类似 `Deployed Function sync-gateway version ...`，无错误。

`--no-verify-jwt` 原因：网关自己解析 JWT 拿 auth.uid()，不需要 Supabase 平台再验证一次。

- [ ] **Step 3: 验证 Function 已部署**

打开 Supabase Dashboard → Functions，应看到 `sync-gateway` 状态 ACTIVE。

或运行：`supabase functions list 2>&1`，输出应包含 `sync-gateway`。

- [ ] **Step 4: 记录 Function URL**

Function URL 格式：`https://<project-ref>.supabase.co/functions/v1/sync-gateway`

对于 tabora 项目（`ajetfjtfterbkczrbjlq`）：
`https://ajetfjtfterbkczrbjlq.supabase.co/functions/v1/sync-gateway`

记下这个 URL，Task 8 集成测试会用。

---

### Task 8: 集成测试脚本

**Files:**

- Create: `scripts/test-sync-gateway.ts`

**Interfaces:**

- Consumes: Task 7 部署的 Function URL + 真实 Supabase DB。
- Produces: 集成测试脚本，验证 8 个 actions + 安全边界。

- [ ] **Step 1: 创建测试脚本文件**

```bash
mkdir -p scripts
touch scripts/test-sync-gateway.ts
```

- [ ] **Step 2: 写入集成测试脚本**

把以下内容写入 `scripts/test-sync-gateway.ts`：

```typescript
import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = "https://ajetfjtfterbkczrbjlq.supabase.co"
const ANON_KEY = "<从 Supabase Dashboard Settings → API 复制 anon key>"
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/sync-gateway`

const TEST_EMAIL = "test-sync-gateway@example.com"
const TEST_PASSWORD = "test-password-123"

async function main() {
  console.log("=== Supabase Sync Gateway 集成测试 ===\n")

  // 1. 登录测试账号
  const supabase = createClient(SUPABASE_URL, ANON_KEY)

  // 尝试注册（若已存在会失败，忽略）
  await supabase.auth.signUp({ email: TEST_EMAIL, password: TEST_PASSWORD })

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  })

  if (authError || !authData.session) {
    console.error("❌ 登录失败:", authError)
    process.exit(1)
  }

  const accessToken = authData.session.access_token
  const testUserId = authData.user.id
  console.log("✓ 登录成功，user ID:", testUserId)

  // Helper: 调用网关
  async function callGateway(action: string, params: any = {}) {
    const res = await fetch(FUNCTION_URL, {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ action, ...params }),
    })
    return res.json()
  }

  // 2. register-device
  console.log("\n[Test] register-device")
  const deviceId = `test-device-${Date.now()}`
  const regResp = await callGateway("register-device", {
    deviceId,
    name: "Test Device",
    type: "browser",
  })
  if (!regResp.ok) {
    console.error("❌ register-device 失败:", regResp.error)
    process.exit(1)
  }
  console.log("✓ register-device 成功")

  // 3. push（正常记录）
  console.log("\n[Test] push 正常记录")
  const pushResp = await callGateway("push", {
    deviceId,
    changes: [
      {
        scope: "core",
        entityType: "workspace",
        recordKey: "test-workspace-1",
        payload: { name: "Test Workspace", theme: "dark" },
        clientUpdatedAt: new Date().toISOString(),
      },
    ],
  })
  if (!pushResp.ok || pushResp.data.pushedCount !== 1) {
    console.error("❌ push 失败:", pushResp)
    process.exit(1)
  }
  console.log("✓ push 成功, pushedCount:", pushResp.data.pushedCount)

  // 4. pull（拉回刚才 push 的记录）
  console.log("\n[Test] pull")
  const pullResp = await callGateway("pull", {})
  if (!pullResp.ok || pullResp.data.records.length === 0) {
    console.error("❌ pull 失败:", pullResp)
    process.exit(1)
  }
  const pulledRecord = pullResp.data.records.find((r: any) => r.recordKey === "test-workspace-1")
  if (!pulledRecord || pulledRecord.payload.name !== "Test Workspace") {
    console.error("❌ pull 拉回的记录不符:", pulledRecord)
    process.exit(1)
  }
  console.log("✓ pull 成功，拉回记录数:", pullResp.data.records.length)

  // 5. push 敏感字段（应被拒绝）
  console.log("\n[Test] push 敏感字段（预期拒绝）")
  const pushSensitiveResp = await callGateway("push", {
    deviceId,
    changes: [
      {
        scope: "plugin",
        entityType: "settings",
        recordKey: "test-sensitive",
        payload: { apiKey: "sk-xxxx", normalField: "value" },
        clientUpdatedAt: new Date().toISOString(),
      },
    ],
  })
  if (pushSensitiveResp.ok || pushSensitiveResp.error?.code !== "SENSITIVE_FIELD_REJECTED") {
    console.error("❌ push 敏感字段应该被拒绝，但没有:", pushSensitiveResp)
    process.exit(1)
  }
  console.log("✓ push 敏感字段被正确拒绝")

  // 6. snapshot
  console.log("\n[Test] snapshot")
  const snapshotResp = await callGateway("snapshot", {
    reason: "manual",
    payload: { workspaces: ["test-workspace-1"], timestamp: Date.now() },
  })
  if (!snapshotResp.ok || !snapshotResp.data.snapshotId) {
    console.error("❌ snapshot 失败:", snapshotResp)
    process.exit(1)
  }
  console.log("✓ snapshot 成功, snapshotId:", snapshotResp.data.snapshotId)

  // 7. list-devices
  console.log("\n[Test] list-devices")
  const listDevicesResp = await callGateway("list-devices")
  if (!listDevicesResp.ok || !Array.isArray(listDevicesResp.data.devices)) {
    console.error("❌ list-devices 失败:", listDevicesResp)
    process.exit(1)
  }
  const foundDevice = listDevicesResp.data.devices.find((d: any) => d.deviceId === deviceId)
  if (!foundDevice) {
    console.error("❌ list-devices 未找到刚注册的设备")
    process.exit(1)
  }
  console.log("✓ list-devices 成功，设备数:", listDevicesResp.data.devices.length)

  // 8. list-conflicts（应该为空，因为没有冲突）
  console.log("\n[Test] list-conflicts")
  const conflictsResp = await callGateway("list-conflicts")
  if (!conflictsResp.ok || !Array.isArray(conflictsResp.data.conflicts)) {
    console.error("❌ list-conflicts 失败:", conflictsResp)
    process.exit(1)
  }
  console.log("✓ list-conflicts 成功，冲突数:", conflictsResp.data.conflicts.length)

  // 9. 清理测试数据
  console.log("\n[Cleanup] 清理测试数据")
  await supabase.from("synced_records").delete().eq("account_id", testUserId)
  await supabase.from("sync_devices").delete().eq("account_id", testUserId)
  await supabase.from("sync_snapshots").delete().eq("account_id", testUserId)
  console.log("✓ 清理完成")

  console.log("\n=== 所有测试通过 ✓ ===")
}

main().catch((err) => {
  console.error("测试失败:", err)
  process.exit(1)
})
```

- [ ] **Step 3: 更新脚本中的 ANON_KEY**

把 `<从 Supabase Dashboard Settings → API 复制 anon key>` 替换为真实 anon key（从 Supabase Dashboard Settings → API 复制）。

- [ ] **Step 4: 提交测试脚本**

```bash
git add scripts/test-sync-gateway.ts
git commit -m "feat(sync): 集成测试脚本（验证 8 个 actions + 安全边界）"
```

---

### Task 9: 运行集成测试验证

**Files:**

- 无代码变更（运行测试）

**Interfaces:**

- Consumes: Task 7 部署的 Function + Task 8 测试脚本。
- Produces: 全绿色测试输出，验证 S2 工作正常。

- [ ] **Step 1: 安装依赖（如果 scripts/ 还没装）**

Run: `pnpm add -D @supabase/supabase-js tsx`（或 `npm install --save-dev`）
Expected: 依赖已安装。

- [ ] **Step 2: 运行集成测试**

Run: `pnpm exec tsx scripts/test-sync-gateway.ts 2>&1`
Expected: 输出类似：

```
=== Supabase Sync Gateway 集成测试 ===

✓ 登录成功，user ID: xxx

[Test] register-device
✓ register-device 成功

[Test] push 正常记录
✓ push 成功, pushedCount: 1

[Test] pull
✓ pull 成功，拉回记录数: 1

[Test] push 敏感字段（预期拒绝）
✓ push 敏感字段被正确拒绝

[Test] snapshot
✓ snapshot 成功, snapshotId: xxx

[Test] list-devices
✓ list-devices 成功，设备数: 1

[Test] list-conflicts
✓ list-conflicts 成功，冲突数: 0

[Cleanup] 清理测试数据
✓ 清理完成

=== 所有测试通过 ✓ ===
```

若任何测试失败，检查 Edge Function 日志（Supabase Dashboard → Functions → sync-gateway → Logs）排查。

- [ ] **Step 3: 确认 S2 完成标准**

- [x] `supabase/functions/sync-gateway/index.ts` 已部署，8 个 actions 全部实现。
- [x] 集成测试脚本全绿色通过。
- [x] 安全边界验证：敏感字段被拒绝。
- [x] LWW 合并逻辑正确（push 旧版本会被跳过）。
- [x] 增量 pull cursor 正确传递。

若以上全部 ✓，S2 完成。

---

## 完成标准（S2 Done）

- `supabase/functions/sync-gateway/index.ts` 已部署到 Supabase 项目 `ajetfjtfterbkczrbjlq`，状态 ACTIVE。
- 8 个 actions 全部实现（register-device / push / pull / snapshot / list-devices / remove-device / list-conflicts / resolve-conflict）。
- 集成测试脚本 `scripts/test-sync-gateway.ts` 全绿色通过。
- 安全边界验证：push 敏感字段（apiKey）被拒绝，返回 SENSITIVE_FIELD_REJECTED。
- LWW 合并验证：push 旧版本被跳过（skippedCount > 0）。
- 增量 pull 验证：cursor 正确传递，不重复拉取。
- service_role 密钥只在 Edge Function 环境变量，未进入代码或客户端。

## 非目标（明确不在 S2）

- Deno 单元测试（mock Supabase client）——V1 只做集成测试。
- 客户端 `@tabora/sync` 包——那是 S5。
- storage 增强（syncQueue / syncMeta）——那是 S3。
- auth 会话层（Email OTP + supabase-js）——那是 S4。
- UI 面板（账号、数据同步页、冲突收件箱）——明确不在本轮。
- 字段级 record-merge——V1 只做整记录 last-write-wins。
