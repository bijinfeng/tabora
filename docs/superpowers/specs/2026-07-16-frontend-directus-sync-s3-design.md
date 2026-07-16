# S3 前端同步接入 Directus 设计

日期：2026-07-16

状态：设计稿（已与用户确认方向）

## 背景

S1 完成前端登录注册接入（`@tabora/auth`），S2 完成 Directus 后端同步网关（`GET/POST /sync/records`，LWW + tombstone + 敏感过滤）。S3 把前端 `packages/sync` 从 Supabase 切到 Directus，激活 bootstrap 中禁用的 syncManager，接通同步设置页。

关键发现：前端 changeDetector 产出的 core 表 entityType 是 `workspace` / `pluginInstance` / `plugin`，pluginData 表原本产出 `entityType: pluginId`（如 `todo-plugin`），与 S2 后端枚举 `note` / `workspace_settings` / `plugin_data` 均不一致。S3 分两步对齐：后端枚举改为前端真实实体；前端 changeDetector 将 pluginData 的 entityType 归一化为字面量 `"pluginData"`（pluginId 保留在 payload，不丢信息）。

## 目标

- 后端 `RECORD_TYPES` 对齐前端：`["workspace", "pluginInstance", "plugin", "pluginData"]`。
- 新建 `createDirectusGatewayClient`，替代 Supabase Edge Function client。
- syncManager 配置改为 `{ apiBaseUrl, authClient }`，bootstrap 在配置了 `shellConfig.auth.apiBaseUrl` 时激活同步。
- 同步设置页接通"立即同步"与真实状态。
- 移除 supabase-js 依赖。

## 非目标（YAGNI）

- 实时推送（WebSocket/SSE）。
- 冲突收件箱 UI（V1 服务端胜）。
- 同步范围开关、快照恢复 UI。
- 后端 register-device 端点（设备列表走 S1 的 `/auth/devices`；deviceId 纯本地生成）。

## 设计

### 1. 后端枚举对齐（S2 小修）

`backend/directus/.../sync.ts` 的 `RECORD_TYPES` 改为 `["workspace", "pluginInstance", "plugin", "pluginData"]`，`tabora-sync.test.ts` 同步更新。scope 不落库，由 entityType 推导（`pluginData` → plugin，其余 core）。

### 2. `createDirectusGatewayClient`（`packages/sync/src/directusGatewayClient.ts`）

```ts
createDirectusGatewayClient({ apiBaseUrl, getAccessToken })
```

- `push(deviceId, records)` → `POST {base}/sync/records`
  - 请求映射：`entityType→type`、`recordKey→id`、`payload→data`、`clientUpdatedAt→client_timestamp`、`deleted` 原样、`device_id=deviceId`、`version: null`（V1 用时间戳 LWW，不跟踪版本）
  - 响应：`{ accepted, conflicts, rejected, server_time }`
- `pull(cursor?)` → `GET {base}/sync/records?since=<cursor>`
  - 响应映射：`type→entityType`、`id→recordKey`、`data→payload`、`updated_at→serverUpdatedAt`、`deleted` 原样；`scope` 由 type 推导；`cursor ← server_time`
- 无 token 时返回 `AUTH_FAILED` 错误（与旧 GatewayClient 错误形状兼容：`{ ok: false, error: { code, message } }`；成功 `{ ok: true, data }`）
- fetch 异常 → `NETWORK_ERROR`；非 2xx → 按状态映射（401→AUTH_FAILED，400→INVALID_PAYLOAD，其余→SERVER_ERROR）

### 3. syncEngine 适配

- push：conflicts 按"服务端胜"处理——把 `server_data` 直接应用到本地对应表（同 pull 记录应用逻辑），并 dequeue 本地变更；rejected → `markAsFailed(reason)`
- pull：沿用现有应用逻辑，cursor 存 `server_time`
- 设备注册移除：deviceId 首次生成 `crypto.randomUUID()` 存 syncMeta（`deviceId` key），不再调 register-device

### 4. syncManager + bootstrap

- `SyncManagerConfig` 改为 `{ database, syncQueueRepo, syncMetaRepo, host, apiBaseUrl, authClient }`
- `getAccessToken` = `authClient.getSession()` 的 accessToken（自动刷新已由 S1 client 内置）
- authSession（Supabase 版）从 syncManager 移除；`packages/sync/src/authSession.ts` 删除，`index.ts` 清理相关导出
- `bootstrap.ts`：删除死掉的 supabase 分支；`shellConfig.auth?.apiBaseUrl` 存在时同时构建 authClient 与 syncManager 并 `start()`

### 5. 同步设置页

- `SettingsPanelViewProps.host` 增加 `sync?: { triggerSync(): Promise<void>; getLastSyncAt(): string | null }`（未配置时 undefined）
- `settings-workspace.sync.tsx`：有 `host.sync` 时"立即同步"调 `triggerSync`、显示真实上次同步时间；无则保持本地模式提示。最小接线，不重做整页。

### 6. 依赖清理

- `packages/sync/package.json` 移除 `@supabase/supabase-js`
- 删除 `authSession.ts` 及其导出；`getSupabaseClient` 一并删除

## 测试

- `directusGatewayClient` 单测：mock fetch，push/pull 字段映射、cursor、错误码、无 token
- `syncEngine` 单测更新：conflict 服务端胜应用、rejected markAsFailed
- `syncManager` 单测更新：新配置形状、deviceId 本地生成
- 后端枚举改动：`tabora-sync.test.ts` 回归
- 同步设置页组件测：triggerSync 调用、未配置降级

## 验证

`pnpm test`、`pnpm check`、`pnpm build`（跨包）。后端部分跑 Directus 测试套件（基线 11 个预存失败不新增）。
