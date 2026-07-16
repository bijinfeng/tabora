# S3 前端同步接入 Directus 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法跟踪。

**目标：** 前端 `packages/sync` 从 Supabase 切换到 Directus 同步网关，激活 bootstrap 的 syncManager，同步设置页接通"立即同步"。

**规格事实源：** `docs/superpowers/specs/2026-07-16-frontend-directus-sync-s3-design.md`（字段映射、错误码、边界都以规格为准）。

**技术栈：** TypeScript、SolidJS、Vitest、`@tabora/auth`（S1）、Directus `/sync/records`（S2）。

**仓库约束：** 分支 `s1-frontend-directus-auth` 继续。暂存区有用户预存的 `docs/design/docs/*` 文件（A 状态）——提交时只 add 本任务文件，绝不动用户暂存。测试从对应 package 目录跑 vitest。已知基线：后端 11 个预存失败（auth 8 + attachments 3）、前端 e2e overflowX 与 site AppShell localStorage 预存失败——都不算新回归。

---

### 任务 1：后端 RECORD_TYPES 对齐前端实体

**文件：**

- 修改：`backend/directus/extensions/directus-extension-tabora/src/sync.ts`
- 修改：`backend/directus/tests/endpoints/tabora-sync.test.ts`

- [ ] 步骤 1：改 `RECORD_TYPES = ["workspace", "pluginInstance", "plugin", "pluginData"] as const`
- [ ] 步骤 2：测试里所有 `"note"` / `"workspace_settings"` / `"plugin_data"` 类型值替换为新枚举值（types 过滤用例改为 `types: "workspace,pluginData"` 等价断言）
- [ ] 步骤 3：跑 `tests/endpoints/tabora-sync.test.ts` 全绿（18 用例），全量回归失败数 ≤ 11
- [ ] 步骤 4：commit `fix(directus): sync RECORD_TYPES 对齐前端实体枚举`

### 任务 2：`createDirectusGatewayClient`（TDD）

**文件：**

- 创建：`packages/sync/src/directusGatewayClient.ts`
- 创建：`packages/sync/src/directusGatewayClient.test.ts`
- 修改：`packages/sync/src/index.ts`（导出）

- [ ] 步骤 1：RED 测试（mock fetch）覆盖：
  - push 请求映射（entityType→type、recordKey→id、payload→data、clientUpdatedAt→client_timestamp、version:null、device_id）与 URL/headers（Bearer）
  - push 响应透传 accepted/conflicts/rejected/server_time
  - pull 请求（?since=cursor）与响应映射（type→entityType、id→recordKey、data→payload、updated_at→serverUpdatedAt、scope 推导：pluginData→plugin 其余 core、cursor←server_time）
  - pull 无 cursor 时不带 since 参数
  - 无 token → `{ ok:false, error:{ code:"AUTH_FAILED" } }`（不发请求）
  - fetch 抛异常 → NETWORK_ERROR；401 → AUTH_FAILED；400 → INVALID_PAYLOAD；500 → SERVER_ERROR
- [ ] 步骤 2：实现 `createDirectusGatewayClient({ apiBaseUrl, getAccessToken })`，返回 `{ push, pull }`，返回值形状与旧 GatewayClient 一致（`{ok:true,data}|{ok:false,error}`）
- [ ] 步骤 3：index.ts 导出 `createDirectusGatewayClient` 与相关类型；测试全绿
- [ ] 步骤 4：commit `feat(sync): Directus gateway client（push/pull 映射与错误归一）`

### 任务 3：syncEngine 适配 Directus 语义

**文件：**

- 修改：`packages/sync/src/syncEngine.ts`
- 创建/修改：`packages/sync/src/syncEngine.test.ts`

- [ ] 步骤 1：RED 测试：
  - push conflicts：server_data 按 scope/entityType 应用到本地表（同 pull 应用逻辑），对应 queue 条目被 dequeue
  - push rejected：markAsFailed(reason)
  - pull 后 cursor 存 server_time（gateway 返回的 cursor 字段）
- [ ] 步骤 2：实现：提取 pull 的"记录应用"逻辑为共享函数 `applyRemoteRecord(database, record)`，conflicts 复用它；gatewayClient 类型改为新 client 形状（version 字段移除）
- [ ] 步骤 3：包内测试全绿
- [ ] 步骤 4：commit `feat(sync): syncEngine 冲突服务端胜与 rejected 处理`

### 任务 4：syncManager 新配置 + 删除 Supabase 会话层

**文件：**

- 修改：`packages/workbench-app/src/runtime/syncManager.ts`
- 删除：`packages/sync/src/authSession.ts`
- 修改：`packages/sync/src/index.ts`（删 Supabase 导出，保留 S1 re-export）
- 修改：`packages/sync/package.json`（移除 @supabase/supabase-js）

- [ ] 步骤 1：`SyncManagerConfig` 改为 `{ database, syncQueueRepo, syncMetaRepo, host, apiBaseUrl, authClient: DirectusAuthClient }`；内部用 `createDirectusGatewayClient({ apiBaseUrl, getAccessToken: async () => (await authClient.getSession())?.accessToken ?? null })`
- [ ] 步骤 2：移除 register-device 流程：deviceId 无存量时 `crypto.randomUUID()` 存 syncMeta 后直接用
- [ ] 步骤 3：会话检查用 `authClient.getSession()`；删除 createAuthSessionManager 相关代码与 authSession.ts；index.ts 清理导出；package.json 移除 supabase 依赖 + `pnpm install`
- [ ] 步骤 4：受影响包测试全绿（sync、workbench-app）；`rg "@supabase|supabase" packages/sync packages/workbench-app -l` 无结果
- [ ] 步骤 5：commit `refactor(sync): syncManager 切换 Directus 并移除 supabase 依赖`

### 任务 5：bootstrap 激活同步 + host.sync 契约 + 设置页接线

**文件：**

- 修改：`packages/workbench-app/src/runtime/bootstrap.ts`
- 修改：`packages/plugin-api/src/manifest.ts`（host.sync）
- 修改：`packages/workbench-app/src/shell/WorkbenchShellApp.tsx`
- 修改：`packages/official-plugins/src/settings-workspace.sync.tsx`
- 创建：`packages/official-plugins/src/settings-workspace.sync.test.tsx`

- [ ] 步骤 1：bootstrap 删除死掉的 supabase 分支；`authApiBaseUrl && authClient` 时构建 syncManager（新配置）并 `start()`，挂到返回值 `syncManager`
- [ ] 步骤 2：manifest.ts host 增加 `sync?: { triggerSync(): Promise<void>; getLastSyncAt(): Promise<string | null> }`；WorkbenchShellApp 接线（syncManager 存在才注入；lastSyncAt 从 syncMetaRepo 读 `lastSyncAt`，syncManager triggerSync 成功后写入该 key——若 syncManager 未提供此语义，在 triggerSync 包装里写）
- [ ] 步骤 3：sync 设置页组件测（RED）：host.sync 未配置显示本地模式；有 host.sync 时点"立即同步"调 triggerSync 且状态更新
- [ ] 步骤 4：改 `settings-workspace.sync.tsx`：保留现有布局与 CSS 类，替换 mock 状态机为 host.sync 调用（未配置 → 现状文案"本地模式"）
- [ ] 步骤 5：受影响包测试全绿；commit `feat(sync): bootstrap 激活同步并接通同步设置页`

### 任务 6：全量验证与文档

- [ ] 步骤 1：`pnpm test`（前端全量 + 后端，基线外不新增失败）
- [ ] 步骤 2：`pnpm check`（S3 触碰文件干净；预存 notes-prototype HTML 格式问题为已知基线）
- [ ] 步骤 3：`pnpm build`
- [ ] 步骤 4：docs/README.md 阶段性实施记录登记 S3 spec+plan 并标注完成状态；commit
- [ ] 步骤 5：最终整体审查（跨任务一致性：字段映射三处一致、错误码、supabase 残留 grep），解决 critical/important 后汇报
